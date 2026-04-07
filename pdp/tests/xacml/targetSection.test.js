const { expect } = require('chai');
const sinon = require('sinon');
const TargetSection = require('../../xacml/targetSection');
const TargetMatchGroup = require('../../xacml/targetMatchGroup');
const MatchResult = require('../../xacml/matchResult');

describe('TargetSection', function() {
  let mockTargetMatchGroup;
  let mockMetaData;
  let mockContext;
  let mockRoot;

  beforeEach(function() {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/targetSection')];
    delete require.cache[require.resolve('../../xacml/targetMatchGroup')];

    // Create mocks
    mockTargetMatchGroup = {
      match: sinon.stub(),
      getInstance: sinon.stub()
    };

    mockMetaData = {
      getXACMLVersion: sinon.stub().returns(2) // Default to XACML 2.0
    };

    mockContext = {
      // Mock evaluation context
    };

    // Mock root with getChildNodes
    mockRoot = {
      getChildNodes: sinon.stub().returns({
        length: 3,
        0: { 
          name: sinon.stub().returns('Subject'),
          childNodes: sinon.stub().returns({ length: sinon.stub().returns(0) })
        },
        1: { 
          name: sinon.stub().returns('Subject'),
          childNodes: sinon.stub().returns({ length: sinon.stub().returns(0) })
        },
        2: { 
          name: sinon.stub().returns('AnySubject'),
          childNodes: sinon.stub().returns({ length: sinon.stub().returns(0) })
        }
      })
    };

    // Mock TargetMatchGroup.getInstance
    // Note: This will be stubbed individually in tests that need it
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Constructor', function() {
    it('should create a TargetSection instance', function() {
      const targetSection = new TargetSection([mockTargetMatchGroup], 0, 2);
      expect(targetSection).to.be.an.instanceOf(TargetSection);
      expect(targetSection.matchGroups).to.deep.equal([mockTargetMatchGroup]);
      expect(targetSection.matchType).to.equal(0);
      expect(targetSection.xacmlVersion).to.equal(2);
    });

    it('should handle null matchGroups', function() {
      const targetSection = new TargetSection(null, 0, 2);
      expect(targetSection.matchGroups).to.deep.equal([]);
      expect(targetSection.matchType).to.equal(0);
      expect(targetSection.xacmlVersion).to.equal(2);
    });

    it('should handle undefined matchGroups', function() {
      const targetSection = new TargetSection(undefined, 1, 3);
      expect(targetSection.matchGroups).to.deep.equal([]);
      expect(targetSection.matchType).to.equal(1);
      expect(targetSection.xacmlVersion).to.equal(3);
    });
  });

  describe('Factory Method - getInstance', function() {
    it('should create instance from XML root for Subject type', function() {
      const targetSection = TargetSection.prototype.getInstance(mockRoot, 0, mockMetaData);
      expect(targetSection).to.be.an.instanceOf(TargetSection);
      expect(targetSection.matchType).to.equal(0);
      expect(targetSection.xacmlVersion).to.equal(2);
    });

    it('should create instance from XML root for Resource type', function() {
      const targetSection = TargetSection.prototype.getInstance(mockRoot, 1, mockMetaData);
      expect(targetSection).to.be.an.instanceOf(TargetSection);
      expect(targetSection.matchType).to.equal(1);
    });

    it('should create instance from XML root for Action type', function() {
      const targetSection = TargetSection.prototype.getInstance(mockRoot, 2, mockMetaData);
      expect(targetSection).to.be.an.instanceOf(TargetSection);
      expect(targetSection.matchType).to.equal(2);
    });

    it('should filter child nodes by match type', function() {
      const getInstanceStub = sinon.stub(TargetMatchGroup.prototype, 'getInstance').returns(mockTargetMatchGroup);

      TargetSection.prototype.getInstance(mockRoot, 0, mockMetaData); // Subject type

      expect(getInstanceStub.calledTwice).to.be.true;
      expect(getInstanceStub.firstCall.calledWith(mockRoot.getChildNodes()[0], 0, mockMetaData)).to.be.true;
      expect(getInstanceStub.secondCall.calledWith(mockRoot.getChildNodes()[1], 0, mockMetaData)).to.be.true;
    });

    it('should stop processing when Any element is found', function() {
      const anyRoot = {
        getChildNodes: sinon.stub().returns({
          length: 2,
          0: { 
            name: sinon.stub().returns('Subject'),
            childNodes: sinon.stub().returns({ length: sinon.stub().returns(0) })
          },
          1: { 
            name: sinon.stub().returns('AnySubject'),
            childNodes: sinon.stub().returns({ length: sinon.stub().returns(0) })
          }
        })
      };

      const getInstanceStub = sinon.stub(TargetMatchGroup.prototype, 'getInstance').returns(mockTargetMatchGroup);
      TargetSection.prototype.getInstance(anyRoot, 0, mockMetaData);

      expect(getInstanceStub.calledOnce).to.be.true;
      getInstanceStub.restore();
    });

    it('should handle empty child nodes', function() {
      const emptyRoot = {
        getChildNodes: sinon.stub().returns({
          length: 0
        })
      };

      const targetSection = TargetSection.prototype.getInstance(emptyRoot, 0, mockMetaData);
      expect(targetSection.matchGroups).to.have.lengthOf(0);
    });

    it('should handle root with only Any element', function() {
      const anyRoot = {
        getChildNodes: sinon.stub().returns({
          length: 1,
          0: { name: sinon.stub().returns('AnySubject') }
        })
      };

      const targetSection = TargetSection.prototype.getInstance(anyRoot, 0, mockMetaData);
      expect(targetSection.matchGroups).to.have.lengthOf(0);
    });
  });

  describe('Match Evaluation', function() {
    it('should return MATCH when no match groups (empty section)', function() {
      const targetSection = new TargetSection([], 0, 2);
      const result = targetSection.match(mockContext);

      expect(result).to.be.an.instanceOf(MatchResult);
      expect(result.getResult()).to.equal(MatchResult.prototype.MATCH);
    });

    it('should return MATCH when first group matches', function() {
      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.MATCH);

      mockTargetMatchGroup.match.returns(matchResult);

      const targetSection = new TargetSection([mockTargetMatchGroup, mockTargetMatchGroup], 0, 2);
      const result = targetSection.match(mockContext);

      expect(result).to.equal(matchResult);
      expect(mockTargetMatchGroup.match.calledOnce).to.be.true;
    });

    it('should return MATCH when second group matches after first fails', function() {
      const noMatchResult = new MatchResult();
      noMatchResult.matchResultInit(MatchResult.prototype.NO_MATCH);

      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.MATCH);

      mockTargetMatchGroup.match.onFirstCall().returns(noMatchResult);
      mockTargetMatchGroup.match.onSecondCall().returns(matchResult);

      const targetSection = new TargetSection([mockTargetMatchGroup, mockTargetMatchGroup], 0, 2);
      const result = targetSection.match(mockContext);

      expect(result).to.equal(matchResult);
      expect(mockTargetMatchGroup.match.calledTwice).to.be.true;
    });

    it('should return NO_MATCH when all groups fail', function() {
      const noMatchResult = new MatchResult();
      noMatchResult.matchResultInit(MatchResult.prototype.NO_MATCH);

      mockTargetMatchGroup.match.returns(noMatchResult);

      const targetSection = new TargetSection([mockTargetMatchGroup, mockTargetMatchGroup], 0, 2);
      const result = targetSection.match(mockContext);

      expect(result).to.be.an.instanceOf(MatchResult);
      expect(result.getResult()).to.equal(MatchResult.prototype.NO_MATCH);
      expect(mockTargetMatchGroup.match.calledTwice).to.be.true;
    });

    it('should return INDETERMINATE when groups have indeterminate results', function() {
      const noMatchResult = new MatchResult();
      noMatchResult.matchResultInit(MatchResult.prototype.NO_MATCH);

      const indeterminateResult = new MatchResult();
      indeterminateResult.matchResultInit(MatchResult.prototype.INDETERMINATE);
      indeterminateResult.setResult(MatchResult.prototype.INDETERMINATE, 'test-status');

      mockTargetMatchGroup.match.onFirstCall().returns(noMatchResult);
      mockTargetMatchGroup.match.onSecondCall().returns(indeterminateResult);

      const targetSection = new TargetSection([mockTargetMatchGroup, mockTargetMatchGroup], 0, 2);
      const result = targetSection.match(mockContext);

      expect(result).to.be.an.instanceOf(MatchResult);
      expect(result.getResult()).to.equal(MatchResult.prototype.INDETERMINATE);
      expect(result.getStatus()).to.equal('test-status');
      expect(mockTargetMatchGroup.match.calledTwice).to.be.true;
    });

    it('should return first indeterminate status when multiple indeterminate results', function() {
      const indeterminateResult1 = new MatchResult();
      indeterminateResult1.matchResultInit(MatchResult.prototype.INDETERMINATE);
      indeterminateResult1.setResult(MatchResult.prototype.INDETERMINATE, 'first-status');

      const indeterminateResult2 = new MatchResult();
      indeterminateResult2.matchResultInit(MatchResult.prototype.INDETERMINATE);
      indeterminateResult2.setResult(MatchResult.prototype.INDETERMINATE, 'second-status');

      mockTargetMatchGroup.match.onFirstCall().returns(indeterminateResult1);
      mockTargetMatchGroup.match.onSecondCall().returns(indeterminateResult2);

      const targetSection = new TargetSection([mockTargetMatchGroup, mockTargetMatchGroup], 0, 2);
      const result = targetSection.match(mockContext);

      expect(result.getStatus()).to.equal('first-status');
    });

    it('should continue evaluating all groups even with indeterminate results', function() {
      const indeterminateResult = new MatchResult();
      indeterminateResult.matchResultInit(MatchResult.prototype.INDETERMINATE);
      indeterminateResult.setResult(MatchResult.prototype.INDETERMINATE, 'test-status');

      mockTargetMatchGroup.match.returns(indeterminateResult);

      const targetSection = new TargetSection([mockTargetMatchGroup, mockTargetMatchGroup, mockTargetMatchGroup], 0, 2);
      const result = targetSection.match(mockContext);

      expect(result.getResult()).to.equal(MatchResult.prototype.INDETERMINATE);
      expect(mockTargetMatchGroup.match.calledThrice).to.be.true;
    });
  });

  describe('Integration Tests', function() {
    it('should work with different match types', function() {
      const targetSection = new TargetSection([mockTargetMatchGroup], 1, 3); // Resource type, XACML 3.0
      expect(targetSection.matchType).to.equal(1);
      expect(targetSection.xacmlVersion).to.equal(3);

      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.MATCH);
      mockTargetMatchGroup.match.returns(matchResult);

      const result = targetSection.match(mockContext);
      expect(result).to.equal(matchResult);
    });

    it('should handle complex evaluation scenarios', function() {
      // Mix of MATCH, NO_MATCH, and INDETERMINATE results
      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.MATCH);

      const noMatchResult = new MatchResult();
      noMatchResult.matchResultInit(MatchResult.prototype.NO_MATCH);

      const indeterminateResult = new MatchResult();
      indeterminateResult.matchResultInit(MatchResult.prototype.INDETERMINATE);
      indeterminateResult.setResult(MatchResult.prototype.INDETERMINATE, 'error-status');

      mockTargetMatchGroup.match.onFirstCall().returns(noMatchResult);
      mockTargetMatchGroup.match.onSecondCall().returns(indeterminateResult);
      mockTargetMatchGroup.match.onThirdCall().returns(matchResult);

      const targetSection = new TargetSection([mockTargetMatchGroup, mockTargetMatchGroup, mockTargetMatchGroup], 0, 2);
      const result = targetSection.match(mockContext);

      // Should return MATCH because third group matches
      expect(result).to.equal(matchResult);
      expect(mockTargetMatchGroup.match.calledThrice).to.be.true;
    });
  });

  describe('Error Handling', function() {
    it('should handle invalid childNodes structure', function() {
      const invalidRoot = {
        getChildNodes: sinon.stub().throws(new Error('Invalid XML structure'))
      };

      expect(() => {
        TargetSection.prototype.getInstance(invalidRoot, 0, mockMetaData);
      }).to.throw();
    });

    it('should handle TargetMatchGroup.getInstance failures', function() {
      const getInstanceStub = sinon.stub(TargetMatchGroup.prototype, 'getInstance').throws(new Error('Factory error'));

      expect(() => {
        TargetSection.prototype.getInstance(mockRoot, 0, mockMetaData);
      }).to.throw('Factory error');

      getInstanceStub.restore();
    });

    it('should handle invalid match types gracefully', function() {
      // While the constructor accepts any matchType, the getInstance method
      // should handle edge cases
      const targetSection = new TargetSection([mockTargetMatchGroup], 999, 2);
      expect(targetSection.matchType).to.equal(999);

      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.MATCH);
      mockTargetMatchGroup.match.returns(matchResult);

      const result = targetSection.match(mockContext);
      expect(result).to.equal(matchResult);
    });
  });
});