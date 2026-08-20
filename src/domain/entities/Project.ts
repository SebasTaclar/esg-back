import { Decimal } from '@prisma/client/runtime/library';

export type ProjectServiceItem = {
  name: string;
  norm?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  subtotalWithDiscount: number;
  iva: number;
  totalPrice: number;
  rol: string;
  collaborator?: string;
  billingAccountNumber: string;
  collaboratorUnitPrice: number;
  collaboratorTotalPrice: number;
  pretaxProfit: number;
  ica: number;
  simpleTax: number;
  netProfit: number;
  entryDate: string;
  billingDate: string;
  purchaseOrderDate: string;
  purchaseOrderNumber: string;
};

export type ProjectRequest = {
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
};

export type ProjectResponse = {
  id: number;
  clientId: number;
  client?: {
    id: number;
    name: string;
    email: string;
    nit: string;
  };
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
};
