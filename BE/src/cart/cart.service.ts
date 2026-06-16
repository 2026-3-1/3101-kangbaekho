import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepo: Repository<CartItem>,
  ) {}

  async getCart(userId: number): Promise<CartItem[]> {
    return this.cartRepo.find({ where: { user_id: userId } });
  }

  async addItem(userId: number, courseId: number): Promise<CartItem> {
    const existing = await this.cartRepo.findOne({
      where: { user_id: userId, course_id: courseId },
    });
    if (existing) {
      throw new ConflictException('이미 장바구니에 담긴 강의입니다.');
    }
    const item = this.cartRepo.create({ user_id: userId, course_id: courseId });
    return this.cartRepo.save(item);
  }

  async removeItem(userId: number, itemId: number): Promise<void> {
    const item = await this.cartRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('장바구니 항목을 찾을 수 없습니다.');
    if (item.user_id !== userId) throw new ForbiddenException();
    await this.cartRepo.remove(item);
  }

  async clearCart(userId: number): Promise<void> {
    await this.cartRepo.delete({ user_id: userId });
  }
}
