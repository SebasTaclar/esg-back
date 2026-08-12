import { getPrismaClient } from '../../config/PrismaClient';
import { IEventDataSource } from '../../domain/interfaces/IEventDataSource';
import { Event } from '@prisma/client';

export class EventPrismaAdapter implements IEventDataSource {
  private prisma = getPrismaClient();

  async getAll(
    page?: number,
    limit?: number
  ): Promise<{ events: Event[]; total: number }> {
    const shouldPaginate = page !== undefined && limit !== undefined;
    const skip = shouldPaginate ? (page! - 1) * limit! : undefined;
    const take = shouldPaginate ? limit : undefined;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      this.prisma.event.count(),
    ]);

    return { events, total };
  }

  async getByEntity(entityType: string, entityId: number): Promise<Event[]> {
    return await this.prisma.event.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(data: {
    entityType: string;
    entityId: number;
    type: string;
    description: string;
    user: string;
    date: string;
  }): Promise<Event> {
    return await this.prisma.event.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        type: data.type,
        description: data.description,
        user: data.user,
        date: new Date(data.date),
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.event.delete({
      where: { id },
    });
  }
}
