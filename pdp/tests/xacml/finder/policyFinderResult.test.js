const { expect } = require('chai');

describe('PolicyFinderResult', () => {
  let PolicyFinderResult;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../../xacml/finder/policyFinderResult')];
    PolicyFinderResult = require('../../../xacml/finder/policyFinderResult');
  });

  describe('constructor', () => {
    it('should create a PolicyFinderResult instance', () => {
      const result = new PolicyFinderResult();
      expect(result).to.be.an.instanceof(PolicyFinderResult);
    });
  });

  describe('policyFinderResultInit(status)', () => {
    it('should initialize with status and null policy', () => {
      const result = new PolicyFinderResult();
      const mockStatus = { code: 'test-error' };

      result.policyFinderResultInit(mockStatus);

      expect(result.policy).to.be.null;
      expect(result.status).to.equal(mockStatus);
    });
  });

  describe('policyFinderResultInit2(policy)', () => {
    it('should initialize with policy and null status', () => {
      const result = new PolicyFinderResult();
      const mockPolicy = { id: 'test-policy' };

      result.policyFinderResultInit2(mockPolicy);

      expect(result.policy).to.equal(mockPolicy);
      expect(result.status).to.be.null;
    });
  });

  describe('policyFinderResultInit3()', () => {
    it('should initialize with null policy and status', () => {
      const result = new PolicyFinderResult();

      result.policyFinderResultInit3();

      expect(result.policy).to.be.null;
      expect(result.status).to.be.null;
    });
  });

  describe('notApplicable()', () => {
    it('should return true when both policy and status are null', () => {
      const result = new PolicyFinderResult();
      result.policyFinderResultInit3();

      const isNotApplicable = result.notApplicable();

      expect(isNotApplicable).to.be.true;
    });

    it('should return false when policy is set', () => {
      const result = new PolicyFinderResult();
      const mockPolicy = { id: 'test-policy' };
      result.policyFinderResultInit2(mockPolicy);

      const isNotApplicable = result.notApplicable();

      expect(isNotApplicable).to.be.false;
    });

    it('should return false when status is set', () => {
      const result = new PolicyFinderResult();
      const mockStatus = { code: 'test-error' };
      result.policyFinderResultInit(mockStatus);

      const isNotApplicable = result.notApplicable();

      expect(isNotApplicable).to.be.false;
    });
  });

  describe('indeterminate()', () => {
    it('should return true when status is set', () => {
      const result = new PolicyFinderResult();
      const mockStatus = { code: 'test-error' };
      result.policyFinderResultInit(mockStatus);

      const isIndeterminate = result.indeterminate();

      expect(isIndeterminate).to.be.true;
    });

    it('should return false when status is null', () => {
      const result = new PolicyFinderResult();
      result.policyFinderResultInit3();

      const isIndeterminate = result.indeterminate();

      expect(isIndeterminate).to.be.false;
    });

    it('should return false when status is undefined', () => {
      const result = new PolicyFinderResult();
      result.status = undefined;
      result.policy = null;

      const isIndeterminate = result.indeterminate();

      expect(isIndeterminate).to.be.false;
    });
  });

  describe('getPolicy()', () => {
    it('should return the policy', () => {
      const result = new PolicyFinderResult();
      const mockPolicy = { id: 'test-policy' };
      result.policyFinderResultInit2(mockPolicy);

      const policy = result.getPolicy();

      expect(policy).to.equal(mockPolicy);
    });

    it('should return null when policy is not set', () => {
      const result = new PolicyFinderResult();
      result.policyFinderResultInit3();

      const policy = result.getPolicy();

      expect(policy).to.be.null;
    });
  });

  describe('getStatus()', () => {
    it('should return the status', () => {
      const result = new PolicyFinderResult();
      const mockStatus = { code: 'test-error' };
      result.policyFinderResultInit(mockStatus);

      const status = result.getStatus();

      expect(status).to.equal(mockStatus);
    });

    it('should return null when status is not set', () => {
      const result = new PolicyFinderResult();
      result.policyFinderResultInit3();

      const status = result.getStatus();

      expect(status).to.be.null;
    });
  });

  describe('integration tests', () => {
    it('should work with policyFinderResultInit and getters', () => {
      const result = new PolicyFinderResult();
      const mockStatus = { code: 'test-error' };

      result.policyFinderResultInit(mockStatus);

      expect(result.getStatus()).to.equal(mockStatus);
      expect(result.getPolicy()).to.be.null;
      expect(result.indeterminate()).to.be.true;
      expect(result.notApplicable()).to.be.false;
    });

    it('should work with policyFinderResultInit2 and getters', () => {
      const result = new PolicyFinderResult();
      const mockPolicy = { id: 'test-policy' };

      result.policyFinderResultInit2(mockPolicy);

      expect(result.getPolicy()).to.equal(mockPolicy);
      expect(result.getStatus()).to.be.null;
      expect(result.indeterminate()).to.be.false;
      expect(result.notApplicable()).to.be.false;
    });

    it('should work with policyFinderResultInit3 and getters', () => {
      const result = new PolicyFinderResult();

      result.policyFinderResultInit3();

      expect(result.getPolicy()).to.be.null;
      expect(result.getStatus()).to.be.null;
      expect(result.indeterminate()).to.be.false;
      expect(result.notApplicable()).to.be.true;
    });
  });
});