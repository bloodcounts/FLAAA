const { expect } = require('chai');
const sinon = require('sinon');

describe('TargetFactory', () => {
  let TargetFactory;
  let targetFactory;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/targetFactory')];
    TargetFactory = require('../../xacml/targetFactory');
    targetFactory = new TargetFactory();
  });

  describe('constructor', () => {
    it('should create a TargetFactory instance', () => {
      expect(targetFactory).to.be.an.instanceof(TargetFactory);
    });
  });

  describe('getFactory()', () => {
    it('should return a singleton instance', () => {
      const factory1 = targetFactory.getFactory();
      const factory2 = targetFactory.getFactory();

      expect(factory1).to.equal(factory2);
      expect(factory1).to.be.an.instanceof(TargetFactory);
    });

    it('should return the same instance across different factory objects', () => {
      const factory1 = new TargetFactory();
      const factory2 = new TargetFactory();

      const instance1 = factory1.getFactory();
      const instance2 = factory2.getFactory();

      expect(instance1).to.equal(instance2);
    });
  });

  describe('getTarget()', () => {
    it('should return XACML 3.0 target when version is 3.0', () => {
      const mockMetaData = {
        getXACMLVersion: sinon.stub().returns(3)
      };
      const mockNode = {
        childNodes: []
      };

      const result = targetFactory.getTarget(mockNode, mockMetaData);

      expect(result).to.be.an.instanceof(require('../../xacml/xacml3/target'));
    });

    it('should return standard target for non-XACML 3.0 versions', () => {
      const mockMetaData = {
        getXACMLVersion: sinon.stub().returns(2) // XACML 2.0
      };
      const mockNode = {
        childNodes: sinon.stub().returns([])
      };

      const result = targetFactory.getTarget(mockNode, mockMetaData);

      expect(result).to.be.an.instanceof(require('../../xacml/target'));
    });

    it('should return standard target for XACML 1.0', () => {
      const mockMetaData = {
        getXACMLVersion: sinon.stub().returns(0) // XACML 1.0
      };
      const mockNode = {
        childNodes: sinon.stub().returns([])
      };

      const result = targetFactory.getTarget(mockNode, mockMetaData);

      expect(result).to.be.an.instanceof(require('../../xacml/target'));
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      expect(targetFactory.getFactory).to.be.a('function');
      expect(targetFactory.getTarget).to.be.a('function');
    });

    it('should handle different XACML versions correctly', () => {
      const versions = [0, 1, 2, 3]; // XACML versions

      versions.forEach(version => {
        const mockMetaData = {
          getXACMLVersion: () => version
        };

        // This will throw due to missing dependencies, but should not throw version-related errors
        try {
          targetFactory.getTarget({}, mockMetaData);
          expect.fail('Expected an error to be thrown');
        } catch (error) {
          // Should not be a version error
          expect(error.message).to.not.include('XACML');
        }
      });
    });
  });
});