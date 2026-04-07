const { expect } = require('chai');
const sinon = require('sinon');
const { StatusCodes } = require('http-status-codes');

describe('Validation Middleware', () => {
  let validateDecisionQuery;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../middleware/validate')];
    const validateModule = require('../../middleware/validate');
    validateDecisionQuery = validateModule.validateDecisionQuery;

    // Mock request, response, and next
    mockReq = {
      query: {}
    };
    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
    mockNext = sinon.stub();
  });

  describe('validateDecisionQuery', () => {
    it('should call next() for valid task_approval action', () => {
      mockReq.query = {
        action: 'task_approval',
        task_id: 'task123'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should call next() for valid membership_validation action', () => {
      mockReq.query = {
        action: 'membership_validation',
        task_id: 'task123',
        node_id: 'node456'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should call next() for valid train action', () => {
      mockReq.query = {
        action: 'train',
        task_id: 'task123'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should call next() for valid evaluate action', () => {
      mockReq.query = {
        action: 'evaluate',
        task_id: 'task123'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should accept task-approval action', () => {
      mockReq.query = {
        action: 'task-approval',
        task_id: 'task123'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should accept taskapproval action', () => {
      mockReq.query = {
        action: 'taskapproval',
        task_id: 'task123'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should accept taks_approval action', () => {
      mockReq.query = {
        action: 'taks_approval',
        task_id: 'task123'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should accept membership-validation action', () => {
      mockReq.query = {
        action: 'membership-validation',
        task_id: 'task123',
        node_id: 'node456'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should accept membershipvalidation action', () => {
      mockReq.query = {
        action: 'membershipvalidation',
        task_id: 'task123',
        node_id: 'node456'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should accept memebership_validation action', () => {
      mockReq.query = {
        action: 'memebership_validation',
        task_id: 'task123',
        node_id: 'node456'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });

    it('should return BAD_REQUEST for missing action', () => {
      mockReq.query = {
        task_id: 'task123'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockRes.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
      expect(mockRes.json.calledWith({
        error: 'Validation failed',
        details: '"action" is required'
      })).to.be.true;
      expect(mockNext.notCalled).to.be.true;
    });

    it('should return BAD_REQUEST for invalid action', () => {
      mockReq.query = {
        action: 'invalid_action',
        task_id: 'task123'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockRes.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
      expect(mockRes.json.calledWith({
        error: 'Validation failed',
        details: '"action" must be one of [task_approval, task-approval, taskapproval, taks_approval, membership_validation, membership-validation, membershipvalidation, memebership_validation, train, evaluate]'
      })).to.be.true;
      expect(mockNext.notCalled).to.be.true;
    });

    it('should return BAD_REQUEST for task_approval missing task_id', () => {
      mockReq.query = {
        action: 'task_approval'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockRes.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
      expect(mockRes.json.calledWith({
        error: 'Validation failed',
        details: '"task_id" is required'
      })).to.be.true;
      expect(mockNext.notCalled).to.be.true;
    });

    it('should return BAD_REQUEST for membership_validation missing task_id', () => {
      mockReq.query = {
        action: 'membership_validation',
        node_id: 'node456'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockRes.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
      expect(mockRes.json.calledWith({
        error: 'Validation failed',
        details: '"task_id" is required'
      })).to.be.true;
      expect(mockNext.notCalled).to.be.true;
    });

    it('should return BAD_REQUEST for membership_validation missing node_id', () => {
      mockReq.query = {
        action: 'membership_validation',
        task_id: 'task123'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockRes.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
      expect(mockRes.json.calledWith({
        error: 'Validation failed',
        details: '"node_id" is required'
      })).to.be.true;
      expect(mockNext.notCalled).to.be.true;
    });

    it('should return BAD_REQUEST for train missing task_id', () => {
      mockReq.query = {
        action: 'train'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockRes.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
      expect(mockRes.json.calledWith({
        error: 'Validation failed',
        details: '"task_id" is required'
      })).to.be.true;
      expect(mockNext.notCalled).to.be.true;
    });

    it('should return BAD_REQUEST for evaluate missing task_id', () => {
      mockReq.query = {
        action: 'evaluate'
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockRes.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
      expect(mockRes.json.calledWith({
        error: 'Validation failed',
        details: '"task_id" is required'
      })).to.be.true;
      expect(mockNext.notCalled).to.be.true;
    });

    it('should allow additional unknown parameters', () => {
      mockReq.query = {
        action: 'task_approval',
        task_id: 'task123',
        extra_param: 'extra_value',
        another_param: 123
      };

      validateDecisionQuery(mockReq, mockRes, mockNext);

      expect(mockNext.calledOnce).to.be.true;
      expect(mockRes.status.notCalled).to.be.true;
    });
  });
});