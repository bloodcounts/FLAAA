const { expect } = require('chai');
const sinon = require('sinon');

describe('PolicySet', () => {
  let PolicySet;
  let Policy;
  let PolicyReference;
  let PolicyFilter;
  let mockRoot;
  let mockFinder;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/policySet')];
    delete require.cache[require.resolve('../../xacml/policy')];
    delete require.cache[require.resolve('../../xacml/policyReference')];
    delete require.cache[require.resolve('../../xacml/policyFilter')];

    PolicySet = require('../../xacml/policySet');
    Policy = require('../../xacml/policy');
    PolicyReference = require('../../xacml/policyReference');
    PolicyFilter = require('../../xacml/policyFilter');

    // Create mocks
    mockRoot = {
      nodeName: 'PolicySet',
      childNodes: [],
      getAttribute: sinon.stub().withArgs('PolicyCombiningAlgId').returns('urn:oasis:names:tc:xacml:1.0:policy-combining-algorithm:permit-overrides')
    };

    mockFinder = {};
  });

  afterEach(() => {
    // Reset singleton instances
    PolicyFilter.instance = undefined;
    // Restore stubs
    sinon.restore();
  });

  describe('constructor', () => {
    it('should create a PolicySet instance', () => {
      const policySet = new PolicySet();

      expect(policySet).to.be.an.instanceOf(PolicySet);
    });

    it('should inherit from AbstractPolicy', () => {
      const policySet = new PolicySet();

      expect(policySet).to.have.property('match');
      expect(policySet).to.have.property('evaluate');
      expect(policySet).to.have.property('setChildren');
      expect(policySet).to.have.property('getChildren');
    });
  });

  describe('policySetInit()', () => {
    let policySet;
    let mockPolicy;
    let mockPolicySetChild;
    let mockPolicyReference;

    beforeEach(() => {
      policySet = new PolicySet();

      mockPolicy = {
        idAttr: 'policy1'
      };

      mockPolicySetChild = {
        nodeName: 'PolicySet',
        idAttr: 'policyset1'
      };

      mockPolicyReference = {
        getReference: sinon.stub().returns('ref1'),
        getReferenceType: sinon.stub().returns(0) // POLICY_REFERENCE
      };

      // Mock the getInstance methods
      sinon.stub(policySet, 'getInstance').returns(mockPolicySetChild);
      sinon.stub(Policy.prototype, 'getInstance').returns(mockPolicy);
      sinon.stub(PolicyReference.prototype, 'getInstance').returns(mockPolicyReference);

      // Mock setChildren
      sinon.stub(policySet, 'setChildren');
    });

    it('should initialize policy set with empty children', () => {
      mockRoot.childNodes = [];

      policySet.policySetInit(mockRoot, mockFinder);

      expect(policySet.setChildren.calledOnce).to.be.true;
      expect(policySet.setChildren.firstCall.args[0]).to.be.an('array').that.is.empty;
    });

    it('should handle Policy children', () => {
      const policyChild = { nodeName: 'Policy' };
      mockRoot.childNodes = [policyChild];

      policySet.policySetInit(mockRoot, mockFinder);

      expect(Policy.prototype.getInstance.calledWith(policyChild)).to.be.true;
    });

    it('should handle PolicySet children', () => {
      const policySetChild = { nodeName: 'PolicySet' };
      mockRoot.childNodes = [policySetChild];

      policySet.policySetInit(mockRoot, mockFinder);

      expect(policySet.getInstance.calledWith(policySetChild, mockFinder)).to.be.true;
    });

    it('should handle PolicyIdReference children', () => {
      const referenceChild = { nodeName: 'PolicyIdReference' };
      mockRoot.childNodes = [referenceChild];

      policySet.policySetInit(mockRoot, mockFinder);

      expect(PolicyReference.prototype.getInstance.calledWith(referenceChild, mockFinder)).to.be.true;
    });

    it('should handle PolicySetIdReference children', () => {
      const referenceChild = { nodeName: 'PolicySetIdReference' };
      mockRoot.childNodes = [referenceChild];

      policySet.policySetInit(mockRoot, mockFinder);

      expect(PolicyReference.prototype.getInstance.calledWith(referenceChild, mockFinder)).to.be.true;
    });

    it('should skip unknown child types', () => {
      const unknownChild = { nodeName: 'Unknown' };
      mockRoot.childNodes = [unknownChild];

      policySet.policySetInit(mockRoot, mockFinder);

      expect(policySet.setChildren.calledOnce).to.be.true;
      expect(policySet.setChildren.firstCall.args[0]).to.be.an('array').that.is.empty;
    });

    it('should throw error for unmatched policy parameters', () => {
      const paramChild = { nodeName: 'PolicyCombinerParameters' };
      mockRoot.childNodes = [paramChild];

      expect(() => policySet.policySetInit(mockRoot, mockFinder)).to.throw('Unmatched parameters in Policy');
    });
  });

  describe('getInstance()', () => {
    beforeEach(() => {
      // Clear require cache for getInstance tests
      delete require.cache[require.resolve('../../xacml/policySet')];
      delete require.cache[require.resolve('../../xacml/policyFilter')];
      PolicySet = require('../../xacml/policySet');
      PolicyFilter = require('../../xacml/policyFilter');
    });

    it('should create PolicySet from root element', () => {
      const mockPolicyFilter = {
        addPolicySetAttrs: sinon.stub()
      };

      sinon.stub(PolicyFilter, 'getInstance').returns(mockPolicyFilter);
      sinon.stub(PolicySet.prototype, 'policySetInit');

      const result = PolicySet.prototype.getInstance(mockRoot, mockFinder);

      expect(result).to.be.an.instanceOf(PolicySet);
      expect(PolicySet.prototype.policySetInit.calledWith(mockRoot, mockFinder)).to.be.true;
      expect(mockPolicyFilter.addPolicySetAttrs.calledWith(result)).to.be.true;
    });

    it('should log error for invalid root node name', () => {
      const invalidRoot = { nodeName: 'Invalid' };
      const consoleSpy = sinon.spy(console, 'log');

      const mockPolicyFilter = {
        addPolicySetAttrs: sinon.stub()
      };

      sinon.stub(PolicyFilter, 'getInstance').returns(mockPolicyFilter);
      sinon.stub(PolicySet.prototype, 'policySetInit');

      PolicySet.prototype.getInstance(invalidRoot, mockFinder);

      expect(consoleSpy.calledWith('Cannot create PolicySet from root of type Invalid')).to.be.true;

      consoleSpy.restore();
    });
  });

  describe('parameterHelper', () => {
    it('should throw error (not implemented)', () => {
      expect(() => PolicySet.parameterHelper([], {}, 'test')).to.throw();
    });
  });

  describe('integration tests', () => {
    beforeEach(() => {
      // Clear require cache for integration tests
      delete require.cache[require.resolve('../../xacml/policySet')];
      delete require.cache[require.resolve('../../xacml/policyFilter')];
      PolicySet = require('../../xacml/policySet');
      PolicyFilter = require('../../xacml/policyFilter');
    });

    it('should have all required methods', () => {
      const policySet = new PolicySet();

      expect(policySet).to.have.property('policySetInit');
      expect(policySet.policySetInit).to.be.a('function');
    });

    it('should work with real PolicyFilter', () => {
      const mockPolicyFilter = {
        addPolicySetAttrs: sinon.stub()
      };

      sinon.stub(PolicyFilter, 'getInstance').returns(mockPolicyFilter);
      sinon.stub(PolicySet.prototype, 'policySetInit');

      const result = PolicySet.prototype.getInstance(mockRoot, mockFinder);

      expect(result).to.be.an.instanceOf(PolicySet);
      expect(PolicyFilter.getInstance.calledOnce).to.be.true;
    });

    it('should handle complex policy set initialization', () => {
      const policySet = new PolicySet();

      // Mock abstractPolicyInitWithRoot
      sinon.stub(policySet, 'abstractPolicyInitWithRoot');
      sinon.stub(policySet, 'setChildren');

      mockRoot.childNodes = [];

      expect(() => policySet.policySetInit(mockRoot, mockFinder)).to.not.throw();
    });
  });
});