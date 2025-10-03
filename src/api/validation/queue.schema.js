const Joi = require('joi');

const callQueueSchema = Joi.object({
  serviceId: Joi.string().uuid().required(),
  counterId: Joi.string().uuid().required(),
});
const actionQueueSchema = Joi.object({
  action: Joi.string().valid('retry', 'resolve').required(),
  queueId: Joi.string().uuid().required(),
  counterId: Joi.string().uuid().optional(),
});

const idQueueSchema = Joi.object({
  queueId: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required();

const getSummaryQueueSchema = Joi.object({
  status: Joi.string().valid('in-progress', 'completed').optional(),
});

const getQueueListSchema = Joi.object({
  status: Joi.string().valid('in-progress', 'completed').optional(),
  counterId: Joi.string().uuid().optional(),
});

module.exports = {
  callQueueSchema,
  actionQueueSchema,
  idQueueSchema,
  getSummaryQueueSchema,
  getQueueListSchema,
};
