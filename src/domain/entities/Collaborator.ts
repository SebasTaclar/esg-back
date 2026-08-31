export type Competency = {
  area: string;
  norm: string;
  description?: string;
};

export type DocumentInfo = {
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type Collaborator = {
  id: number;
  name: string;
  studies: string;
  mainArea: string;
  city: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  competencies?: Competency[] | null;
  documents?: DocumentInfo[] | null;
  createdAt?: Date;
  updatedAt?: Date;
};
