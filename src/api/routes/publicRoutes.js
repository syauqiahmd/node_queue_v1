const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const queueController = require('../controllers/queueController');
const authController = require('../controllers/authController');
const serviceController = require('../controllers/serviceController');

const validate = require('../middlewares/validate');
const serviceSchema = require('../validations/service.schema');
const generalSchema = require('../validations/general.schema');
const queueSchema = require('../validations/queue.schema');

/**
 * POST /public/login
 * @summary Login user
 * @tags #Authorization
 * @param {object} request.body.required - ticket to serviceId data
 * @example request - example payload
 * {
 *   "userName": "test",
 *   "password": "password123"
 * }
 */
router.post('/login', authController.login);

/**
 * POST /public/tickets
 * @summary Create ticket data
 * @tags #Public
 * @param {object} request.body.required - ticket to serviceId data
 * @example request - example payload
 * {
 *   "serviceId": "123123-1234-1234-1234-123456789012"
 * }
 */
router.post('/tickets', validate(serviceSchema.idServiceSchema), ticketController.create);

/**
 * GET /public/services
 * @summary Get services list
 * @tags #Public
 */
router.get(
  '/services',
  validate(generalSchema.emptySchema, 'query'),
  serviceController.publicServiceList
);

/**
 * GET /public/queues
 * @summary Get current calling queue
 * @tags #Public
 */
router.get(
  '/queues',
  validate(generalSchema.emptySchema, 'query'),
  queueController.getCallingQueue
);

/**
 * GET /public/call-queue/{queueId}
 * @summary get queue calling sound
 * @tags #Public
 * @param {string} queueId.path.required - User ID using UUID format
 */
router.get(
  '/call-queue/:queueId',
  validate(queueSchema.idQueueSchema, 'params'),
  queueController.generateQueueCallingSound
);

module.exports = router;
