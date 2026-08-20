import { Project } from '@prisma/client';
import { ProjectServiceItem } from '../entities/Project';

export interface IProjectDataSource {
  getAll(page?: number, limit?: number): Promise<{ projects: Project[]; total: number }>;
  getById(id: number): Promise<Project | null>;
  getByClientId(clientId: number, page?: number, limit?: number): Promise<{ projects: Project[]; total: number }>;
  create(data: {
    clientId: number;
    serviceType?: string;
    norm?: string;
    status: string;
    responsible: string;
    startDate: string;
    endDate?: string;
    description: string;
    observations?: string;
    offer?: string;
    totalCost?: number;
    services?: ProjectServiceItem[];
  }): Promise<Project>;
  update(
    id: number,
    data: {
      clientId?: number;
      serviceType?: string;
      norm?: string;
      status?: string;
      responsible?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      observations?: string;
      offer?: string;
      totalCost?: number;
      services?: ProjectServiceItem[];
    }
  ): Promise<Project>;
  delete(id: number): Promise<void>;
  search(query: string, page: number, limit: number): Promise<{ projects: Project[]; total: number }>;
}
