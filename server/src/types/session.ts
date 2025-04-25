import { Request } from 'express';
import { Session } from 'express-session';

// Extend the Session interface
interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface AdminSession extends Session {
  adminUser?: AdminUser;
  selectedEarlyBirdIds?: string[];
}

// Extend the Request interface
export interface SessionRequest extends Request {
  session: AdminSession;
} 