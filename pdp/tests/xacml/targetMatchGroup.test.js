const { expect } = require('chai');
const sinon = require('sinon');
const TargetMatchGroup = require('../../xacml/targetMatchGroup');
const TargetMatch = require('../../xacml/targetMatch');
const MatchResult = require('../../xacml/matchResult');

describe('TargetMatchGroup', function() {
  let mockTargetMatch;
  let mockContext;
  let mockMetaData;

  beforeEach(function() {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/targetMatchGroup')];
    delete require.cache[require.resolve('../../xacml/targetMatch')];

    // Create mocks
    mockTargetMatch = {
      match: sinon.stub()
    };

    mockContext = {};
    mockMetaData = {};

    // Mock TargetMatch.getInstance
    sinon.stub(TargetMatch.prototype, 'getInstance').returns(mockTargetMatch);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Constructor', function() {
    it('should create a TargetMatchGroup instance', function() {
      const targetMatchGroup = new TargetMatchGroup([mockTargetMatch], 0);
      expect(targetMatchGroup).to.be.an.instanceOf(TargetMatchGroup);
      expect(targetMatchGroup.matches).to.deep.equal([mockTargetMatch]);
      expect(targetMatchGroup.matchType).to.equal(0);
    });

    it('should handle null matchElements', function() {
      const targetMatchGroup = new TargetMatchGroup(null, 0);
      expect(targetMatchGroup.matches).to.deep.equal([]);
      expect(targetMatchGroup.matchType).to.equal(0);
    });
  });

  describe('Factory Method - getInstance', function() {
    it('should create instance from XML root', function() {
      const mockChildren = [
        { name: sinon.stub().returns('Subject Match') },
        { name: sinon.stub().returns('Resource Match') }
      ];

      const mockRoot = {
        childNodes: sinon.stub().returns({
          length: sinon.stub().returns(mockChildren.length),
          0: mockChildren[0],
          1: mockChildren[1]
        })
      };

      const targetMatchGroup = new TargetMatchGroup([], 0);
      const instance = targetMatchGroup.getInstance(mockRoot, mockMetaData);
      expect(instance).to.be.an.instanceOf(TargetMatchGroup);
    });

    it('should handle empty child nodes', function() {
      const emptyRoot = {
        childNodes: sinon.stub().returns({
          length: sinon.stub().returns(0)
        })
      };

      const targetMatchGroup = new TargetMatchGroup([], 0);
      const instance = targetMatchGroup.getInstance(emptyRoot, mockMetaData);
      expect(instance.matches).to.have.lengthOf(0);
    });
  });

  describe('Match Evaluation', function() {
    it('should return MATCH when no matches in group', function() {
      const targetMatchGroup = new TargetMatchGroup([], 0);
      const result = targetMatchGroup.match(mockContext);

      expect(result).to.be.an.instanceOf(MatchResult);
      expect(result.getResult()).to.equal(MatchResult.prototype.MATCH);
    });

    it('should return MATCH when all matches succeed', function() {
      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.MATCH);

      mockTargetMatch.match.returns(matchResult);

      const targetMatchGroup = new TargetMatchGroup([mockTargetMatch, mockTargetMatch], 0);
      const result = targetMatchGroup.match(mockContext);

      expect(result).to.equal(matchResult);
      expect(mockTargetMatch.match.calledTwice).to.be.true;
    });

    it('should return NO_MATCH when first match fails', function() {
      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.NO_MATCH);

      mockTargetMatch.match.returns(matchResult);

      const targetMatchGroup = new TargetMatchGroup([mockTargetMatch, mockTargetMatch], 0);
      const result = targetMatchGroup.match(mockContext);

      expect(result).to.equal(matchResult);
      expect(mockTargetMatch.match.calledOnce).to.be.true;
    });

    it('should return INDETERMINATE when match returns indeterminate', function() {
      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.INDETERMINATE);

      mockTargetMatch.match.returns(matchResult);

      const targetMatchGroup = new TargetMatchGroup([mockTargetMatch, mockTargetMatch], 0);
      const result = targetMatchGroup.match(mockContext);

      expect(result).to.equal(matchResult);
      expect(mockTargetMatch.match.calledOnce).to.be.true;
    });

    it('should short-circuit on first non-match result', function() {
      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.NO_MATCH);

      const successResult = new MatchResult();
      successResult.matchResultInit(MatchResult.prototype.MATCH);

      mockTargetMatch.match.onFirstCall().returns(matchResult);
      mockTargetMatch.match.onSecondCall().returns(successResult);

      const targetMatchGroup = new TargetMatchGroup([mockTargetMatch, mockTargetMatch], 0);
      const result = targetMatchGroup.match(mockContext);

      expect(result).to.equal(matchResult);
      expect(mockTargetMatch.match.calledOnce).to.be.true;
    });
  });

  describe('Integration Tests', function() {
    it('should handle mixed match results correctly', function() {
      const indeterminateResult = new MatchResult();
      indeterminateResult.matchResultInit(MatchResult.prototype.INDETERMINATE);

      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.MATCH);

      mockTargetMatch.match.onFirstCall().returns(matchResult);
      mockTargetMatch.match.onSecondCall().returns(indeterminateResult);

      const targetMatchGroup = new TargetMatchGroup([mockTargetMatch, mockTargetMatch], 0);
      const result = targetMatchGroup.match(mockContext);

      expect(result).to.equal(indeterminateResult);
      expect(mockTargetMatch.match.calledTwice).to.be.true;
    });

    it('should work with different match types', function() {
      const targetMatchGroup = new TargetMatchGroup([mockTargetMatch], 1); // Resource type
      expect(targetMatchGroup.matchType).to.equal(1);

      const matchResult = new MatchResult();
      matchResult.matchResultInit(MatchResult.prototype.MATCH);
      mockTargetMatch.match.returns(matchResult);

      const result = targetMatchGroup.match(mockContext);
      expect(result).to.equal(matchResult);
    });
  });

  describe('Error Handling', function() {
    it('should handle invalid childNodes structure', function() {
      const invalidRoot = {
        childNodes: sinon.stub().throws(new Error('Invalid XML structure'))
      };

      const targetMatchGroup = new TargetMatchGroup([], 0);

      expect(() => {
        targetMatchGroup.getInstance(invalidRoot, mockMetaData);
      }).to.throw();
    });
  });
});