const { expect } = require('chai');
const sinon = require('sinon');

describe('Config', () => {
  let Config;
  let mockAttributeFinder;
  let mockPolicyFinder;
  let mockResourceFinder;
  let mockMultipleRequestHandler;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/config')];
    Config = require('../../xacml/config');

    // Create mock finder objects
    mockAttributeFinder = {
      attributeFinderInit: sinon.stub()
    };

    mockPolicyFinder = {
      requestModules: [],
      referenceModules: [],
      allModules: []
    };

    mockResourceFinder = {
      setModules: sinon.stub(),
      allModules: []
    };

    mockMultipleRequestHandler = {
      handleMultipleRequests: sinon.stub()
    };
  });

  describe('constructor', () => {
    it('should create default finders when all parameters are null', () => {
      const config = new Config(null, null, null, null);

      expect(config.attributeFinder).to.be.an.instanceof(require('../../xacml/finder/attributeFinder'));
      expect(config.policyFinder).to.be.an.instanceof(require('../../xacml/finder/policyFinder'));
      expect(config.resourceFinder).to.be.an.instanceof(require('../../xacml/finder/resourceFinder'));
      expect(config.multipleRequestHandler).to.be.null;
    });

    it('should use provided attributeFinder when not null', () => {
      const config = new Config(mockAttributeFinder, null, null, null);

      expect(config.attributeFinder).to.equal(mockAttributeFinder);
      expect(config.policyFinder).to.be.an.instanceof(require('../../xacml/finder/policyFinder'));
      expect(config.resourceFinder).to.be.an.instanceof(require('../../xacml/finder/resourceFinder'));
    });

    it('should use provided policyFinder when not null', () => {
      const config = new Config(null, mockPolicyFinder, null, null);

      expect(config.attributeFinder).to.be.an.instanceof(require('../../xacml/finder/attributeFinder'));
      expect(config.policyFinder).to.equal(mockPolicyFinder);
      expect(config.resourceFinder).to.be.an.instanceof(require('../../xacml/finder/resourceFinder'));
    });

    it('should use provided resourceFinder when not null', () => {
      const config = new Config(null, null, mockResourceFinder, null);

      expect(config.attributeFinder).to.be.an.instanceof(require('../../xacml/finder/attributeFinder'));
      expect(config.policyFinder).to.be.an.instanceof(require('../../xacml/finder/policyFinder'));
      expect(config.resourceFinder).to.equal(mockResourceFinder);
    });

    it('should use provided multipleRequestHandler', () => {
      const config = new Config(null, null, null, mockMultipleRequestHandler);

      expect(config.attributeFinder).to.be.an.instanceof(require('../../xacml/finder/attributeFinder'));
      expect(config.policyFinder).to.be.an.instanceof(require('../../xacml/finder/policyFinder'));
      expect(config.resourceFinder).to.be.an.instanceof(require('../../xacml/finder/resourceFinder'));
      expect(config.multipleRequestHandler).to.equal(mockMultipleRequestHandler);
    });

    it('should use all provided custom finders and handler', () => {
      const config = new Config(
        mockAttributeFinder,
        mockPolicyFinder,
        mockResourceFinder,
        mockMultipleRequestHandler
      );

      expect(config.attributeFinder).to.equal(mockAttributeFinder);
      expect(config.policyFinder).to.equal(mockPolicyFinder);
      expect(config.resourceFinder).to.equal(mockResourceFinder);
      expect(config.multipleRequestHandler).to.equal(mockMultipleRequestHandler);
    });

    it('should handle undefined parameters differently from null', () => {
      const config = new Config(undefined, undefined, undefined, undefined);

      expect(config.attributeFinder).to.be.undefined;
      expect(config.policyFinder).to.be.undefined;
      expect(config.resourceFinder).to.be.undefined;
      expect(config.multipleRequestHandler).to.be.undefined;
    });
  });

  describe('getAttributeFinder()', () => {
    it('should return the attributeFinder instance', () => {
      const config = new Config(mockAttributeFinder, null, null, null);

      const result = config.getAttributeFinder();

      expect(result).to.equal(mockAttributeFinder);
    });

    it('should return default attributeFinder when none provided', () => {
      const config = new Config(null, null, null, null);

      const result = config.getAttributeFinder();

      expect(result).to.be.an.instanceof(require('../../xacml/finder/attributeFinder'));
    });
  });

  describe('getPolicyFinder()', () => {
    it('should return the policyFinder instance', () => {
      const config = new Config(null, mockPolicyFinder, null, null);

      const result = config.getPolicyFinder();

      expect(result).to.equal(mockPolicyFinder);
    });

    it('should return default policyFinder when none provided', () => {
      const config = new Config(null, null, null, null);

      const result = config.getPolicyFinder();

      expect(result).to.be.an.instanceof(require('../../xacml/finder/policyFinder'));
    });
  });

  describe('getResourceFinder()', () => {
    it('should return the resourceFinder instance', () => {
      const config = new Config(null, null, mockResourceFinder, null);

      const result = config.getResourceFinder();

      expect(result).to.equal(mockResourceFinder);
    });

    it('should return default resourceFinder when none provided', () => {
      const config = new Config(null, null, null, null);

      const result = config.getResourceFinder();

      expect(result).to.be.an.instanceof(require('../../xacml/finder/resourceFinder'));
    });
  });

  describe('isMultipleRequestHandle()', () => {
    it('should return the multipleRequestHandler when provided', () => {
      const config = new Config(null, null, null, mockMultipleRequestHandler);

      const result = config.isMultipleRequestHandle();

      expect(result).to.equal(mockMultipleRequestHandler);
    });

    it('should return null when no multipleRequestHandler provided', () => {
      const config = new Config(null, null, null, null);

      const result = config.isMultipleRequestHandle();

      expect(result).to.be.null;
    });

    it('should return undefined when multipleRequestHandler is undefined', () => {
      const config = new Config(null, null, null, undefined);

      const result = config.isMultipleRequestHandle();

      expect(result).to.be.undefined;
    });
  });

  describe('integration with real finder classes', () => {
    it('should create working default finder instances', () => {
      const config = new Config(null, null, null, null);

      // Test that the default finders have the expected structure
      expect(config.getAttributeFinder()).to.have.property('attributeFinderInit');
      expect(config.getPolicyFinder()).to.have.property('requestModules');
      expect(config.getPolicyFinder()).to.have.property('referenceModules');
      expect(config.getPolicyFinder()).to.have.property('allModules');
      expect(config.getResourceFinder()).to.have.property('setModules');
      // Note: ResourceFinder doesn't have allModules until setModules is called
    });

    it('should allow calling methods on default finders', () => {
      const config = new Config(null, null, null, null);

      // These should not throw errors
      expect(() => {
        config.getAttributeFinder().attributeFinderInit();
      }).to.not.throw();

      expect(() => {
        config.getResourceFinder().setModules([]);
      }).to.not.throw();
    });
  });
});