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
    title?: string;
    entityType?: string | null;
    entityId?: number | null;
    client?: string;
    type: string;
    typeOtro?: string;
    description?: string;
    date: string;
    endDate?: string;
    modalidad?: string;
    modalidadOtro?: string;
    location?: string;
    personaContacto?: string;
    user: string;
    userOtro?: string;
    leadAuditor?: string;
    coAuditors?: string;
    normas?: string;
    isVisible?: boolean;
  }): Promise<Event> {
    return await this.prisma.event.create({
      data: {
        title: data.title,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        client: data.client,
        type: data.type,
        typeOtro: data.typeOtro,
        description: data.description,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        modalidad: data.modalidad,
        modalidadOtro: data.modalidadOtro,
        location: data.location,
        personaContacto: data.personaContacto,
        user: data.user,
        userOtro: data.userOtro,
        leadAuditor: data.leadAuditor,
        coAuditors: data.coAuditors,
        normas: data.normas,
        isVisible: data.isVisible ?? false,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.event.delete({
      where: { id },
    });
  }
}
