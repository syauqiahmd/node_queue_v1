const express = require('express');
const router = express.Router();
const controller = require('../controllers/counterController');

const validate = require('../middlewares/validate');
const counterSchema = require('../validations/counter.schema');

/**
 * GET /counters
 * @summary Get list of counters
 * @tags Counter
 * @param {string} counterNumber.query.optional - Filter by counter number
 * @param {string} serviceName.query.optional - Filter by service name
 * @param {string} organizationName.query.optional - Filter by name organization
 * @param {boolean} isActive.query.optional - Filter by active status
 * @param {number} page.query.optional - Page number for pagination - default: 1
 * @param {number} pageSize.query.optional - Number of items per page - default: 10
 */
router.get('/', validate(counterSchema.getCounterSchema, 'query'), controller.getAll);

/**
 * GET /counters/{id}
 * @summary Get counter by ID
 * @tags Counter
 * @param {string} id.path.required - Service ID using UUID format
 */
router.get('/:id', validate(counterSchema.idCounterSchema, 'params'), controller.getById);

/**
 * POST /counters
 * @summary Create service data
 * @tags Counter
 * @param {object} request.body.required - Service data
 * @example request - example payload
 * {
 *   "counterNumber": "test",
 *   "serviceId": "123123-1234-1234-1234-123456789012"
 * }
 */
router.post('/', validate(counterSchema.createCounterSchema), controller.create);

/**
 * PUT /counters/{id}
 * @summary Update counter by ID
 * @tags Counter
 * @param {string} id.path.required - Service ID using UUID format
 * @param {object} request.body.required - Service data
 * @example request - example payload
 * {
 *   "counterNumber": "001",
 *   "serviceId": "123123-1234-1234-1234-123456789012",
 *   "isActive": true
 * }
 */
router.put(
  '/:id',
  validate(counterSchema.idCounterSchema, 'params'),
  validate(counterSchema.updateCounterSchema),
  controller.update
);

/**
 * DELETE /counters/{id}
 * @summary Delete counter by ID
 * @tags Counter
 * @param {string} id.path.required - Service ID using UUID format
 */
router.delete('/:id', validate(counterSchema.idCounterSchema, 'params'), controller.remove);

module.exports = router;
