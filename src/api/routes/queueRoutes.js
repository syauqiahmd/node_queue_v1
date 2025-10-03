const express = require('express');
const router = express.Router();
const controller = require('../controllers/queueController');

const validate = require('../middlewares/validate');
const serviceSchema = require('../validations/service.schema');
const queueSchema = require('../validations/queue.schema');

/**
 * POST /queues/call
 * @summary Call next queue by serviceId
 * @tags Queue
 * @security BearerAuth
 * @param {object} request.body.required - call to counter data
 * @example request - example payload
 * {
 *   "serviceId": "123123-1234-1234-1234-123456789012",
 *   "counterId": "123123-1234-1234-1234-123456789012"
 * }
 */
router.post('/call', validate(queueSchema.callQueueSchema), controller.callNextQueue);

/**
 * POST /queues/action
 * @summary Recall or resolve queue by queueId
 * @tags Queue
 * @security BearerAuth
 * @param {object} request.body.required - call to counter data
 * @example request - example payload
 * {
 *   "action": "retry",
 *   "queueId": "123123-1234-1234-1234-123456789012",
 *   "counterId": "123123-1234-1234-1234-123456789012"
 * }
 */
router.post('/action', validate(queueSchema.actionQueueSchema), controller.actionQueueById);

/**
 * GET /queues/{serviceId}
 * @summary Get queue list by serviceId
 * @tags Queue
 * @security BearerAuth
 * @param {string} serviceId.path.required - Service ID using UUID format
 * @param {query} status.query.optional get status 'in-progress' or 'completed'
 * @param {string} counterId.query.optional get queue by counterId
 */
router.get(
  '/:serviceId',
  validate(serviceSchema.idServiceSchema, 'params'),
  validate(queueSchema.getQueueListSchema, 'query'),
  controller.getQueueListByServiceId
);

/**
 * GET /queues/{serviceId}/summary
 * @summary Get total queue by serviceId
 * @tags Queue
 * @security BearerAuth
 * @param {string} serviceId.path.required - Service ID using UUID format
 * @param {query} status.query.optional get status 'in-progress' or 'completed'
 */
router.get(
  '/:serviceId/summary',
  validate(serviceSchema.idServiceSchema, 'params'),
  validate(queueSchema.getSummaryQueueSchema, 'query'),
  controller.getTotalQueueByServiceId
);

module.exports = router;
