const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const { asyncLocalStorage } = require('./asyncContext');

class Logger {
  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format((info) => {
        const store = asyncLocalStorage.getStore();
        if (store) {
          info.transactionId = store.get('transactionId');
          info.requestContext = store.get('requestContext');
        }
        return info;
      })(),
      winston.format.json()
    );

    const transportFile = (level) =>
      new winston.transports.DailyRotateFile({
        dirname: path.join(__dirname, '../../../logs', level),
        filename: `%DATE%.${level}.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: '14d',
        level,
      });

    this.logger = winston.createLogger({
      level: 'debug',
      format: logFormat,
      transports: [
        transportFile('error'),
        transportFile('warn'),
        transportFile('info'),
        transportFile('debug'),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, stack, transactionId, requestContext }) => {
                let log = `${timestamp} ${level}: `;
                if (transactionId) {
                  log += `[${transactionId}] `;
                }
                if (requestContext) {
                  log += `[${requestContext.method} ${requestContext.path}] `;
                }
                log += stack || message;
                return log;
              }
            )
          ),
        })
      );
    }
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
