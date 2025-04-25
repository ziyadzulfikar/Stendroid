import { Request, Response, NextFunction } from 'express';
import { SessionRequest } from '../types/session';

export const checkAdminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const req2 = req as SessionRequest;
  
  if (!req2.session || !req2.session.adminUser || !req2.session.adminUser.isAdmin) {
    res.status(403).render('error', { 
      status: 403, 
      message: 'Access Denied' 
    });
    return;
  }
  
  next();
}; 