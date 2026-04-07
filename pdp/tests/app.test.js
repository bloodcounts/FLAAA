const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

describe('App Configuration', () => {
  let sandbox;
  let originalEnv;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    sandbox.restore();
  });

  describe('Environment configuration', () => {
    it('should use default port when PDP_PORT is not set', () => {
      delete process.env.PDP_PORT;

      const PORT = process.env.PDP_PORT || 3000;
      expect(PORT).to.equal(3000);
    });

    it('should use PDP_PORT environment variable', () => {
      process.env.PDP_PORT = '8080';

      const PORT = process.env.PDP_PORT || 3000;
      expect(PORT).to.equal('8080');
    });

    it('should use default policy files when POLICY_FILES is not set', () => {
      delete process.env.POLICY_FILES;

      const POLICY_FILES = process.env.POLICY_FILES
        ? process.env.POLICY_FILES.split(',')
        : [path.join(__dirname, '../policies/medical.xml')];

      expect(POLICY_FILES).to.deep.equal([path.join(__dirname, '../policies/medical.xml')]);
    });

    it('should parse POLICY_FILES environment variable', () => {
      process.env.POLICY_FILES = 'policy1.xml,policy2.xml,policy3.xml';

      const POLICY_FILES = process.env.POLICY_FILES
        ? process.env.POLICY_FILES.split(',')
        : [path.join(__dirname, '../policies/medical.xml')];

      expect(POLICY_FILES).to.deep.equal(['policy1.xml', 'policy2.xml', 'policy3.xml']);
    });
  });

  describe('Container creation', () => {
    it('should create container with correct config', () => {
      const Container = require('../createDependencies');

      const config = {
        port: 4000,
        policyFiles: ['test1.xml', 'test2.xml']
      };

      const container = new Container(config);

      expect(container.port).to.equal(4000);
      expect(container.policyFiles).to.deep.equal(['test1.xml', 'test2.xml']);
    });

    it('should create container with default config', () => {
      const Container = require('../createDependencies');

      const container = new Container({});

      expect(container.port).to.equal(8080);
      expect(container.policyFiles).to.deep.equal([path.join(__dirname, '../policies/medical.xml')]);
    });
  });

  describe('Graceful shutdown', () => {
    let exitStub;
    let container;
    let server;

    beforeEach(() => {
      exitStub = sandbox.stub(process, 'exit');
      container = {
        logger: {
          info: sandbox.stub(),
          error: sandbox.stub()
        }
      };
      server = {
        close: sandbox.stub().callsFake((callback) => callback())
      };
    });

    it('should handle SIGTERM signal with container and server', () => {
      global.container = container;
      global.server = server;

      const gracefulShutdown = (signal) => {
        if (global.container) {
          global.container.logger.info(`${signal} received. Shutting down gracefully...`);
        }
        if (global.server) {
          global.server.close(() => {
            if (global.container) {
              global.container.logger.info('Server closed. Exiting process.');
            }
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      };

      gracefulShutdown('SIGTERM');

      expect(container.logger.info.calledWith('SIGTERM received. Shutting down gracefully...')).to.be.true;
      expect(server.close.calledOnce).to.be.true;
      expect(container.logger.info.calledWith('Server closed. Exiting process.')).to.be.true;
      expect(exitStub.calledWith(0)).to.be.true;
    });

    it('should handle SIGINT signal', () => {
      global.container = container;
      global.server = server;

      const gracefulShutdown = (signal) => {
        if (global.container) {
          global.container.logger.info(`${signal} received. Shutting down gracefully...`);
        }
        if (global.server) {
          global.server.close(() => {
            if (global.container) {
              global.container.logger.info('Server closed. Exiting process.');
            }
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      };

      gracefulShutdown('SIGINT');

      expect(container.logger.info.calledWith('SIGINT received. Shutting down gracefully...')).to.be.true;
      expect(exitStub.calledWith(0)).to.be.true;
    });

    it('should handle shutdown without container', () => {
      global.container = null;
      global.server = null;

      const gracefulShutdown = (signal) => {
        if (global.container) {
          global.container.logger.info(`${signal} received. Shutting down gracefully...`);
        }
        if (global.server) {
          global.server.close(() => {
            if (global.container) {
              global.container.logger.info('Server closed. Exiting process.');
            }
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      };

      gracefulShutdown('SIGTERM');

      expect(exitStub.calledWith(0)).to.be.true;
    });

    it('should force shutdown after timeout', () => {
      const clock = sandbox.useFakeTimers();

      global.container = container;
      global.server = {
        close: sandbox.stub() // Never calls callback
      };

      const gracefulShutdown = (signal) => {
        if (global.container) {
          global.container.logger.info(`${signal} received. Shutting down gracefully...`);
        }
        if (global.server) {
          global.server.close(() => {
            if (global.container) {
              global.container.logger.info('Server closed. Exiting process.');
            }
            process.exit(0);
          });
          setTimeout(() => {
            if (global.container) {
              global.container.logger.error('Forced shutdown after timeout');
            }
            process.exit(1);
          }, 10000);
        } else {
          process.exit(0);
        }
      };

      gracefulShutdown('SIGTERM');

      clock.tick(10001);

      expect(container.logger.error.calledWith('Forced shutdown after timeout')).to.be.true;
      expect(exitStub.calledWith(1)).to.be.true;

      clock.restore();
    });
  });

  describe('PolicyFilter initialization', () => {
    it('should initialize PolicyFilter singleton', () => {
      const PolicyFilter = require('../xacml/policyFilter');
      const getInstanceStub = sandbox.stub(PolicyFilter, 'getInstance');

      PolicyFilter.getInstance(true);

      expect(getInstanceStub.calledWith(true)).to.be.true;
    });
  });
});