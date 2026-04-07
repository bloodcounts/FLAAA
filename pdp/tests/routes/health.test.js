const { expect } = require('chai');
const sinon = require('sinon');
const { StatusCodes } = require('http-status-codes');

describe('Health Route', () => {
  let healthRouter;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../routes/health')];
    healthRouter = require('../../routes/health');

    // Mock request, response, and next
    mockReq = {};
    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
    mockNext = sinon.stub();
  });

  describe('GET /health', () => {
    it('should return ready status when luas is initialized', () => {
      // Mock app.locals with initialized container
      mockReq.app = {
        locals: {
          container: {
            luas: {} // Mock luas object
          },
          port: 3000
        }
      };

      // Find the health route handler
      const routes = healthRouter.stack;
      const healthRoute = routes.find(layer => layer.route && layer.route.path === '/health');
      expect(healthRoute).to.exist;

      // Call the handler
      healthRoute.route.stack[0].handle(mockReq, mockRes, mockNext);

      // Verify response
      expect(mockRes.status.calledWith(StatusCodes.OK)).to.be.true;
      expect(mockRes.json.calledWith({
        status: 'ready',
        port: 3000
      })).to.be.true;
    });

    it('should return initializing status when luas is not initialized', () => {
      // Mock app.locals with uninitialized container
      mockReq.app = {
        locals: {
          container: null, // No container
          port: 8080
        }
      };

      // Find the health route handler
      const routes = healthRouter.stack;
      const healthRoute = routes.find(layer => layer.route && layer.route.path === '/health');
      expect(healthRoute).to.exist;

      // Call the handler
      healthRoute.route.stack[0].handle(mockReq, mockRes, mockNext);

      // Verify response
      expect(mockRes.status.calledWith(StatusCodes.OK)).to.be.true;
      expect(mockRes.json.calledWith({
        status: 'initializing',
        port: 8080
      })).to.be.true;
    });

    it('should return initializing status when container exists but luas is falsy', () => {
      // Mock app.locals with container but no luas
      mockReq.app = {
        locals: {
          container: {
            luas: null
          },
          port: 3000
        }
      };

      // Find the health route handler
      const routes = healthRouter.stack;
      const healthRoute = routes.find(layer => layer.route && layer.route.path === '/health');
      expect(healthRoute).to.exist;

      // Call the handler
      healthRoute.route.stack[0].handle(mockReq, mockRes, mockNext);

      // Verify response
      expect(mockRes.status.calledWith(StatusCodes.OK)).to.be.true;
      expect(mockRes.json.calledWith({
        status: 'initializing',
        port: 3000
      })).to.be.true;
    });

    it('should handle missing port gracefully', () => {
      // Mock app.locals without port
      mockReq.app = {
        locals: {
          container: {
            luas: {}
          }
          // No port specified
        }
      };

      // Find the health route handler
      const routes = healthRouter.stack;
      const healthRoute = routes.find(layer => layer.route && layer.route.path === '/health');
      expect(healthRoute).to.exist;

      // Call the handler
      healthRoute.route.stack[0].handle(mockReq, mockRes, mockNext);

      // Verify response
      expect(mockRes.status.calledWith(StatusCodes.OK)).to.be.true;
      expect(mockRes.json.calledWith({
        status: 'ready',
        port: undefined
      })).to.be.true;
    });
  });
});