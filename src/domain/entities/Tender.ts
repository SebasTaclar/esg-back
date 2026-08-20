import { Decimal } from '@prisma/client/runtime/library';

export type TenderServiceItem = {
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
  travelExpenses: number;
  pretaxProfit: number;
  ica: number;
  simpleTax: number;
  netProfit: number;
  stamps: number;
  withholdingTax: number;
  otherFees: number;
  bonds: number;
  finalProfit: number;
  entryDate: string;
  billingDate: string;
  purchaseOrderDate: string;
  purchaseOrderNumber: string;
  observations?: string;
};

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
  serviceItems?: TenderServiceItem[];
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
  serviceItems?: TenderServiceItem[] | null;
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
  serviceItems?: TenderServiceItem[];
  observations?: string;
};
