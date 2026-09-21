import type { RoleCode } from "@prisma/client";
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        role: RoleCode;
        seccionalIds: string[];
        sessionId: string;
      };
    }
  }
}
export {};
