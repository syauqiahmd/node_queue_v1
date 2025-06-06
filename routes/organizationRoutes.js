const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizationController');

const validate = require('../middlewares/validate');
const organizationSchema = require('../validations/organization.schema');

router.get('/', validate(organizationSchema.getOrganizationSchema, 'query'), controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(organizationSchema.createOrganizationSchema), controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
