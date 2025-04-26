import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const { method, url, ip } = req;
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Log when request starts
  logger.info(`${method} ${url} - ${ip} - ${userAgent}`);
  
  // Record start time
  const start = Date.now();
  
  // Log once response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    if (statusCode >= 400) {
      logger.warn(`${method} ${url} ${statusCode} - ${duration}ms`);
    } else {
      logger.info(`${method} ${url} ${statusCode} - ${duration}ms`);
    }
  });
  
  next();
};

export default requestLogger; 