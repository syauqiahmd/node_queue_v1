const express = require('express');
const cors = require('cors');
const expressJSDocSwagger = require('express-jsdoc-swagger');

const createApp = (container) => {
  const app = express();

  // Trust the first proxy (e.g. Nginx, Load Balancer)
  // This is required for express-rate-limit to correctly identify users when running behind a proxy
  app.set('trust proxy', 1);

  const whitelist = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
  if (process.env.NODE_ENV === 'development') {
    whitelist.push(
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8000'
    );
  }

  const corsOptions = {
    origin: (origin, callback) => {
      const isLocalhost =
        !origin ||
        (typeof origin === 'string' &&
          (origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1') ||
            origin.startsWith('https://localhost')));
      if (isLocalhost || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };

  app.use(cors(corsOptions));

  const swaggerOptions = require('./api/swagger'); // This path will need to be fixed
  const errorHandler = container.resolve('errorHandler').errorHandler; // Resolve the method
  const rateLimiter = container.resolve('rateLimiter').methodBasedLimiter; // Resolve the method
  const requestIdMiddleware = container.resolve('requestId').requestIdMiddleware; // Resolve the method
  const loggerContext = container.resolve('loggerContext').loggerContext; // Resolve the method
  const asyncContextRunner = container.resolve('asyncContextRunner').run; // Resolve the method
  const mainRouter = container.resolve('mainRouter');

  expressJSDocSwagger(app)(swaggerOptions);

  app.use(asyncContextRunner);
  app.use(requestIdMiddleware);
  app.use(rateLimiter);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(loggerContext);

  app.use('/api/v1', mainRouter);

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
