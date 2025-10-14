const Joi = require('joi');

const createCounterSchema = Joi.object({
  counterNumber: Joi.string().max(3).trim().required(),
  serviceId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required();

const updateCounterSchema = Joi.object({
  counterNumber: Joi.string().max(3).trim().required(),
  serviceId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
  isActive: Joi.boolean().required(),
}).required();

const getCounterSchema = Joi.object({
  counterNumber: Joi.string().trim().optional(),
  serviceName: Joi.string().trim().optional(),
  organizationName: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(25),
  sortBy: Joi.string().valid('counterNumber', 'createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  pagination: Joi.boolean().optional(),
});

const idCounterSchema = Joi.object({
  counterId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required(); // Ensure object is not empty

module.exports = {
  createCounterSchema,
  updateCounterSchema,
  getCounterSchema,
  idCounterSchema,
};
