const { expect } = require('chai');
const sinon = require('sinon');

describe('PolicyFinder', () => {
  let PolicyFinder;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../../xacml/finder/policyFinder')];
    PolicyFinder = require('../../../xacml/finder/policyFinder');
  });

  describe('constructor', () => {
    it('should create a PolicyFinder instance', () => {
      const finder = new PolicyFinder();
      expect(finder).to.be.an.instanceof(PolicyFinder);
      expect(finder.requestModules).to.be.an('array').that.is.empty;
      expect(finder.referenceModules).to.be.an('array').that.is.empty;
      expect(finder.allModules).to.be.an('array').that.is.empty;
    });
  });

  describe('init()', () => {
    it('should initialize all modules successfully', async () => {
      const finder = new PolicyFinder();
      const mockModule1 = { init: sinon.stub().resolves() };
      const mockModule2 = { init: sinon.stub().resolves() };
      finder.allModules = [mockModule1, mockModule2];

      const result = await finder.init();

      expect(result).to.be.true;
      expect(mockModule1.init.calledOnceWith(finder)).to.be.true;
      expect(mockModule2.init.calledOnceWith(finder)).to.be.true;
    });

    it('should throw error when module initialization fails', async () => {
      const finder = new PolicyFinder();
      const mockModule = { init: sinon.stub().rejects(new Error('Init failed')) };
      finder.allModules = [mockModule];

      try {
        await finder.init();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Error');
      }
    });
  });

  describe('setModules()', () => {
    it('should set modules and categorize them correctly', () => {
      const finder = new PolicyFinder();

      const mockRequestModule = {
        isRequestSupport: () => true,
        isIdReferenceSupported: () => false
      };

      const mockReferenceModule = {
        isRequestSupport: () => false,
        isIdReferenceSupported: () => true
      };

      const mockBothModule = {
        isRequestSupport: () => true,
        isIdReferenceSupported: () => true
      };

      const modules = [mockRequestModule, mockReferenceModule, mockBothModule];

      finder.setModules(modules);

      expect(finder.allModules).to.equal(modules);
      expect(finder.requestModules).to.have.lengthOf(2);
      expect(finder.referenceModules).to.have.lengthOf(2);
    });

    it('should handle empty modules array', () => {
      const finder = new PolicyFinder();
      finder.setModules([]);

      expect(finder.allModules).to.be.an('array').that.is.empty;
      expect(finder.requestModules).to.be.an('array').that.is.empty;
      expect(finder.referenceModules).to.be.an('array').that.is.empty;
    });
  });

  describe('findPolicy()', () => {
    let finder;
    let mockContext;

    beforeEach(() => {
      finder = new PolicyFinder();
      mockContext = {};
    });

    it('should return policy when one module finds applicable policy', () => {
      const mockResult = {
        indeterminate: () => false,
        notApplicable: () => false
      };

      const mockModule1 = {
        findPolicy: sinon.stub().returns({
          indeterminate: () => false,
          notApplicable: () => true
        })
      };

      const mockModule2 = {
        findPolicy: sinon.stub().returns(mockResult)
      };

      finder.requestModules = [mockModule1, mockModule2];

      const result = finder.findPolicy(mockContext);

      expect(result).to.equal(mockResult);
      expect(mockModule1.findPolicy.calledOnceWith(mockContext)).to.be.true;
      expect(mockModule2.findPolicy.calledOnceWith(mockContext)).to.be.true;
    });

    it('should return indeterminate result when module returns indeterminate', () => {
      const mockResult = {
        indeterminate: () => true
      };

      const mockModule = {
        findPolicy: sinon.stub().returns(mockResult)
      };

      finder.requestModules = [mockModule];

      const result = finder.findPolicy(mockContext);

      expect(result).to.equal(mockResult);
    });

    it('should return processing error when multiple policies are applicable', () => {
      const mockResult1 = {
        indeterminate: () => false,
        notApplicable: () => false
      };

      const mockResult2 = {
        indeterminate: () => false,
        notApplicable: () => false
      };

      const mockModule1 = {
        findPolicy: sinon.stub().returns(mockResult1)
      };

      const mockModule2 = {
        findPolicy: sinon.stub().returns(mockResult2)
      };

      finder.requestModules = [mockModule1, mockModule2];

      const result = finder.findPolicy(mockContext);

      expect(result.indeterminate()).to.be.true;
    });

    it('should return not applicable result when no modules find policies', () => {
      const mockModule = {
        findPolicy: sinon.stub().returns({
          indeterminate: () => false,
          notApplicable: () => true
        })
      };

      finder.requestModules = [mockModule];

      const result = finder.findPolicy(mockContext);

      expect(result).to.be.an.instanceof(require('../../../xacml/finder/policyFinderResult'));
    });

    it('should handle empty request modules array', () => {
      finder.requestModules = [];

      const result = finder.findPolicy(mockContext);

      expect(result).to.be.an.instanceof(require('../../../xacml/finder/policyFinderResult'));
    });
  });

  describe('getModules()', () => {
    it('should return all modules', () => {
      const finder = new PolicyFinder();
      const modules = ['module1', 'module2'];
      finder.allModules = modules;

      const result = finder.getModules();

      expect(result).to.equal(modules);
    });
  });
});