import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

/**
 * Utility to clean up old log files that may have been created
 * before implementing the rotation strategy
 */
export const cleanupOldLogs = (): void => {
  try {
    // Logs directory path
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Check if directory exists
    if (!fs.existsSync(logsDir)) {
      return;
    }
    
    // Get all files in the logs directory
    const files = fs.readdirSync(logsDir);
    
    // Files to remove (non-rotational log files)
    const filesToRemove = files.filter(file => 
      file === 'all.log' || 
      file === 'error.log' || 
      (file.startsWith('all-') && !file.includes('%DATE%')) ||
      (file.startsWith('error-') && !file.includes('%DATE%'))
    );
    
    // Remove each file
    filesToRemove.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.unlinkSync(filePath);
      logger.info(`Removed old log file: ${file}`);
    });
    
    if (filesToRemove.length > 0) {
      logger.info(`Cleaned up ${filesToRemove.length} old log files`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error cleaning up old log files: ${errorMessage}`);
  }
}; 