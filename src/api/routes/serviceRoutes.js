const express = require('express');
const router = express.Router();
const controller = require('../controllers/serviceController');

const validate = require('../middlewares/validate');
const serviceSchema = require('../validations/service.schema');

/**
 * GET /services
 * @summary Get list of services
 * @tags Service
 * @security BearerAuth
 * @param {string} name.query.optional - Filter by service name
 * @param {string} prefix.query.optional - Filter by service prefix
 * @param {string} organizationName.query.optional - Filter by name organization
 * @param {boolean} isActive.query.optional - Filter by active status
 * @param {number} page.query.optional - Page number for pagination - default: 1
 * @param {number} pageSize.query.optional - Number of items per page - default: 10
 */
router.get('/', validate(serviceSchema.getServiceSchema, 'query'), controller.getAll);

/**
 * GET /services/{serviceId}
 * @summary Get services by ID
 * @tags Service
 * @security BearerAuth
 * @param {string} serviceId.path.required - Service ID using UUID format
 */
router.get('/:serviceId', validate(serviceSchema.idServiceSchema, 'params'), controller.getById);

/**
 * POST /services
 * @summary Create service data
 * @tags Service
 * @security BearerAuth
 * @param {object} request.body.required - Service data
 * @example request - example payload
 * {
 *   "name": "test",
 *   "prefix": "XX",
 *   "organizationId": "123123-1234-1234-1234-123456789012"
 * }
 */
router.post('/', validate(serviceSchema.createServiceSchema), controller.create);

/**
 * PUT /services/{serviceId}
 * @summary Update services by ID
 * @tags Service
 * @security BearerAuth
 * @param {string} serviceId.path.required - Service ID using UUID format
 * @param {object} request.body.required - Service data
 * @example request - example payload
 * {
 *   "name": "test",
 *   "prefix": "XX",
 *   "organizationId": "123123-1234-1234-1234-123456789012",
 *   "isActive": true
 * }
 */
router.put(
  '/:serviceId',
  validate(serviceSchema.idServiceSchema, 'params'),
  validate(serviceSchema.updateServiceSchema),
  controller.update
);

/**
 * DELETE /services/{serviceId}
 * @summary Delete services by ID
 * @tags Service
 * @security BearerAuth
 * @param {string} serviceId.path.required - Service ID using UUID format
 */
router.delete('/:serviceId', validate(serviceSchema.idServiceSchema, 'params'), controller.remove);

module.exports = router;
