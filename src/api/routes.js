const { Router } = require('express');

module.exports = ({
  counterController,
  organizationController,
  ticketController,
  queueController,
  serviceController,
  userController,
  authController,
  validateMiddleware, // Inject validateMiddleware
  counterSchema,
  organizationSchema,
  generalSchema,
  queueSchema,
  serviceSchema,
  userSchema,
  authMiddleware,
  responseFormatter, // Inject responseFormatter
}) => {
  const router = Router();

  // Public routes
  router.post('/public/login', authController.login.bind(authController));
  router.post('/public/tickets', validateMiddleware.validate(serviceSchema.idServiceSchema), ticketController.create.bind(ticketController));
  router.get(
    '/public/services',
    validateMiddleware.validate(generalSchema.emptySchema, 'query'),
    serviceController.publicServiceList.bind(serviceController)
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

  // Counter routes
  router.get('/counters', validateMiddleware.validate(counterSchema.getCounterSchema, 'query'), counterController.getAll.bind(counterController));
  router.get(
    '/counters/:counterId',
    validateMiddleware.validate(counterSchema.idCounterSchema, 'params'),
    counterController.getById.bind(counterController)
  );
  router.post('/counters', validateMiddleware.validate(counterSchema.createCounterSchema), counterController.create.bind(counterController));
  router.put(
    '/counters/:counterId',
    validateMiddleware.validate(counterSchema.idCounterSchema, 'params'),
    validateMiddleware.validate(counterSchema.updateCounterSchema),
    counterController.update.bind(counterController)
  );
  router.delete(
    '/counters/:counterId',
    validateMiddleware.validate(counterSchema.idCounterSchema, 'params'),
    counterController.remove.bind(counterController)
  );

  // Organization routes
  router.get(
    '/organizations',
    validateMiddleware.validate(organizationSchema.getOrganizationSchema, 'query'),
    organizationController.getAll.bind(organizationController)
  );
  router.get(
    '/organizations/:organizationId',
    validateMiddleware.validate(organizationSchema.idOrganizationSchema, 'params'),
    organizationController.getById.bind(organizationController)
  );
  router.post(
    '/organizations',
    validateMiddleware.validate(organizationSchema.createOrganizationSchema),
    organizationController.create.bind(organizationController)
  );
  router.put(
    '/organizations/:organizationId',
    validateMiddleware.validate(organizationSchema.idOrganizationSchema, 'params'),
    validateMiddleware.validate(organizationSchema.updateOrganizationSchema),
    organizationController.update.bind(organizationController)
  );
  router.delete(
    '/organizations/:organizationId',
    validateMiddleware.validate(organizationSchema.idOrganizationSchema, 'params'),
    organizationController.remove.bind(organizationController)
  );

  // Queue routes
  router.post('/queues/call', validateMiddleware.validate(queueSchema.callQueueSchema), queueController.callNextQueue.bind(queueController));
  router.post('/queues/action', validateMiddleware.validate(queueSchema.actionQueueSchema), queueController.actionQueueById.bind(queueController));
  router.get(
    '/queues/:serviceId',
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    validateMiddleware.validate(queueSchema.getQueueListSchema, 'query'),
    queueController.getQueueListByServiceId.bind(queueController)
  );
  router.get(
    '/queues/:serviceId/summary',
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    validateMiddleware.validate(queueSchema.getSummaryQueueSchema, 'query'),
    queueController.getTotalQueueByServiceId.bind(queueController)
  );

  // Service routes
  router.get('/services', validateMiddleware.validate(serviceSchema.getServiceSchema, 'query'), serviceController.getAll.bind(serviceController));
  router.get(
    '/services/:serviceId',
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    serviceController.getById.bind(serviceController)
  );
  router.post('/services', validateMiddleware.validate(serviceSchema.createServiceSchema), serviceController.create.bind(serviceController));
  router.put(
    '/services/:serviceId',
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    validateMiddleware.validate(serviceSchema.updateServiceSchema),
    serviceController.update.bind(serviceController)
  );
  router.delete(
    '/services/:serviceId',
    validateMiddleware.validate(serviceSchema.idServiceSchema, 'params'),
    serviceController.remove.bind(serviceController)
  );

  // User routes
  router.get('/users', validateMiddleware.validate(userSchema.getUserSchema, 'query'), userController.getAll.bind(userController));
  router.get('/users/:userId', validateMiddleware.validate(userSchema.idUserSchema, 'params'), userController.getById.bind(userController));
  router.post('/users', validateMiddleware.validate(userSchema.createUserSchema), userController.create.bind(userController));
  router.put(
    '/users/:userId',
    validateMiddleware.validate(userSchema.idUserSchema, 'params'),
    validateMiddleware.validate(userSchema.updateUserSchema),
    userController.update.bind(userController)
  );
  router.delete('/users/:userId', validateMiddleware.validate(userSchema.idUserSchema, 'params'), userController.remove.bind(userController));
  router.post('/users/logout', authController.logout.bind(authController));

  return router;
};
