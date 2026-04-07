const { expect } = require('chai');

describe('PolicyMetaData', () => {
  let PolicyMetaData;
  let policyMetaData;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/PolicyMetaData')];
    PolicyMetaData = require('../../xacml/PolicyMetaData');
    policyMetaData = new PolicyMetaData();
  });

  describe('constructor', () => {
    it('should create a PolicyMetaData instance', () => {
      expect(policyMetaData).to.be.an.instanceof(PolicyMetaData);
    });
  });

  describe('init()', () => {
    it('should initialize with null xacmlVersion (defaults to 0)', () => {
      policyMetaData.init(null, false);

      expect(policyMetaData.getXACMLVersion()).to.equal(0);
      expect(policyMetaData.getXPathVersion()).to.equal(0);
    });

    it('should initialize with XACML 1.0 identifier', () => {
      const XACMLConstants = require('../../xacml/XACMLConstants');
      policyMetaData.init(XACMLConstants.XACML_1_0_IDENTIFIER, true);

      expect(policyMetaData.getXACMLVersion()).to.equal(XACMLConstants.XACML_VERSION_1_0);
      expect(policyMetaData.getXPathVersion()).to.equal(1);
    });

    it('should initialize with XACML 2.0 identifier', () => {
      const XACMLConstants = require('../../xacml/XACMLConstants');
      policyMetaData.init(XACMLConstants.XACML_2_0_IDENTIFIER, false);

      expect(policyMetaData.getXACMLVersion()).to.equal(XACMLConstants.XACML_VERSION_2_0);
      expect(policyMetaData.getXPathVersion()).to.equal(0);
    });

    it('should initialize with XACML 3.0 identifier', () => {
      const XACMLConstants = require('../../xacml/XACMLConstants');
      policyMetaData.init(XACMLConstants.XACML_3_0_IDENTIFIER, true);

      expect(policyMetaData.getXACMLVersion()).to.equal(XACMLConstants.XACML_VERSION_3_0);
      expect(policyMetaData.getXPathVersion()).to.equal(1);
    });

    it('should throw error for unknown XACML version', () => {
      expect(() => {
        policyMetaData.init('unknown-version', false);
      }).to.throw('Unknown XACML version string: unknown-version');
    });

    it('should handle xpathVersion parameter correctly', () => {
      policyMetaData.init(null, true);
      expect(policyMetaData.getXPathVersion()).to.equal(1);

      policyMetaData.init(null, false);
      expect(policyMetaData.getXPathVersion()).to.equal(0);

      policyMetaData.init(null, null);
      expect(policyMetaData.getXPathVersion()).to.equal(0);

      policyMetaData.init(null, undefined);
      expect(policyMetaData.getXPathVersion()).to.equal(0);
    });
  });

  describe('getXACMLVersion()', () => {
    it('should return undefined when not initialized', () => {
      expect(policyMetaData.getXACMLVersion()).to.be.undefined;
    });

    it('should return the initialized XACML version', () => {
      policyMetaData.init(null, false);

      expect(policyMetaData.getXACMLVersion()).to.equal(0);
    });
  });

  describe('getXPathVersion()', () => {
    it('should return undefined when not initialized', () => {
      expect(policyMetaData.getXPathVersion()).to.be.undefined;
    });

    it('should return the initialized XPath version', () => {
      policyMetaData.init(null, true);

      expect(policyMetaData.getXPathVersion()).to.equal(1);
    });
  });

  describe('integration tests', () => {
    it('should properly initialize and retrieve all versions', () => {
      const XACMLConstants = require('../../xacml/XACMLConstants');

      // Test XACML 1.0
      policyMetaData.init(XACMLConstants.XACML_1_0_IDENTIFIER, true);
      expect(policyMetaData.getXACMLVersion()).to.equal(0);
      expect(policyMetaData.getXPathVersion()).to.equal(1);

      // Test XACML 2.0
      policyMetaData.init(XACMLConstants.XACML_2_0_IDENTIFIER, false);
      expect(policyMetaData.getXACMLVersion()).to.equal(2);
      expect(policyMetaData.getXPathVersion()).to.equal(0);

      // Test XACML 3.0
      policyMetaData.init(XACMLConstants.XACML_3_0_IDENTIFIER, true);
      expect(policyMetaData.getXACMLVersion()).to.equal(3);
      expect(policyMetaData.getXPathVersion()).to.equal(1);
    });

    it('should have all required methods', () => {
      expect(policyMetaData.init).to.be.a('function');
      expect(policyMetaData.getXACMLVersion).to.be.a('function');
      expect(policyMetaData.getXPathVersion).to.be.a('function');
    });
  });
});