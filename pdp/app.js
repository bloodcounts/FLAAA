const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { StatusCodes } = require('http-status-codes')
const Luas = require('./xacml/luas');
const PolicyFilter = require('./xacml/policyFilter');
const decisionParams = require('./utils/decisionParams');

const app = express();

// Configuration from environment variables
const PORT = process.env.PORT || 3000;
const POLICY_FILES = process.env.POLICY_FILES
  ? process.env.POLICY_FILES.split(',')
  : [path.join(__dirname, './policies/medical.xml')];

PolicyFilter.getInstance(true);

let luas;
let server;

app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  const status = luas ? 'ready' : 'initializing';
  const statusCode = luas ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE;
  res.status(statusCode).json({ status, port: PORT });
});

// Evaluate decision
app.get('/getDecision', async (req, res) => {
  try {
    if (!luas) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: 'PDP not initialized yet' });
    }

    const action = req.query.action;
    const requestXml = decisionParams.getRequestXML(action, req.query);
    if (!requestXml) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid or missing action or required params (task_id, node_id)' });
    }

    const decision = await luas.evaluates(requestXml);
    res.json({ decision });
  } catch (err) {
    console.error('Error evaluating decision:', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to evaluate decision', details: err.message });
  }
});

// Graceful shutdown handler
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('Server closed. Exiting process.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server after initialization
async function init() {
  try {
    console.log('Initializing PDP with policy files:', POLICY_FILES);
    luas = await Luas.prototype.getPDPInstance(POLICY_FILES);
    console.log('PDP initialized successfully');

    server = app.listen(PORT, () => {
      console.log(`njsPDP listening at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
}

init();