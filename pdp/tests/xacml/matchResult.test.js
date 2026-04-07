const { expect } = require('chai');
const sinon = require('sinon');

describe('MatchResult', () => {
  let MatchResult;
  let matchResult;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/matchResult')];
    MatchResult = require('../../xacml/matchResult');
    matchResult = new MatchResult();
  });

  describe('constants', () => {
    it('should have MATCH constant equal to 0', () => {
      expect(MatchResult.prototype.MATCH).to.equal(0);
    });

    it('should have NO_MATCH constant equal to 1', () => {
      expect(MatchResult.prototype.NO_MATCH).to.equal(1);
    });

    it('should have INDETERMINATE constant equal to 2', () => {
      expect(MatchResult.prototype.INDETERMINATE).to.equal(2);
    });
  });

  describe('matchResultInit()', () => {
    it('should initialize with MATCH result', () => {
      matchResult.matchResultInit(MatchResult.prototype.MATCH);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.MATCH);
      expect(matchResult.getStatus()).to.be.null;
    });

    it('should initialize with NO_MATCH result', () => {
      matchResult.matchResultInit(MatchResult.prototype.NO_MATCH);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.NO_MATCH);
      expect(matchResult.getStatus()).to.be.null;
    });

    it('should initialize with INDETERMINATE result', () => {
      matchResult.matchResultInit(MatchResult.prototype.INDETERMINATE);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.INDETERMINATE);
      expect(matchResult.getStatus()).to.be.null;
    });
  });

  describe('setResult()', () => {
    it('should set result and status for valid MATCH', () => {
      const status = { code: 'ok' };
      matchResult.setResult(MatchResult.prototype.MATCH, status);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.MATCH);
      expect(matchResult.getStatus()).to.equal(status);
    });

    it('should set result and status for valid NO_MATCH', () => {
      const status = { code: 'not_found' };
      matchResult.setResult(MatchResult.prototype.NO_MATCH, status);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.NO_MATCH);
      expect(matchResult.getStatus()).to.equal(status);
    });

    it('should set result and status for valid INDETERMINATE', () => {
      const status = { code: 'error' };
      matchResult.setResult(MatchResult.prototype.INDETERMINATE, status);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.INDETERMINATE);
      expect(matchResult.getStatus()).to.equal(status);
    });

    it('should set result with null status', () => {
      matchResult.setResult(MatchResult.prototype.MATCH, null);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.MATCH);
      expect(matchResult.getStatus()).to.be.null;
    });

    it('should handle invalid result values', () => {
      const consoleSpy = sinon.spy(console, 'error');

      matchResult.setResult(999, null);

      expect(consoleSpy.calledWith('Input result is not a valid value')).to.be.true;
      expect(matchResult.getResult()).to.equal(999); // Still sets the invalid value
      expect(matchResult.getStatus()).to.be.null;

      consoleSpy.restore();
    });
  });

  describe('getResult()', () => {
    it('should return the current result', () => {
      matchResult.setResult(MatchResult.prototype.MATCH, null);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.MATCH);
    });

    it('should return undefined when no result is set', () => {
      expect(matchResult.getResult()).to.be.undefined;
    });
  });

  describe('getStatus()', () => {
    it('should return the current status', () => {
      const status = { code: 'ok' };
      matchResult.setResult(MatchResult.prototype.MATCH, status);

      expect(matchResult.getStatus()).to.equal(status);
    });

    it('should return null when no status is set', () => {
      matchResult.setResult(MatchResult.prototype.MATCH, null);

      expect(matchResult.getStatus()).to.be.null;
    });

    it('should return undefined when no result is set', () => {
      expect(matchResult.getStatus()).to.be.undefined;
    });
  });

  describe('integration tests', () => {
    it('should work with matchResultInit and getters', () => {
      matchResult.matchResultInit(MatchResult.prototype.NO_MATCH);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.NO_MATCH);
      expect(matchResult.getStatus()).to.be.null;
    });

    it('should allow changing result after initialization', () => {
      matchResult.matchResultInit(MatchResult.prototype.MATCH);
      const newStatus = { code: 'changed' };
      matchResult.setResult(MatchResult.prototype.INDETERMINATE, newStatus);

      expect(matchResult.getResult()).to.equal(MatchResult.prototype.INDETERMINATE);
      expect(matchResult.getStatus()).to.equal(newStatus);
    });
  });
});