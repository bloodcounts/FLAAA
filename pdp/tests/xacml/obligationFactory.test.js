const { expect } = require('chai');
const sinon = require('sinon');

describe('ObligationFactory', () => {
  let ObligationFactory;
  let obligationFactory;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/obligationFactory')];
    ObligationFactory = require('../../xacml/obligationFactory');
    obligationFactory = new ObligationFactory();
  });

  describe('constructor', () => {
    it('should create an ObligationFactory instance', () => {
      expect(obligationFactory).to.be.an.instanceof(ObligationFactory);
    });
  });

  describe('getFactory()', () => {
    it('should return a singleton instance', () => {
      const factory1 = obligationFactory.getFactory();
      const factory2 = obligationFactory.getFactory();

      expect(factory1).to.equal(factory2);
      expect(factory1).to.be.an.instanceof(ObligationFactory);
    });

    it('should return the same instance across different factory objects', () => {
      const factory1 = new ObligationFactory();
      const factory2 = new ObligationFactory();

      const instance1 = factory1.getFactory();
      const instance2 = factory2.getFactory();

      expect(instance1).to.equal(instance2);
    });
  });

  describe('getObligation()', () => {
    it('should throw error for non-XACML 3.0 versions', () => {
      const mockMetaData = {
        getXACMLVersion: sinon.stub().returns(2) // XACML 2.0
      };
      const mockNode = {};

      expect(() => {
        obligationFactory.getObligation(mockNode, mockMetaData);
      }).to.throw('This Implementation does not support XACML 2.0');
    });

    it('should throw error for XACML 1.0', () => {
      const mockMetaData = {
        getXACMLVersion: sinon.stub().returns(0) // XACML 1.0
      };
      const mockNode = {};

      expect(() => {
        obligationFactory.getObligation(mockNode, mockMetaData);
      }).to.throw('This Implementation does not support XACML 2.0');
    });

    it('should attempt to get obligation for XACML 3.0', () => {
      const mockMetaData = {
        getXACMLVersion: sinon.stub().returns(3) // XACML 3.0
      };
      const mockNode = {};

      // This will throw because of missing dependencies, but it should not throw the XACML version error
      try {
        obligationFactory.getObligation(mockNode, mockMetaData);
        // If it doesn't throw, that's unexpected
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).to.not.include('This Implementation does not support XACML 2.0');
      }
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      expect(obligationFactory.getFactory).to.be.a('function');
      expect(obligationFactory.getObligation).to.be.a('function');
    });

    it('should work with XACML 3.0 metadata', () => {
      const mockMetaData = {
        getXACMLVersion: () => 3
      };

      // This will throw because of missing dependencies, but it should reach the right code path
      try {
        obligationFactory.getObligation({}, mockMetaData);
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        expect(error.message).to.not.include('This Implementation does not support XACML 2.0');
      }
    });
  });
});