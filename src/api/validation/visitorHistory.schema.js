// validations/visitorHistory.schema.js
const Joi = require('joi');

const createVisitorHistorySchema = Joi.object({
  visitorId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
  organizationId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required(); // Ensure object is not empty

const getVisitorHistorySchema = Joi.object({
  visitorId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .optional(),
  name: Joi.string().trim().optional(),
  phoneNumber: Joi.string().trim().optional(),
  email: Joi.string().trim().optional(),
  organizationId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .optional(),
  organizationName: Joi.string().trim().optional(),
  organizationFullName: Joi.string().trim().optional(),
  visitDate: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(25),
  sortBy: Joi.string().valid('visitDate', 'createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  pagination: Joi.boolean().optional(),
});

module.exports = {
  createVisitorHistorySchema,
  getVisitorHistorySchema,
};
