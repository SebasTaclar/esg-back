export type EntityType = 'client' | 'project' | 'quote' | 'tender';

export type EventRequest = {
  entityType: EntityType;
  entityId: number;
  type: string;
  description: string;
  user: string;
  date: string;
};

export type EventResponse = {
  id: number;
  entityType: string;
  entityId: number;
  type: string;
  description: string;
  user: string;
  date: Date;
  createdAt: Date;
};
