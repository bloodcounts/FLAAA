const pinoHttp = require('pino-http');

module.exports = (logger) => pinoHttp({ logger });
