export type Role = "ADMIN" | "LEADER";
export type Status = "PENDING" | "VERIFIED" | "ARCHIVED";
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  municipalityIds?: string[];
}
export interface CatalogItem {
  id: string;
  name: string;
  code?: string | null;
}
export interface Privacy {
  version: string;
  controller: string;
  contact: string;
  retention: string;
  purpose: string;
  fields: string;
  access: string;
  rights: string;
}
export interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  status: Status;
  createdAt: string;
  schoolName: string | null;
  school: CatalogItem | null;
  municipality: CatalogItem & { province: CatalogItem };
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Leader {
  id: string;
  name: string;
  active: boolean;
  municipalities: { municipalityId: string; municipality: { name: string } }[];
  _count: { users: number };
}
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  role: { code: Role };
  leader: { id: string; municipalities: { municipalityId: string }[] } | null;
}
export interface Audit {
  id: string;
  action: string;
  actorId: string | null;
  entityType: string;
  entityId: string | null;
  reason: string | null;
  requestId: string;
  createdAt: string;
}
