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
 * @param {object} request.body.required - call to counter data
 * @example request - example payload
 * {
 *   "counterId": "123123-1234-1234-1234-123456789012"
 *   "serviceId": "123123-1234-1234-1234-123456789012"
 * }
 */
router.post('/call', validate(queueSchema.callQueueSchema), controller.getTotalQueueByServiceId); // TODO: replace controller & Implement the logic to call the next queue

/**
 * POST /queues/action/{queueId}
 * @summary Recall or resolve queue by queueId
 * @tags Queue
 * @param {string} queueId.path.required - Service ID using UUID format
 * @param {object} request.body.required - call to counter data
 * @example request - example payload
 * {
 *   "action": "retry"
 *   "counterId": "123123-1234-1234-1234-123456789012"
 * }
 */
router.post(
  '/action/:queueId',
  validate(queueSchema.idQueueSchema, 'params'),
  validate(queueSchema.actionQueueSchema),
  controller.getTotalQueueByServiceId
); // TODO: replace controller & Implement the logic to call the next queue

/**
 * GET /queues/{serviceId}
 * @summary Get queue list by serviceId
 * @tags Queue
 * @param {string} serviceId.path.required - Service ID using UUID format
 * @param {query} status.query.optional get status 'in-progress' or 'completed'
 * @param {string} counterId.query.optional get queue by counterId
 */
router.get(
  '/:serviceId',
  validate(serviceSchema.idServiceSchema, 'params'),
  controller.getQueueListByServiceId
);

/**
 * GET /queues/{serviceId}/summary
 * @summary Get total queue by serviceId
 * @tags Queue
 * @param {string} serviceId.path.required - Service ID using UUID format
 * @param {query} status.query.optional get status 'in-progress' or 'completed'
 */
router.get(
  '/:serviceId/summary',
  validate(serviceSchema.idServiceSchema, 'params'),
  controller.getTotalQueueByServiceId
);

module.exports = router;
