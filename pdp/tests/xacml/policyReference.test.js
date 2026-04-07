const { expect } = require('chai');
const sinon = require('sinon');

describe('PolicyReference', () => {
  let PolicyReference;
  let VersionConstraints;
  let mockFinder;
  let mockParentMetaData;
  let mockRoot;
  let mockConstraints;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/policyReference')];
    delete require.cache[require.resolve('../../xacml/versionConstraints')];

    PolicyReference = require('../../xacml/policyReference');
    VersionConstraints = require('../../xacml/versionConstraints');

    // Create mocks
    mockFinder = {
      findPolicy: sinon.stub()
    };

    mockParentMetaData = {};

    mockRoot = {
      name: sinon.stub(),
      childNodes: sinon.stub(),
      attr: sinon.stub()
    };

    mockConstraints = {
      getVersionConstraint: sinon.stub(),
      getEarliestConstraint: sinon.stub(),
      getLatestConstraint: sinon.stub()
    };
  });

  describe('constructor', () => {
    it('should create a PolicyReference instance', () => {
      const policyReference = new PolicyReference();

      expect(policyReference).to.be.an.instanceOf(PolicyReference);
    });

    it('should inherit from AbstractPolicy', () => {
      const policyReference = new PolicyReference();

      expect(policyReference).to.have.property('match');
      expect(policyReference).to.have.property('evaluate');
    });
  });

  describe('init()', () => {
    it('should initialize with default constraints', () => {
      const policyReference = new PolicyReference();

      policyReference.init('test-reference', 0, mockFinder, mockParentMetaData);

      expect(policyReference.reference).to.equal('test-reference');
      expect(policyReference.policyType).to.equal(0);
      expect(policyReference.finder).to.equal(mockFinder);
      expect(policyReference.parentMetaData).to.equal(mockParentMetaData);
      expect(policyReference.constraints).to.be.an.instanceOf(VersionConstraints);
    });
  });

  describe('initWithConstraints()', () => {
    it('should initialize with provided constraints', () => {
      const policyReference = new PolicyReference();

      policyReference.initWithConstraints('test-reference', 0, mockConstraints, mockFinder, mockParentMetaData);

      expect(policyReference.reference).to.equal('test-reference');
      expect(policyReference.policyType).to.equal(0);
      expect(policyReference.constraints).to.equal(mockConstraints);
      expect(policyReference.finder).to.equal(mockFinder);
      expect(policyReference.parentMetaData).to.equal(mockParentMetaData);
    });

    it('should throw error for invalid policy type', () => {
      const policyReference = new PolicyReference();

      expect(() => {
        policyReference.initWithConstraints('test-reference', 2, mockConstraints, mockFinder, mockParentMetaData);
      }).to.throw('Input policyType is not a valid value');
    });
  });

  describe('getInstance()', () => {
    let mockChildNode;
    let mockAttrNode;

    beforeEach(() => {
      mockChildNode = {
        text: sinon.stub().returns('test-policy-id')
      };

      mockAttrNode = {
        value: sinon.stub().returns('1.0')
      };

      mockRoot.childNodes.returns([mockChildNode]);
    });

    it('should create PolicyReference for PolicyIdReference', () => {
      mockRoot.name.returns('PolicyIdReference');
      mockRoot.attr.withArgs('Version').returns(mockAttrNode);
      mockRoot.attr.withArgs('EarliestVersion').returns(null);
      mockRoot.attr.withArgs('LatestVersion').returns(null);

      const result = PolicyReference.prototype.getInstance(mockRoot, mockFinder, mockParentMetaData);

      expect(result).to.be.an.instanceOf(PolicyReference);
      expect(result.reference).to.equal('test-policy-id');
      expect(result.policyType).to.equal(0); // POLICY_REFERENCE
    });

    it('should create PolicyReference for PolicySetIdReference', () => {
      mockRoot.name.returns('PolicySetIdReference');
      mockRoot.attr.withArgs('Version').returns(null);
      mockRoot.attr.withArgs('EarliestVersion').returns(mockAttrNode);
      mockRoot.attr.withArgs('LatestVersion').returns(mockAttrNode);

      const result = PolicyReference.prototype.getInstance(mockRoot, mockFinder, mockParentMetaData);

      expect(result).to.be.an.instanceOf(PolicyReference);
      expect(result.reference).to.equal('test-policy-id');
      expect(result.policyType).to.equal(1); // POLICYSET_REFERENCE
    });

    it('should throw error for unknown reference type', () => {
      mockRoot.name.returns('UnknownReference');

      expect(() => {
        PolicyReference.prototype.getInstance(mockRoot, mockFinder, mockParentMetaData);
      }).to.throw('Unknown reference type: UnknownReference');
    });

    it('should handle version constraints', () => {
      mockRoot.name.returns('PolicyIdReference');
      mockRoot.attr.withArgs('Version').returns(mockAttrNode);
      mockRoot.attr.withArgs('EarliestVersion').returns(mockAttrNode);
      mockRoot.attr.withArgs('LatestVersion').returns(mockAttrNode);

      const result = PolicyReference.prototype.getInstance(mockRoot, mockFinder, mockParentMetaData);

      expect(result.constraints).to.be.an.instanceOf(VersionConstraints);
    });
  });

  describe('getters', () => {
    let policyReference;

    beforeEach(() => {
      policyReference = new PolicyReference();
      policyReference.initWithConstraints('test-ref', 0, mockConstraints, mockFinder, mockParentMetaData);
    });

    it('should return reference', () => {
      expect(policyReference.getReference()).to.equal('test-ref');
    });

    it('should return constraints', () => {
      expect(policyReference.getConstraints()).to.equal(mockConstraints);
    });

    it('should return reference type', () => {
      expect(policyReference.getReferenceType()).to.equal(0);
    });
  });

  describe('resolvePolicy()', () => {
    let policyReference;
    let mockPolicyFinderResult;
    let mockPolicy;

    beforeEach(() => {
      policyReference = new PolicyReference();
      policyReference.initWithConstraints('test-ref', 0, mockConstraints, mockFinder, mockParentMetaData);

      mockPolicy = {
        getId: sinon.stub().returns('policy-id'),
        getVersion: sinon.stub().returns('1.0'),
        getCombiningAlg: sinon.stub().returns('permit-overrides')
      };

      mockPolicyFinderResult = {
        notApplicable: sinon.stub().returns(false),
        indeterminate: sinon.stub().returns(false),
        getPolicy: sinon.stub().returns(mockPolicy)
      };

      mockFinder.findPolicy.returns(mockPolicyFinderResult);
    });

    it('should resolve policy successfully', () => {
      const result = policyReference.resolvePolicy();

      expect(result).to.equal(mockPolicy);
      expect(mockFinder.findPolicy.calledWith('test-ref', 0, mockConstraints, mockParentMetaData)).to.be.true;
    });

    it('should throw error when finder is null', () => {
      policyReference.finder = null;

      expect(() => policyReference.resolvePolicy()).to.throw("couldn't find the policy with a null finder");
    });

    it('should throw error when policy is not applicable', () => {
      mockPolicyFinderResult.notApplicable.returns(true);

      expect(() => policyReference.resolvePolicy()).to.throw("couldn't resolve the policy");
    });

    it('should throw error when policy resolution is indeterminate', () => {
      mockPolicyFinderResult.indeterminate.returns(true);

      expect(() => policyReference.resolvePolicy()).to.throw("error resolving the policy");
    });
  });

  describe('delegated methods', () => {
    let policyReference;
    let mockPolicy;

    beforeEach(() => {
      policyReference = new PolicyReference();
      policyReference.initWithConstraints('test-ref', 0, mockConstraints, mockFinder, mockParentMetaData);

      mockPolicy = {
        getId: sinon.stub().returns('policy-id'),
        getVersion: sinon.stub().returns('1.0'),
        getCombiningAlg: sinon.stub().returns('permit-overrides')
      };

      const mockPolicyFinderResult = {
        notApplicable: sinon.stub().returns(false),
        indeterminate: sinon.stub().returns(false),
        getPolicy: sinon.stub().returns(mockPolicy)
      };

      mockFinder.findPolicy.returns(mockPolicyFinderResult);
    });

    it('should delegate getId to resolved policy', () => {
      const result = policyReference.getId();

      expect(result).to.equal('policy-id');
      expect(mockPolicy.getId.calledOnce).to.be.true;
    });

    it('should delegate getVersion to resolved policy', () => {
      const result = policyReference.getVersion();

      expect(result).to.equal('1.0');
      expect(mockPolicy.getVersion.calledOnce).to.be.true;
    });

    it('should delegate getCombiningAlg to resolved policy', () => {
      const result = policyReference.getCombiningAlg();

      expect(result).to.equal('permit-overrides');
      expect(mockPolicy.getCombiningAlg.calledOnce).to.be.true;
    });
  });

  describe('constants', () => {
    it('should have POLICY_REFERENCE constant', () => {
      expect(PolicyReference.prototype.POLICY_REFERENCE).to.equal(0);
    });

    it('should have POLICYSET_REFERENCE constant', () => {
      expect(PolicyReference.prototype.POLICYSET_REFERENCE).to.equal(1);
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      const policyReference = new PolicyReference();

      expect(policyReference).to.have.property('init');
      expect(policyReference.init).to.be.a('function');
      expect(policyReference).to.have.property('initWithConstraints');
      expect(policyReference.initWithConstraints).to.be.a('function');
      expect(policyReference).to.have.property('getReference');
      expect(policyReference.getReference).to.be.a('function');
      expect(policyReference).to.have.property('getConstraints');
      expect(policyReference.getConstraints).to.be.a('function');
      expect(policyReference).to.have.property('getReferenceType');
      expect(policyReference.getReferenceType).to.be.a('function');
      expect(policyReference).to.have.property('resolvePolicy');
      expect(policyReference.resolvePolicy).to.be.a('function');
    });

    it('should work with real VersionConstraints', () => {
      const policyReference = new PolicyReference();

      expect(() => {
        policyReference.init('test-ref', 0, mockFinder, mockParentMetaData);
      }).to.not.throw();

      expect(policyReference.constraints).to.be.an.instanceOf(VersionConstraints);
    });
  });
});