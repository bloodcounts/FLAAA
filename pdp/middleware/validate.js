const Joi = require('joi');
const { StatusCodes } = require('http-status-codes');

const VALID_ACTIONS = [
  'task_approval', 'task-approval', 'taskapproval', 'taks_approval',
  'membership_validation', 'membership-validation', 'membershipvalidation', 'memebership_validation',
  'train',
  'evaluate',
];

const baseSchema = Joi.object({
  action: Joi.string().valid(...VALID_ACTIONS).required(),
}).unknown(true); // allow additional params — further checked per-action below

const taskSchema = Joi.object({
  action: Joi.string().required(),
  task_id: Joi.string().required(),
}).unknown(true);

const membershipSchema = Joi.object({
  action: Joi.string().required(),
  task_id: Joi.string().required(),
  node_id: Joi.string().required(),
}).unknown(true);

const trainSchema = Joi.object({
  action: Joi.string().required(),
  task_id: Joi.string().required(),
}).unknown(true);

const schemaByAction = {
  task_approval: taskSchema,
  'task-approval': taskSchema,
  taskapproval: taskSchema,
  taks_approval: taskSchema,
  membership_validation: membershipSchema,
  'membership-validation': membershipSchema,
  membershipvalidation: membershipSchema,
  memebership_validation: membershipSchema,
  train: trainSchema,
  evaluate: trainSchema,
};

function validateDecisionQuery(req, res, next) {
  const { error: baseError } = baseSchema.validate(req.query);
  if (baseError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Validation failed',
      details: baseError.details[0].message,
    });
  }

  const actionSchema = schemaByAction[req.query.action.toLowerCase()];
  if (actionSchema) {
    const { error } = actionSchema.validate(req.query);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Validation failed',
        details: error.details[0].message,
      });
    }
  }

  return next();
}

module.exports = { validateDecisionQuery };
