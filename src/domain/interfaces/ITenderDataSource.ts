import { Tender } from '@prisma/client';
import { TenderServiceItem } from '../entities/Tender';

export interface ITenderDataSource {
  getAll(page?: number, limit?: number): Promise<{ tenders: Tender[]; total: number }>;
  getById(id: number): Promise<Tender | null>;
  create(data: {
    offerCode?: string;
    type: string;
    processNumber?: string;
    clientName: string;
    service: string;
    norm?: string;
    status: string;
    publicationDate: string;
    closingDate?: string;
    estimatedValue?: number;
    serviceItems?: TenderServiceItem[];
    observations?: string;
  }): Promise<Tender>;
  update(
    id: number,
    data: {
      offerCode?: string;
      type?: string;
      processNumber?: string;
      clientName?: string;
      service?: string;
      norm?: string;
      status?: string;
      publicationDate?: string;
      closingDate?: string;
      estimatedValue?: number;
      serviceItems?: TenderServiceItem[];
      observations?: string;
    }
  ): Promise<Tender>;
  delete(id: number): Promise<void>;
  search(query: string, page: number, limit: number): Promise<{ tenders: Tender[]; total: number }>;
}
