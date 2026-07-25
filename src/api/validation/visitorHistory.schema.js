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

const exportVisitorHistoryReportSchema = Joi.object({
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
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().optional(),
})
  .custom((value, helpers) => {
    if (value.endDate) {
      const start = new Date(value.startDate);
      const maxEnd = new Date(start);
      maxEnd.setMonth(maxEnd.getMonth() + 1);
      const end = new Date(value.endDate);
      if (end > maxEnd) {
        return helpers.error('any.custom', {
          message: 'endDate must be within 1 month from startDate',
        });
      }
    }
    return value;
  })
  .required();

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
  exportVisitorHistoryReportSchema,
};
