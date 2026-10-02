const { Router } = require('express');

module.exports = ({
  counterController,
  organizationController,
  ticketController,
  queueController,
  serviceController,
  userController,
  authController,
  cronController,
  visitorController,
  visitorHistoryController,
  privateController,
  healthController,
  validateMiddleware,
  counterSchema,
  organizationSchema,
  generalSchema,
  queueSchema,
  serviceSchema,
  ticketSchema,
  userSchema,
  visitorSchema,
  visitorHistorySchema,
  authMiddleware,
  apiKeyAuth,
  publicRateLimiter,
  originCheck,
}) => {
  const router = Router();

  /**
   * GET /health
   * @summary Liveness/readiness probe for uptime monitors (checks database and Redis)
   * @tags #Health
   * @returns {object} 200 - All dependencies are up
   * @returns {object} 503 - One or more dependencies are down
   * @example response - 200 - Healthy
   * {
   *   "success": true,
   *   "data": {
   *     "status": "ok",
   *     "checks": { "database": "up", "redis": "up" },
   *     "uptimeSeconds": 3600
   *   },
   *   "transactionId": "3f1c..."
   * }
   * @example response - 503 - Degraded
   * {
   *   "success": false,
   *   "data": {
   *     "status": "degraded",
   *     "checks": { "database": "up", "redis": "down" },
   *     "uptimeSeconds": 3600
   *   },
   *   "transactionId": "3f1c..."
   * }
   */
  router.get('/health', healthController.check);

  // Public routes
  const publicRoutes = require('./routes/publicRoutes')({
    ticketController,
    queueController,
    authController,
    serviceController,
    organizationController,
    visitorController,
    visitorHistoryController,
    validateMiddleware,
    serviceSchema,
    generalSchema,
    queueSchema,
    visitorSchema,
    visitorHistorySchema,
    publicRateLimiter,
    originCheck,
  });
  router.use('/public', publicRoutes);

  // Private routes (service-to-service, authenticated via X-Service-Key header)
  const privateRoutes = require('./routes/privateRoutes')({
    privateController,
    serviceController,
    queueController,
    visitorController,
    ticketController,
    validateMiddleware,
    generalSchema,
    serviceSchema,
    queueSchema,
    ticketSchema,
    visitorSchema,
  });
  router.use('/private', apiKeyAuth.authenticateService, privateRoutes);

  // Protected routes
  const counterRoutes = require('./routes/counterRoutes')({
    counterController,
    authMiddleware,
    validateMiddleware,
    counterSchema,
  });
  router.use('/counters', authMiddleware.authenticateToken, counterRoutes);

  const organizationRoutes = require('./routes/organizationRoutes')({
    organizationController,
    authMiddleware,
    validateMiddleware,
    organizationSchema,
  });
  router.use('/organizations', authMiddleware.authenticateToken, organizationRoutes);

  const queueRoutes = require('./routes/queueRoutes')({
    queueController,
    authMiddleware,
    validateMiddleware,
    serviceSchema,
    queueSchema,
  });
  router.use('/queues', authMiddleware.authenticateToken, queueRoutes);

  const serviceRoutes = require('./routes/serviceRoutes')({
    serviceController,
    authMiddleware,
    validateMiddleware,
    serviceSchema,
  });
  router.use('/services', authMiddleware.authenticateToken, serviceRoutes);

  const userRoutes = require('./routes/userRoutes')({
    userController,
    authController,
    authMiddleware,
    validateMiddleware,
    userSchema,
  });
  router.use('/users', authMiddleware.authenticateToken, userRoutes);

  const authRoutes = require('./routes/authRoutes')({ authController, authMiddleware });
  router.use('/auth', authMiddleware.authenticateToken, authRoutes);

  const cronRoutes = require('./routes/cronRoutes')({
    cronController,
    authMiddleware,
    validateMiddleware,
  });
  router.use('/cron', authMiddleware.authenticateToken, cronRoutes);

  const visitorRoutes = require('./routes/visitorRoutes')({
    visitorController,
    authMiddleware,
    validateMiddleware,
    visitorSchema,
  });
  router.use('/visitors', authMiddleware.authenticateToken, visitorRoutes);

  const visitorHistoryRoutes = require('./routes/visitorHistoryRoutes')({
    visitorHistoryController,
    authMiddleware,
    validateMiddleware,
    visitorHistorySchema,
  });
  router.use('/visitor-histories', authMiddleware.authenticateToken, visitorHistoryRoutes);

  return router;
};
