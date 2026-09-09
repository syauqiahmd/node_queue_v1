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
  validateMiddleware,
  counterSchema,
  organizationSchema,
  generalSchema,
  queueSchema,
  serviceSchema,
  userSchema,
  visitorSchema,
  visitorHistorySchema,
  authMiddleware,
  apiKeyAuth,
}) => {
  const router = Router();

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
  });
  router.use('/public', publicRoutes);

  // Private routes (service-to-service, authenticated via X-Service-Key header)
  const privateRoutes = require('./routes/privateRoutes')({ privateController });
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
