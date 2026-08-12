import { Decimal } from '@prisma/client/runtime/library';

export type ProjectServiceItem = {
  name: string;
  norm?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  collaborator?: string;
};

export type ProjectRequest = {
  clientId: number;
  consecutive: number;
  abbreviation: string;
  code: string;
  projectType?: string;
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
};

export type ProjectResponse = {
  id: number;
  consecutive: number;
  abbreviation: string;
  code: string;
  clientId: number;
  client?: {
    id: number;
    name: string;
    email: string;
    nit: string;
  };
  projectType?: string | null;
  serviceType?: string | null;
  norm?: string | null;
  status: string;
  responsible: string;
  startDate: Date;
  endDate?: Date | null;
  description: string;
  observations?: string | null;
  offer?: string | null;
  totalCost?: Decimal | number | null;
  services?: ProjectServiceItem[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateProjectRequest = {
  consecutive?: number;
  abbreviation?: string;
  code?: string;
  clientId?: number;
  projectType?: string;
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
};
