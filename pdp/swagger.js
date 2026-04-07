const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PDP — Policy Decision Point',
      version: '1.2.2',
      description:
        'XACML 3.0 Policy Decision Point for federated learning governance. '
        + 'Evaluates access control policies and returns Permit/Deny decisions.',
    },
    tags: [
      { name: 'Decision', description: 'Policy evaluation endpoints' },
      { name: 'System', description: 'Health and operational endpoints' },
    ],
  },
  apis: ['./swagger/*.yaml'],
};

const spec = swaggerJsdoc(options);

module.exports = { spec, swaggerUi };
