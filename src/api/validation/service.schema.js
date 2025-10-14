const Joi = require('joi');

const createServiceSchema = Joi.object({
  name: Joi.string().trim().required(),
  prefix: Joi.string().trim().max(2).required(),
  organizationId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required();

const updateServiceSchema = Joi.object({
  name: Joi.string().trim().required(),
  prefix: Joi.string().trim().max(2).required(),
  organizationId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
  isActive: Joi.boolean().required(),
}).required();

const getServiceSchema = Joi.object({
  name: Joi.string().trim().optional(),
  prefix: Joi.string().trim().optional(),
  organizationName: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(25),
  sortBy: Joi.string().valid('name', 'prefix', 'createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  pagination: Joi.boolean().optional(),
});

const idServiceSchema = Joi.object({
  serviceId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required(); // Ensure object is not empty

module.exports = {
  createServiceSchema,
  updateServiceSchema,
  getServiceSchema,
  idServiceSchema,
};
