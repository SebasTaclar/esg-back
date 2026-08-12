import { Quote } from '@prisma/client';

export interface QuoteService {
  name: string;
  quantity: number;
  billingType: 'MONTHLY' | 'ANNUAL' | 'ONETIME';
  description?: string;
  value: number;
}

export interface IQuoteDataSource {
  getAll(page: number, limit: number): Promise<{ quotes: Quote[]; total: number }>;
  getById(id: number): Promise<Quote | null>;
  getByClientId(clientId: number, page: number, limit: number): Promise<{ quotes: Quote[]; total: number }>;
  getByProjectId(projectId: number, page: number, limit: number): Promise<{ quotes: Quote[]; total: number }>;
  create(data: {
    code?: string;
    clientId: number;
    projectId?: number;
    status?: string;
    totalAmount: number;
    validUntil?: string;
    observations?: string;
    services: QuoteService[];
  }): Promise<Quote>;
  update(
    id: number,
    data: {
      code?: string;
      clientId?: number;
      projectId?: number;
      status?: string;
      totalAmount?: number;
      validUntil?: string;
      observations?: string;
      services?: QuoteService[];
    }
  ): Promise<Quote>;
  delete(id: number): Promise<void>;
  search(query: string, page: number, limit: number): Promise<{ quotes: Quote[]; total: number }>;
}
