const { expect } = require('chai');
const sinon = require('sinon');
const { StatusCodes } = require('http-status-codes');

describe('Decision Route', () => {
  let decisionRouter;
  let mockReq;
  let mockRes;
  let mockNext;
  let mockLuas;
  let mockDecisionParamsBuilder;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../routes/decision')];
    decisionRouter = require('../../routes/decision');

    // Mock dependencies
    mockLuas = {
      evaluates: sinon.stub().resolves({ decision: 'Permit' })
    };

    mockDecisionParamsBuilder = {
      build: sinon.stub().returns('<xacml-request>mock xml</xacml-request>')
    };

    // Mock request, response, and next
    mockReq = {
      query: {},
      app: {
        locals: {
          container: {
            luas: mockLuas,
            decisionParamsBuilder: mockDecisionParamsBuilder
          }
        }
      }
    };

    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    mockNext = sinon.stub();
  });

  describe('GET /getDecision', () => {
    it('should return decision when request is valid and PDP is initialized', async () => {
      // Setup valid request
      mockReq.query = {
        action: 'task_approval',
        task_id: 'task123'
      };

      // Find the decision route handler
      const routes = decisionRouter.stack;
      const decisionRoute = routes.find(layer => layer.route && layer.route.path === '/getDecision');
      expect(decisionRoute).to.exist;

      // Call the handler (skip validation middleware for this test)
      await decisionRoute.route.stack[1].handle(mockReq, mockRes, mockNext);

      // Verify decisionParamsBuilder was called correctly
      expect(mockDecisionParamsBuilder.build.calledWith('task_approval', mockReq.query)).to.be.true;

      // Verify luas.evaluates was called with the XML
      expect(mockLuas.evaluates.calledWith('<xacml-request>mock xml</xacml-request>')).to.be.true;

      // Verify response
      expect(mockRes.json.calledWith({ decision: { decision: 'Permit' } })).to.be.true;
    });

    it('should return SERVICE_UNAVAILABLE when PDP is not initialized', async () => {
      // Remove luas from container
      mockReq.app.locals.container.luas = null;

      mockReq.query = {
        action: 'task_approval',
        task_id: 'task123'
      };

      // Find the decision route handler
      const routes = decisionRouter.stack;
      const decisionRoute = routes.find(layer => layer.route && layer.route.path === '/getDecision');
      expect(decisionRoute).to.exist;

      // Call the handler (skip validation middleware)
      await decisionRoute.route.stack[1].handle(mockReq, mockRes, mockNext);

      // Verify response
      expect(mockRes.status.calledWith(StatusCodes.SERVICE_UNAVAILABLE)).to.be.true;
      expect(mockRes.json.calledWith({ error: 'PDP not initialized yet' })).to.be.true;
    });

    it('should return BAD_REQUEST when decisionParamsBuilder returns null', async () => {
      // Make decisionParamsBuilder return null (invalid task/node)
      mockDecisionParamsBuilder.build.returns(null);

      mockReq.query = {
        action: 'task_approval',
        task_id: 'invalid_task'
      };

      // Find the decision route handler
      const routes = decisionRouter.stack;
      const decisionRoute = routes.find(layer => layer.route && layer.route.path === '/getDecision');
      expect(decisionRoute).to.exist;

      // Call the handler (skip validation middleware)
      await decisionRoute.route.stack[1].handle(mockReq, mockRes, mockNext);

      // Verify decisionParamsBuilder was called
      expect(mockDecisionParamsBuilder.build.calledWith('task_approval', mockReq.query)).to.be.true;

      // Verify response
      expect(mockRes.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
      expect(mockRes.json.calledWith({
        error: 'Could not build XACML request — check task_id / node_id exist in policy data'
      })).to.be.true;
    });

    it('should handle membership validation action', async () => {
      mockReq.query = {
        action: 'membership_validation',
        task_id: 'task123',
        node_id: 'node456'
      };

      // Find the decision route handler
      const routes = decisionRouter.stack;
      const decisionRoute = routes.find(layer => layer.route && layer.route.path === '/getDecision');
      expect(decisionRoute).to.exist;

      // Call the handler (skip validation middleware)
      await decisionRoute.route.stack[1].handle(mockReq, mockRes, mockNext);

      // Verify decisionParamsBuilder was called with correct action
      expect(mockDecisionParamsBuilder.build.calledWith('membership_validation', mockReq.query)).to.be.true;
    });

    it('should handle train action', async () => {
      mockReq.query = {
        action: 'train',
        task_id: 'task123'
      };

      // Find the decision route handler
      const routes = decisionRouter.stack;
      const decisionRoute = routes.find(layer => layer.route && layer.route.path === '/getDecision');
      expect(decisionRoute).to.exist;

      // Call the handler (skip validation middleware)
      await decisionRoute.route.stack[1].handle(mockReq, mockRes, mockNext);

      // Verify decisionParamsBuilder was called with correct action
      expect(mockDecisionParamsBuilder.build.calledWith('train', mockReq.query)).to.be.true;
    });

    it('should handle evaluate action', async () => {
      mockReq.query = {
        action: 'evaluate',
        task_id: 'task123'
      };

      // Find the decision route handler
      const routes = decisionRouter.stack;
      const decisionRoute = routes.find(layer => layer.route && layer.route.path === '/getDecision');
      expect(decisionRoute).to.exist;

      // Call the handler (skip validation middleware)
      await decisionRoute.route.stack[1].handle(mockReq, mockRes, mockNext);

      // Verify decisionParamsBuilder was called with correct action
      expect(mockDecisionParamsBuilder.build.calledWith('evaluate', mockReq.query)).to.be.true;
    });

    it('should pass errors to next middleware', async () => {
      // Make luas.evaluates throw an error
      const testError = new Error('Evaluation failed');
      mockLuas.evaluates.rejects(testError);

      mockReq.query = {
        action: 'task_approval',
        task_id: 'task123'
      };

      // Find the decision route handler
      const routes = decisionRouter.stack;
      const decisionRoute = routes.find(layer => layer.route && layer.route.path === '/getDecision');
      expect(decisionRoute).to.exist;

      // Call the handler (skip validation middleware)
      await decisionRoute.route.stack[1].handle(mockReq, mockRes, mockNext);

      // Verify error was passed to next middleware
      expect(mockNext.calledWith(testError)).to.be.true;
    });

    it('should have validation middleware attached', () => {
      // Find the decision route handler
      const routes = decisionRouter.stack;
      const decisionRoute = routes.find(layer => layer.route && layer.route.path === '/getDecision');
      expect(decisionRoute).to.exist;

      // Should have 2 middlewares: validation and the handler
      expect(decisionRoute.route.stack).to.have.lengthOf(2);

      // First middleware should be the validation function
      const validationMiddleware = decisionRoute.route.stack[0];
      expect(validationMiddleware.handle).to.be.a('function');
      expect(validationMiddleware.handle.name).to.equal('validateDecisionQuery');
    });
  });
});