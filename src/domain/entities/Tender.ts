import { Decimal } from '@prisma/client/runtime/library';

export type TenderRequest = {
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
  observations?: string;
};

export type TenderResponse = {
  id: number;
  offerCode?: string | null;
  type: string;
  processNumber?: string | null;
  clientName: string;
  service: string;
  norm?: string | null;
  status: string;
  publicationDate: Date;
  closingDate?: Date | null;
  estimatedValue?: Decimal | number | null;
  observations?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateTenderRequest = {
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
  observations?: string;
};
