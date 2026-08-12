import { Event } from '@prisma/client';

export interface IEventDataSource {
  getAll(page?: number, limit?: number): Promise<{ events: Event[]; total: number }>;
  getByEntity(entityType: string, entityId: number): Promise<Event[]>;
  create(data: {
    entityType: string;
    entityId: number;
    type: string;
    description: string;
    user: string;
    date: string;
  }): Promise<Event>;
  delete(id: number): Promise<void>;
}
