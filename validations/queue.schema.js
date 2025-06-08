const Joi = require('joi');

const callQueueSchema = Joi.object({
  counterId: Joi.string().uuid().required(),
  serviceId: Joi.string().uuid().required(),
});
const actionQueueSchema = Joi.object({
  action: Joi.string().valid('in-progress', 'completed').required(),
  counterId: Joi.string().uuid().optional(),
});

const idQueueSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
}).required();

module.exports = {
  callQueueSchema,
  actionQueueSchema,
  idQueueSchema,
};
