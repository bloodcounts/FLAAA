const { expect } = require('chai');
const sinon = require('sinon');

describe('Policy', () => {
  let Policy;
  let AbstractPolicy;
  let policy;

  beforeEach(() => {
    // Clear require cache to get fresh modules
    delete require.cache[require.resolve('../../xacml/policy')];
    delete require.cache[require.resolve('../../xacml/abstractPolicy')];
    Policy = require('../../xacml/policy');
    AbstractPolicy = require('../../xacml/abstractPolicy');
    policy = new Policy();
  });

  describe('constructor', () => {
    it('should create a Policy instance that inherits from AbstractPolicy', () => {
      expect(policy).to.be.an.instanceof(Policy);
      expect(policy).to.be.an.instanceof(AbstractPolicy);
    });
  });

  describe('policyInit()', () => {
    it('should initialize policy', () => {
      // This method is currently empty, so we just test that it exists and is callable
      expect(() => {
        policy.policyInit();
      }).to.not.throw();
    });
  });

  describe('policyInitWithRoot()', () => {
    it('should initialize policy with root element', () => {
      const mockRoot = {
        childNodes: []
      };

      // Mock the abstractPolicyInitWithRoot method
      sinon.stub(policy, 'abstractPolicyInitWithRoot');
      sinon.stub(policy, 'getMetaData').returns({ getXACMLVersion: () => 3 });
      sinon.stub(policy, 'setChildren');

      policy.policyInitWithRoot(mockRoot);
    });

    it('should handle variable definitions', () => {
      const mockVariableNode = {
        nodeName: 'VariableDefinition',
        getAttribute: sinon.stub().returns('var-id')
      };

      const mockRoot = {
        childNodes: [mockVariableNode]
      };

      // Mock dependencies
      sinon.stub(policy, 'abstractPolicyInitWithRoot');
      sinon.stub(policy, 'setChildren');

      policy.policyInitWithRoot(mockRoot);

      expect(policy.definitions).to.be.a('set');
    });

    it('should throw error for duplicate variable definitions', () => {
      const mockVariableNode1 = {
        nodeName: 'VariableDefinition',
        getAttribute: sinon.stub().returns('var-id')
      };
      const mockVariableNode2 = {
        nodeName: 'VariableDefinition',
        getAttribute: sinon.stub().returns('var-id')
      };

      const mockRoot = {
        childNodes: [mockVariableNode1, mockVariableNode2]
      };

      // Mock dependencies
      sinon.stub(policy, 'abstractPolicyInitWithRoot');
      sinon.stub(policy, 'getMetaData').returns({
        getXACMLVersion: () => 3
      });

      expect(() => {
        policy.policyInitWithRoot(mockRoot);
      }).to.throw('multiple definitions for variable var-id');
    });
  });

  describe('getInstance()', () => {
    it('should create policy from root element', () => {
      const mockRoot = {
        nodeName: 'Policy',
        childNodes: [],
        getAttribute: sinon.stub()
      };

      // Mock policyInitWithRoot
      sinon.stub(policy, 'policyInitWithRoot');

      const result = Policy.prototype.getInstance(mockRoot);

      expect(result).to.be.an.instanceof(Policy);
    });

    it('should log error for invalid root node name', () => {
      const mockRoot = {
        nodeName: 'Invalid',
        childNodes: [],
        getAttribute: sinon.stub()
      };

      // Mock console.error to avoid output
      const consoleErrorStub = sinon.stub(console, 'error');

      const result = Policy.prototype.getInstance(mockRoot);

      expect(result).to.be.an.instanceof(Policy);
      expect(consoleErrorStub.calledWith('Cannot create Policy from root of type Invalid')).to.be.true;

      consoleErrorStub.restore();
    });
  });

  describe('parseParameters()', () => {
    it('should parse combiner parameters from root', () => {
      const mockParameterNode = {
        nodeName: 'CombinerParameter',
        attr: sinon.stub().returns({ value: sinon.stub().returns('param-name') }),
        childNodes: sinon.stub().returns([{
          getAttribute: sinon.stub().returns('http://www.w3.org/2001/XMLSchema#string'),
          nodeName: 'AttributeValue',
          childNodes: [{
            nodeType: 3, // TEXT_NODE
            data: 'test-value'
          }]
        }])
      };

      const mockRoot = {
        childNodes: [mockParameterNode]
      };

      const parameters = new Set();

      // Mock AttributeFactory
      const mockAttributeFactory = {
        getInstance: sinon.stub().returns({
          createValue: sinon.stub().returns('attribute-value')
        })
      };

      // Mock CombinerParameter
      const mockCombinerParameterInstance = 'parameter-instance';
      const mockCombinerParameter = function() {};
      mockCombinerParameter.prototype.getInstance = sinon.stub().returns(mockCombinerParameterInstance);

      // Mock the modules
      const originalAttributeFactory = require.cache[require.resolve('../../xacml/attr/attributeFactory')];
      const originalCombinerParameter = require.cache[require.resolve('../../xacml/cond/combinerParameter')];

      require.cache[require.resolve('../../xacml/attr/attributeFactory')] = {
        exports: mockAttributeFactory
      };
      require.cache[require.resolve('../../xacml/cond/combinerParameter')] = {
        exports: mockCombinerParameter
      };

      policy.parseParameters(parameters, mockRoot);

      expect(parameters.size).to.equal(1);

      // Restore original
      if (originalAttributeFactory) {
        require.cache[require.resolve('../../xacml/attr/attributeFactory')] = originalAttributeFactory;
      }
      if (originalCombinerParameter) {
        require.cache[require.resolve('../../xacml/cond/combinerParameter')] = originalCombinerParameter;
      }
    });

    it('should handle empty parameters', () => {
      const mockRoot = {
        childNodes: []
      };

      const parameters = new Set();

      policy.parseParameters(parameters, mockRoot);

      expect(parameters.size).to.equal(0);
    });
  });

  describe('inheritance from AbstractPolicy', () => {
    it('should inherit methods from AbstractPolicy', () => {
      expect(policy.abstractPolicyInitWithRoot).to.be.a('function');
      expect(policy.setChildren).to.be.a('function');
      expect(policy.getChildren).to.be.a('function');
      expect(policy.match).to.be.a('function');
      expect(policy.evaluate).to.be.a('function');
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      expect(policy.policyInit).to.be.a('function');
      expect(policy.policyInitWithRoot).to.be.a('function');
      expect(policy.getInstance).to.be.a('function');
      expect(policy.parseParameters).to.be.a('function');
    });

    it('should handle complete policy initialization', () => {
      const mockRoot = {
        nodeName: 'Policy',
        childNodes: [],
        getAttribute: sinon.stub()
      };

      // Mock dependencies
      sinon.stub(policy, 'abstractPolicyInitWithRoot');
      sinon.stub(policy, 'getMetaData').returns({
        getXACMLVersion: () => 3
      });
      sinon.stub(policy, 'setChildren');

      const result = Policy.prototype.getInstance(mockRoot);

      expect(result).to.be.an.instanceof(Policy);
    });
  });
});