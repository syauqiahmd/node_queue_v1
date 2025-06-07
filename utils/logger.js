const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const { getTransactionId } = require('../utils/asyncContext');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format((info) => {
    const transactionId = getTransactionId && getTransactionId();
    if (transactionId) {
      info.transactionId = transactionId;
    }
    return info;
  })(),
  winston.format.json()
);

const transportFile = (level) =>
  new winston.transports.DailyRotateFile({
    dirname: path.join(__dirname, '../logs', level),
    filename: `%DATE%.${level}.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '14d',
    level,
  });

const logger = winston.createLogger({
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
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) =>
          stack
            ? `${timestamp} ${level}: ${message}\n${stack}`
            : `${timestamp} ${level}: ${message}`
        )
      ),
    })
  );
}

module.exports = logger;
