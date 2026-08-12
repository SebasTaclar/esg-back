import { Document } from '@prisma/client';

export interface IDocumentDataSource {
  getAll(page?: number, limit?: number): Promise<{ documents: Document[]; total: number }>;
  getByEntity(entityType: string, entityId: number): Promise<Document[]>;
  getById(id: number): Promise<Document | null>;
  create(data: {
    entityType: string;
    entityId: number;
    name: string;
    type: string;
    url: string;
    size?: number;
    user: string;
  }): Promise<Document>;
  delete(id: number): Promise<void>;
}
