const { expect } = require('chai');
const sinon = require('sinon');

describe('PolicyFilter', () => {
  let PolicyFilter;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/policyFilter')];
    delete require.cache[require.resolve('../../xacml/utils/bloomFilter')];

    PolicyFilter = require('../../xacml/policyFilter');
  });

  afterEach(() => {
    // Reset singleton instance
    PolicyFilter.instance = undefined;
  });

  describe('constructor', () => {
    it('should create a PolicyFilter instance', () => {
      const policyFilter = new PolicyFilter(true);

      expect(policyFilter).to.be.an.instanceOf(PolicyFilter);
      expect(policyFilter.isEnabled).to.equal(true);
      expect(policyFilter.bloomFilters).to.be.an('object');
      expect(policyFilter.bloomFilters).to.be.empty;
    });

    it('should set isEnabled to false by default', () => {
      const policyFilter = new PolicyFilter();

      expect(policyFilter.isEnabled).to.equal(undefined);
    });
  });

  describe('getInstance()', () => {
    it('should return a singleton instance', () => {
      const instance1 = PolicyFilter.getInstance(true);
      const instance2 = PolicyFilter.getInstance(false);

      expect(instance1).to.equal(instance2);
      expect(instance1).to.be.an.instanceOf(PolicyFilter);
      expect(instance1.isEnabled).to.equal(true);
    });

    it('should create new instance when none exists', () => {
      const instance = PolicyFilter.getInstance(false);

      expect(instance).to.be.an.instanceOf(PolicyFilter);
      expect(instance.isEnabled).to.equal(false);
    });

    it('should use default isEnabled value of false', () => {
      const instance = PolicyFilter.getInstance();

      expect(instance.isEnabled).to.equal(false);
    });
  });

  describe('addPolicySetAttrs()', () => {
    let policyFilter;
    let mockPolicySet;
    let mockPolicy;

    beforeEach(() => {
      policyFilter = new PolicyFilter(true);

      mockPolicy = {
        idAttr: 'policy1',
        target: {
          anyOfSelections: [{
            allOfSelections: [{
              matches: [{
                evals: { category: 'subject', id: 'subject-id' },
                attrValue: { value: 'user123' }
              }]
            }]
          }]
        }
      };

      mockPolicySet = {
        idAttr: 'policyset1',
        target: {
          anyOfSelections: [{
            allOfSelections: [{
              matches: [{
                evals: { category: 'resource', id: 'resource-id' },
                attrValue: { value: 'resource456' }
              }]
            }]
          }]
        },
        children: [mockPolicy]
      };
    });

    it('should return early when not enabled', () => {
      policyFilter.isEnabled = false;

      policyFilter.addPolicySetAttrs(mockPolicySet);

      expect(policyFilter.bloomFilters).to.be.empty;
    });

    it('should add policy set attributes to bloom filter', () => {
      policyFilter.addPolicySetAttrs(mockPolicySet);

      expect(policyFilter.bloomFilters).to.have.property('policyset1');
      expect(policyFilter.bloomFilters.policyset1).to.have.property('policySetBloomFilter');
      expect(policyFilter.bloomFilters.policyset1).to.have.property('category');
      expect(policyFilter.bloomFilters.policyset1.category).to.deep.equal(['resource']);
    });

    it('should add policy attributes to bloom filter', () => {
      policyFilter.addPolicySetAttrs(mockPolicySet);

      expect(policyFilter.bloomFilters).to.have.property('policy1');
      expect(policyFilter.bloomFilters.policy1).to.have.property('policyBloomFilter');
      expect(policyFilter.bloomFilters.policy1).to.have.property('categories');
      expect(policyFilter.bloomFilters.policy1.categories).to.deep.equal(['subject']);
    });

    it('should handle multiple matches in policy set', () => {
      mockPolicySet.target.anyOfSelections.push({
        allOfSelections: [{
          matches: [{
            evals: { category: 'action', id: 'action-id' },
            attrValue: { value: 'read' }
          }]
        }]
      });

      policyFilter.addPolicySetAttrs(mockPolicySet);

      expect(policyFilter.bloomFilters.policyset1.category).to.deep.equal(['resource', 'action']);
    });
  });

  describe('setPolicySetId()', () => {
    it('should set the policy set id', () => {
      const policyFilter = new PolicyFilter(true);

      policyFilter.setPolicySetId('test-policy-set-id');

      expect(policyFilter.policySetId).to.equal('test-policy-set-id');
    });
  });

  describe('checkExist()', () => {
    let policyFilter;
    let mockBloomFilter;

    beforeEach(() => {
      policyFilter = new PolicyFilter(true);

      mockBloomFilter = {
        test: sinon.stub()
      };

      policyFilter.bloomFilters = {
        'policy1': {
          categories: ['subject', 'resource'],
          policyBloomFilter: mockBloomFilter
        }
      };
    });

    it('should return true when not enabled', () => {
      policyFilter.isEnabled = false;

      const result = policyFilter.checkExist('policy1', []);

      expect(result).to.equal(true);
    });

    it('should return true when attribute matches bloom filter', () => {
      const attributeSet = [{
        category: 'subject',
        attributes: [{
          id: 'subject-id',
          getValue: () => ({ value: 'user123' })
        }]
      }];

      mockBloomFilter.test.withArgs('subject-id:user123').returns(true);

      const result = policyFilter.checkExist('policy1', attributeSet);

      expect(result).to.equal(true);
      expect(mockBloomFilter.test.calledOnce).to.be.true;
    });

    it('should return false when no attributes match bloom filter', () => {
      const attributeSet = [{
        category: 'subject',
        attributes: [{
          id: 'subject-id',
          getValue: () => ({ value: 'user123' })
        }]
      }];

      mockBloomFilter.test.withArgs('subject-id:user123').returns(false);

      const result = policyFilter.checkExist('policy1', attributeSet);

      expect(result).to.equal(false);
    });

    it('should skip categories not in filtered categories', () => {
      const attributeSet = [{
        category: 'environment', // not in filtered categories
        attributes: [{
          id: 'env-id',
          getValue: () => ({ value: 'value' })
        }]
      }];

      const result = policyFilter.checkExist('policy1', attributeSet);

      expect(result).to.equal(true);
      expect(mockBloomFilter.test.notCalled).to.be.true;
    });

    it('should handle multiple attributes in a category', () => {
      const attributeSet = [{
        category: 'subject',
        attributes: [
          {
            id: 'subject-id1',
            getValue: () => ({ value: 'user123' })
          },
          {
            id: 'subject-id2',
            getValue: () => ({ value: 'user456' })
          }
        ]
      }];

      mockBloomFilter.test.withArgs('subject-id1:user123').returns(false);
      mockBloomFilter.test.withArgs('subject-id2:user456').returns(true);

      const result = policyFilter.checkExist('policy1', attributeSet);

      expect(result).to.equal(true);
    });

    it('should return false when all attributes in a category fail', () => {
      const attributeSet = [{
        category: 'subject',
        attributes: [
          {
            id: 'subject-id1',
            getValue: () => ({ value: 'user123' })
          },
          {
            id: 'subject-id2',
            getValue: () => ({ value: 'user456' })
          }
        ]
      }];

      mockBloomFilter.test.returns(false);

      const result = policyFilter.checkExist('policy1', attributeSet);

      expect(result).to.equal(false);
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      const policyFilter = new PolicyFilter(true);

      expect(policyFilter).to.have.property('addPolicySetAttrs');
      expect(policyFilter.addPolicySetAttrs).to.be.a('function');
      expect(policyFilter).to.have.property('setPolicySetId');
      expect(policyFilter.setPolicySetId).to.be.a('function');
      expect(policyFilter).to.have.property('checkExist');
      expect(policyFilter.checkExist).to.be.a('function');
    });

    it('should work with real BloomFilter instances', () => {
      const policyFilter = new PolicyFilter(true);

      const mockPolicySet = {
        idAttr: 'test-policyset',
        target: {
          anyOfSelections: [{
            allOfSelections: [{
              matches: [{
                evals: { category: 'subject', id: 'role' },
                attrValue: { value: 'admin' }
              }]
            }]
          }]
        },
        children: []
      };

      expect(() => policyFilter.addPolicySetAttrs(mockPolicySet)).to.not.throw();
      expect(policyFilter.bloomFilters).to.have.property('test-policyset');
    });
  });
});