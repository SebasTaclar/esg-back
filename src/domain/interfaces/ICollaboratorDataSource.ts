import { Collaborator } from '@prisma/client';

export interface ICollaboratorDataSource {
  getAll(page?: number, limit?: number): Promise<{ collaborators: Collaborator[]; total: number }>;
  getById(id: number): Promise<Collaborator | null>;
  create(data: {
    name: string;
    studies: string;
    mainArea: string;
    city: string;
    phone?: string;
    email?: string;
    status?: string;
    competencies?: unknown;
    documents?: unknown;
  }): Promise<Collaborator>;
  update(
    id: number,
    data: {
      name?: string;
      studies?: string;
      mainArea?: string;
      city?: string;
      phone?: string;
      email?: string;
      status?: string;
      competencies?: unknown;
      documents?: unknown;
    }
  ): Promise<Collaborator>;
  delete(id: number): Promise<void>;
  search(query: string, page: number, limit: number): Promise<{ collaborators: Collaborator[]; total: number }>;
}
