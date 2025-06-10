const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const queueController = require('../controllers/queueController');

const validate = require('../middlewares/validate');
const serviceSchema = require('../validations/service.schema');
const generalSchema = require('../validations/general.schema');

/**
 * POST /public/tickets
 * @summary Create ticket data
 * @tags Public
 * @param {object} request.body.required - ticket to serviceId data
 * @example request - example payload
 * {
 *   "serviceId": "123123-1234-1234-1234-123456789012"
 * }
 */
router.post('/tickets', validate(serviceSchema.idServiceSchema), ticketController.create);

/**
 * GET /public/queues
 * @summary Get current calling queue
 * @tags Public
 */
router.get(
  '/queues',
  validate(generalSchema.emptySchema, 'query'),
  queueController.getCallingQueue
);

module.exports = router;
