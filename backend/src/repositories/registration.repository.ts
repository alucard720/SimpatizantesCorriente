import type { Prisma } from "@prisma/client";
export const publicRegistrationSelect = {
  id: true,
  firstName: true,
  lastName: true,
  status: true,
  createdAt: true,
  schoolName: true,
  municipality: {
    select: {
      id: true,
      name: true,
      province: { select: { id: true, name: true } },
    },
  },
  school: { select: { id: true, name: true } },
} satisfies Prisma.RegistrationSelect;
export function registrationScope(
  auth: Express.Request["auth"],
): Prisma.RegistrationWhereInput {
  if (!auth) return { id: { in: [] } };
  return auth.role === "ADMIN"
    ? {}
    : { municipalityId: { in: auth.municipalityIds } };
}
