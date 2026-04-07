const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const Container = require('./createDependencies');
const PolicyFilter = require('./xacml/policyFilter');
const requestLoggerFactory = require('./middleware/requestLogger');
const errorHandlerFactory = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
const decisionRouter = require('./routes/decision');
const { spec, swaggerUi } = require('./swagger');

const PORT = process.env.PDP_PORT || 3000;
const POLICY_FILES = process.env.POLICY_FILES
  ? process.env.POLICY_FILES.split(',')
  : [path.join(__dirname, './policies/medical.xml')];

PolicyFilter.getInstance(true);

const app = express();

// Middleware
app.use(bodyParser.json());

// OpenAPI docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

// Routes
app.use(healthRouter);
app.use(decisionRouter);

// Centralised error handler (must be last)
// app.use(errorHandler); // Will be set up after container initialization

// Graceful shutdown
let server;
let container; // Will be set after initialization

function gracefulShutdown(signal) {
  if (container) {
    container.logger.info(`${signal} received. Shutting down gracefully...`);
  }
  if (server) {
    server.close(() => {
      if (container) {
        container.logger.info('Server closed. Exiting process.');
      }
      process.exit(0);
    });
    setTimeout(() => {
      if (container) {
        container.logger.error('Forced shutdown after timeout');
      }
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function init() {
  try {
    container = await new Container({ port: PORT, policyFiles: POLICY_FILES }).init();

    container.logger.info('Initializing PDP with policy files: %s', POLICY_FILES.join(', '));
    container.logger.info('PDP initialized successfully');

    // Set up middleware that requires the loggers after container initialization
    app.use(requestLoggerFactory(container.logger));
    app.use(errorHandlerFactory(container.logger));

    // Expose container and port to route handlers via app.locals
    app.locals.container = container;
    app.locals.port = container.port;

    server = app.listen(container.port, () => {
      container.logger.info('PDP listening at http://localhost:%d', container.port);
      container.logger.info('API docs available at http://localhost:%d/docs', container.port);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Initialization failed: %s', err.stack || err);
    process.exit(1);
  }
}

init();
