# Logging System Documentation

## Overview

The LinkedIn Clone server implements a robust logging system using Winston and winston-daily-rotate-file for log rotation. This system captures application events at various severity levels and manages log file size through automatic rotation.

## Configuration

The logging system is configured in `server/src/config/logger.ts` and provides:

- Multiple log levels (error, warn, info, http, debug)
- Console output for development
- Rotational file logging for production
- Separate error logs
- Color-coded log levels

## Log Levels

The system supports the following log levels (from highest to lowest priority):

| Level | Description | Usage |
|-------|-------------|-------|
| error | Critical errors | System failures, crashes, database connection issues |
| warn | Warning conditions | Deprecated features, resource issues, authentication failures |
| info | Informational messages | Application startup, user actions, successful operations |
| http | HTTP request logging | API requests and responses |
| debug | Detailed debugging | Verbose output for troubleshooting (development only) |

## Log Files

Logs are stored in the `logs/` directory at the project root with the following naming convention:

- `all-YYYY-MM-DD.log` - Contains all log messages
- `error-YYYY-MM-DD.log` - Contains only error-level messages
- Older log files are automatically compressed with the `.gz` extension

## Log Rotation

The system implements automatic log rotation with the following settings:

- Files rotate daily (new log file each day)
- Files also rotate when they reach 150KB in size
- Maximum of 5 log files are kept for each type
- Older log files are automatically compressed

## Usage in Code

To use the logger in your code:

```typescript
import logger from '../config/logger';

// Log examples
logger.error('Database connection failed');
logger.warn('User attempted to access restricted resource');
logger.info('User successfully registered');
logger.http('GET /api/users - 200');
logger.debug('Processing request with parameters:', { id: 123, name: 'Test' });
```

## Request Logger Middleware

The application includes a request logging middleware (`requestLogger.ts`) that automatically logs:

- Incoming HTTP requests (method, URL, IP, user agent)
- Response status codes
- Request processing time

This middleware is applied to all routes and provides comprehensive HTTP request tracking.

## Log Cleanup

A utility function (`cleanupOldLogs`) is implemented to remove legacy log files that may have been created before the rotation strategy was implemented. This runs automatically when the server starts.

## Viewing Logs

For development:
- Check the console output

For production:
- SSH into the server
- Navigate to the logs directory: `cd logs/`
- View latest logs: `cat all-YYYY-MM-DD.log` or `cat error-YYYY-MM-DD.log`
- For compressed logs: `gunzip -c all-YYYY-MM-DD.log.gz | less`

## Log Format

The standard log format is:
```
YYYY-MM-DD HH:mm:ss:ms LEVEL: Message
```

For example:
```
2023-05-24 14:32:45:123 info: Server started on port 5001
```

## Considerations for Production

- Monitor disk space usage by log files
- Consider implementing log aggregation solutions for distributed deployments
- Add log rotation monitoring to ensure it's functioning correctly
- Remember that debug-level logging is disabled in production to reduce overhead 