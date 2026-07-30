import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config();

const { combine, timestamp, printf, colorize, errors } = winston.format;

const nodeEnv = process.env.NODE_ENV || 'development';

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), winston.format.json());

export const logger = winston.createLogger({
  level: nodeEnv === 'production' ? 'info' : 'debug',
  format: nodeEnv === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
});

export function reconfigureLogger(envNodeEnv: string) {
  const format = envNodeEnv === 'production' ? prodFormat : devFormat;
  logger.configure({
    level: envNodeEnv === 'production' ? 'info' : 'debug',
    format,
  });
}
