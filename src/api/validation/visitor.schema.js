// validations/visitor.schema.js
const Joi = require('joi');

const upsertVisitorSchema = Joi.object({
  name: Joi.string().trim().required(),
  phoneNumber: Joi.string().trim().required(),
  email: Joi.string().trim().email().optional().allow(null, ''),
}).required(); // Ensure object is not empty

const exportVisitorReportSchema = Joi.object({
  name: Joi.string().trim().optional(),
  phoneNumber: Joi.string().trim().optional(),
  email: Joi.string().trim().optional(),
  organizationId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .optional(),
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

const getVisitorSchema = Joi.object({
  name: Joi.string().trim().optional(),
  phoneNumber: Joi.string().trim().optional(),
  email: Joi.string().trim().optional(),
  organizationId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .optional(),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(25),
  sortBy: Joi.string().valid('name', 'phoneNumber', 'email', 'createdAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  pagination: Joi.boolean().optional(),
});

module.exports = {
  upsertVisitorSchema,
  getVisitorSchema,
  exportVisitorReportSchema,
};
