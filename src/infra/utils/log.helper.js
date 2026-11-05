const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const { asyncLocalStorage } = require('./asyncContext');
const { redact } = require('./redact');

const isProduction = process.env.NODE_ENV === 'production';

// Errors nested in meta (e.g. `{ error: err }`) serialize to `{}` in JSON because their
// properties are non-enumerable. Convert them to plain objects so message/stack survive.
const serializeError = (err) => ({
  name: err.name,
  message: err.message,
  ...(err.code !== undefined && { code: err.code }),
  stack: err.stack,
});

const serializeNestedErrors = winston.format((info) => {
  const nestedErrors = Object.entries(info)
    .filter(([, value]) => value instanceof Error)
    .map(([key, value]) => [key, serializeError(value)]);
  return Object.assign(info, Object.fromEntries(nestedErrors));
});

// Attach request-scoped context. Explicit meta values win over the async store.
const requestContextFormat = winston.format((info) => {
  // Set by each entry point (server.js, jobs/cron.js, websocket.js); read at log time so
  // the order in which modules are required doesn't matter.
  if (process.env.SERVICE_NAME) {
    info.service ??= process.env.SERVICE_NAME;
  }
  const store = asyncLocalStorage.getStore();
  if (store) {
    info.transactionId ??= store.get('transactionId');
    info.requestContext ??= store.get('requestContext');
    const user = store.get('user');
    if (user?.id !== undefined) {
      info.userId ??= user.id;
    }
  }
  return info;
});

// Mask phone numbers, emails and credentials in every field (message, stack, nested meta).
// Top-level keys are rewritten in place on winston's own info object; nested values are copied
// so caller-owned objects are never modified. Symbol keys (winston internals) are untouched.
const redactFormat = winston.format((info) => {
  const redacted = redact(Object.fromEntries(Object.entries(info)));
  return Object.assign(info, redacted);
});

// Each level directory only receives its own level, instead of that level and everything
// more severe (winston's default), so one error isn't written to four files.
const onlyLevel = (level) => winston.format((info) => (info.level === level ? info : false))();

class Logger {
  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      serializeNestedErrors(),
      requestContextFormat(),
      redactFormat(),
      winston.format.json()
    );

    const transportFile = (level) =>
      new winston.transports.DailyRotateFile({
        dirname: path.join(__dirname, '../../../logs', level),
        filename: `%DATE%.${level}.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: '30d',
        level,
        format: onlyLevel(level),
      });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
      format: logFormat,
      transports: [
        transportFile('error'),
        transportFile('warn'),
        transportFile('info'),
        transportFile('debug'),
      ],
    });

    if (isProduction) {
      // PM2 already persists stdout to its own log files, so in production only echo
      // warnings and errors there to avoid storing every line twice.
      this.logger.add(
        new winston.transports.Console({ level: process.env.LOG_CONSOLE_LEVEL || 'warn' })
      );
      return;
    }
    this.logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, stack, transactionId, requestContext, userId }) => {
              let log = `${timestamp} ${level}: `;
              if (transactionId) {
                log += `[${transactionId}] `;
              }
              if (requestContext) {
                log += `[${requestContext.method} ${requestContext.path}] `;
              }
              if (userId !== undefined) {
                log += `[User:${userId}] `;
              }
              log += stack || message;
              return log;
            }
          )
        ),
      })
    );
  }

  // Expose winston's logger methods
  info(message, meta) {
    this.logger.info(message, meta);
  }

  warn(message, meta) {
    this.logger.warn(message, meta);
  }

  error(message, meta) {
    this.logger.error(message, meta);
  }

  debug(message, meta) {
    this.logger.debug(message, meta);
  }
}

module.exports = new Logger();
