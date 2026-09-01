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

export type Client = {
  id: number;
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
  isActive: boolean;
  isProspect: boolean;
  observations?: string;
  showResources: boolean;
  isVisible: boolean;
  contacts?: Contact[] | null;
  resources?: Resource[] | null;
  createdAt?: Date;
  updatedAt?: Date;
};
