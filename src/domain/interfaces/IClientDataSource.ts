import { Client } from '@prisma/client';

export type Contact = {
  name: string;
  position: string;
  phone: string;
  email: string;
  isPrimary: boolean;
};

export type Resource = {
  name: string;
  url: string;
  type: 'image' | 'document';
  uploadedAt: string;
};

export interface IClientDataSource {
  getAll(page?: number, limit?: number): Promise<{ clients: Client[]; total: number }>;
  getById(id: number): Promise<Client | null>;
  getByEmail(email: string): Promise<Client | null>;
  getByNit(nit: string): Promise<Client | null>;
  create(data: {
    name: string;
    nit: string;
    code?: string;
    organizationType?: string;
    norm?: string;
    city?: string;
    department?: string;
    address?: string;
    phone?: string;
    email: string;
    website?: string;
    isActive?: boolean;
    isProspect?: boolean;
    observations?: string;
    showResources?: boolean;
    contacts?: Contact[];
    resources?: Resource[];
  }): Promise<Client>;
  update(
    id: number,
    data: {
      name?: string;
      nit?: string;
      code?: string;
      organizationType?: string;
      norm?: string;
      city?: string;
      department?: string;
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
      isActive?: boolean;
      isProspect?: boolean;
      observations?: string;
      showResources?: boolean;
      contacts?: Contact[];
      resources?: Resource[];
    }
  ): Promise<Client>;
  delete(id: number): Promise<void>;
  search(query: string, page: number, limit: number): Promise<{ clients: Client[]; total: number }>;
}
