import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define the format of logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info: winston.Logform.TransformableInfo) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Configure rotational file transport for all logs
const allLogsRotateTransport = new DailyRotateFile({
  filename: 'logs/all-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '150k',       // Rotate when file reaches 150KB
  maxFiles: 5,           // Keep a maximum of 5 files
  zippedArchive: true,   // Compress rotated files
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
      (info: winston.Logform.TransformableInfo) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
  ),
});

// Configure rotational file transport for error logs
const errorLogsRotateTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '150k',       // Rotate when file reaches 150KB
  maxFiles: 5,           // Keep a maximum of 5 files
  zippedArchive: true,   // Compress rotated files
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
      (info: winston.Logform.TransformableInfo) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
  ),
});

// Define transports for logs
const transports = [
  new winston.transports.Console(),
  errorLogsRotateTransport,
  allLogsRotateTransport
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger; 