// validations/organization.schema.js
const Joi = require('joi');

const createUserSchema = Joi.object({
  userName: Joi.string().trim().required(),
  fullName: Joi.string().trim().required(),
  password: Joi.string().trim().required(),
  role: Joi.string().valid('ADMIN', 'USER').required(),
  organizationId: Joi.when('role', {
    is: 'USER',
    then: Joi.string()
      .guid({ version: ['uuidv4', 'uuidv5'] })
      .required(),
    otherwise: Joi.forbidden(),
  }),
}).required(); // Ensure object is not empty

const updateUserSchema = Joi.object({
  userName: Joi.string().trim().required(),
  fullName: Joi.string().trim().required(),
  password: Joi.string().trim().optional(),
  role: Joi.string().valid('ADMIN', 'USER').required(),
  organizationId: Joi.when('role', {
    is: 'USER',
    then: Joi.string()
      .guid({ version: ['uuidv4', 'uuidv5'] })
      .required(),
    otherwise: Joi.forbidden(),
  }),
  isActive: Joi.boolean().required(),
}).required(); // Ensure object is not empty

const getUserSchema = Joi.object({
  userName: Joi.string().trim().optional(),
  fullName: Joi.string().trim().optional(),
  role: Joi.string().valid('ADMIN', 'USER').optional(),
  organization: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(25),
  sortBy: Joi.string().valid('userName', 'fullName', 'role', 'createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

const idUserSchema = Joi.object({
  userId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required(); // Ensure object is not empty

module.exports = {
  createUserSchema,
  getUserSchema,
  updateUserSchema,
  idUserSchema,
};
