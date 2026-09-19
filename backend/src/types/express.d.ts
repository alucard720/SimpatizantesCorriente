import type { RoleCode } from "@prisma/client";
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        role: RoleCode;
        municipalityIds: string[];
        sessionId: string;
      };
    }
  }
}
export {};
