const express = require('express');
const cors = require('cors');
const expressJSDocSwagger = require('express-jsdoc-swagger');
const { corsOriginCallback } = require('./infra/utils/allowedOrigins');

const createApp = (container) => {
  const app = express();

  // Trust the first proxy (e.g. Nginx, Load Balancer)
  // This is required for express-rate-limit to correctly identify users when running behind a proxy
  app.set('trust proxy', 1);

  const corsOptions = {
    // CORS_ORIGIN, plus localhost only in development (src/infra/utils/allowedOrigins.js).
    origin: corsOriginCallback,
    credentials: true,
    // Without this, browsers block JS from reading Content-Disposition on cross-origin
    // responses, so CSV report downloads (report.js/visitor.js/visitorHistory.js stores)
    // silently fall back to their generic default filename instead of the real one.
    exposedHeaders: ['Content-Disposition'],
  };

  app.use(cors(corsOptions));

  const swaggerOptions = require('./api/swagger'); // This path will need to be fixed
  const errorHandler = container.resolve('errorHandler').errorHandler; // Resolve the method
  const rateLimiter = container.resolve('rateLimiter').methodBasedLimiter; // Resolve the method
  const requestIdMiddleware = container.resolve('requestId').requestIdMiddleware; // Resolve the method
  const loggerContext = container.resolve('loggerContext').loggerContext; // Resolve the method
  const asyncContextRunner = container.resolve('asyncContextRunner').run; // Resolve the method
  const accessLog = container.resolve('accessLog').accessLog; // Resolve the method
  const mainRouter = container.resolve('mainRouter');

  expressJSDocSwagger(app)(swaggerOptions);

  app.use(asyncContextRunner);
  app.use(requestIdMiddleware);
  app.use(loggerContext);
  app.use(accessLog);
  app.use(rateLimiter);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/v1', mainRouter);

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
