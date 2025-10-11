const { Router } = require('express');
const counterRoutes = require('./routes/counterRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const queueRoutes = require('./routes/queueRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const userRoutes = require('./routes/userRoutes');

module.exports = ({
  counterController,
  organizationController,
  ticketController,
  queueController,
  serviceController,
  userController,
  authController,
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
  router.post('/public/login', authController.login.bind(authController));
  router.post(
    '/public/tickets',
    validateMiddleware.validate(serviceSchema.idServiceSchema),
    ticketController.create.bind(ticketController)
  );
  router.get(
    '/public/services',
    validateMiddleware.validate(generalSchema.emptySchema, 'query'),
    serviceController.publicServiceList.bind(serviceController)
  );
  router.get(
    '/public/organizations',
    validateMiddleware.validate(generalSchema.emptySchema, 'query'),
    organizationController.getPublicList.bind(organizationController)
  );
  router.get(
    '/public/queues',
    validateMiddleware.validate(generalSchema.emptySchema, 'query'),
    queueController.getCallingQueue.bind(queueController)
  );
  router.get(
    '/public/call-queue/:queueId',
    validateMiddleware.validate(queueSchema.idQueueSchema, 'params'),
    queueController.generateQueueCallingSound.bind(queueController)
  );

  // Apply authentication middleware to all routes below this point
  router.use(authMiddleware.authenticateToken);

  router.use(
    '/counters',
    counterRoutes({ counterController, authMiddleware, validateMiddleware, counterSchema })
  );
  router.use(
    '/organizations',
    organizationRoutes({
      organizationController,
      authMiddleware,
      validateMiddleware,
      organizationSchema,
    })
  );
  router.use(
    '/queues',
    queueRoutes({ queueController, authMiddleware, validateMiddleware, serviceSchema, queueSchema })
  );
  router.use(
    '/services',
    serviceRoutes({ serviceController, authMiddleware, validateMiddleware, serviceSchema })
  );
  router.use(
    '/users',
    userRoutes({ userController, authController, authMiddleware, validateMiddleware, userSchema })
  );

  return router;
};
