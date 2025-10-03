// validations/organization.schema.js
const Joi = require('joi');

const createOrganizationSchema = Joi.object({
  name: Joi.string().trim().required(),
  fullName: Joi.string().trim().optional(),
}).required(); // Ensure object is not empty

const updateOrganizationSchema = Joi.object({
  name: Joi.string().trim().required(),
  fullName: Joi.string().trim().optional(),
  isActive: Joi.boolean().required(),
}).required(); // Ensure object is not empty

const getOrganizationSchema = Joi.object({
  name: Joi.string().trim().optional(),
  fullName: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(25),
}).prefs({
  // Ensure defaults are applied even if keys are missing
  presence: 'optional',
});

const idOrganizationSchema = Joi.object({
  organizationId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required(); // Ensure object is not empty

module.exports = {
  createOrganizationSchema,
  getOrganizationSchema,
  updateOrganizationSchema,
  idOrganizationSchema,
};
