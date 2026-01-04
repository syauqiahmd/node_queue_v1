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
  validateMiddleware,
  counterSchema,
  organizationSchema,
  generalSchema,
  queueSchema,
  serviceSchema,
  userSchema,
  authMiddleware,
}) => {
  const router = Router();

  // Public routes
  const publicRoutes = require('./routes/publicRoutes')({
    ticketController,
    queueController,
    authController,
    serviceController,
    organizationController,
    validateMiddleware,
    serviceSchema,
    generalSchema,
    queueSchema,
  });
  router.use('/public', publicRoutes);

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

  return router;
};
