// validations/organization.schema.js
const Joi = require('joi');

const createOrganizationSchema = Joi.object({
  name: Joi.string().trim().required(),
  fullName: Joi.string().trim().allow('', null).optional(),
  logoUrl: Joi.string().uri().optional(),
}).required(); // Ensure object is not empty

const updateOrganizationSchema = Joi.object({
  name: Joi.string().trim().required(),
  fullName: Joi.string().trim().allow('', null).optional(),
  isActive: Joi.boolean().required(),
  logoUrl: Joi.string().uri().optional(),
}).required(); // Ensure object is not empty

const getOrganizationSchema = Joi.object({
  name: Joi.string().trim().optional(),
  fullName: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(25),
  sortBy: Joi.string().valid('name', 'fullName', 'createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  pagination: Joi.boolean().optional(),
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
