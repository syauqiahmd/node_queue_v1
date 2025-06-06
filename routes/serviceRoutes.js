const express = require('express');
const router = express.Router();
const controller = require('../controllers/serviceController');

const validate = require('../middlewares/validate');
const serviceSchema = require('../validations/service.schema');

router.get('/', validate(serviceSchema.getServiceSchema, 'query'), controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(serviceSchema.createServiceSchema), controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
