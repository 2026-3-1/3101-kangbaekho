import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      role: dto.role ?? 'student',
    });
    const saved = await this.userRepository.save(user);

    await this.audit.record({
      actor_id: saved.id,
      actor_role: saved.role,
      action: AuditService.actions.USER_REGISTER,
      target_type: 'user',
      target_id: saved.id,
      detail: { email: saved.email, name: saved.name, role: saved.role },
    });

    const token = this.jwtService.sign({ sub: saved.id, email: saved.email, role: saved.role });
    const { password: _, ...userWithoutPassword } = saved;
    return { access_token: token, user: userWithoutPassword };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;
    return { access_token: token, user: userWithoutPassword };
  }
}
