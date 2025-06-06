const Joi = require('joi');

const createServiceSchema = Joi.object({
  name: Joi.string().trim().required(),
  prefix: Joi.string().trim().max(2).required(),
  organizationId: Joi.string().trim().required(),
}).required();

const getServiceSchema = Joi.object({
  name: Joi.string().trim().optional(),
  prefix: Joi.string().trim().optional(),
  organizationName: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(25),
}).prefs({
  // Ensure defaults are applied even if keys are missing
  presence: 'optional',
});

module.exports = {
  createServiceSchema,
  getServiceSchema
};
