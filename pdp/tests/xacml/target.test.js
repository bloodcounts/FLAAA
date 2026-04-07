const { expect } = require('chai');
const sinon = require('sinon');

describe('Target', () => {
  let Target;
  let MatchResult;
  let target;

  beforeEach(() => {
    // Clear require cache to get fresh modules
    delete require.cache[require.resolve('../../xacml/target')];
    delete require.cache[require.resolve('../../xacml/matchResult')];
    Target = require('../../xacml/target');
    MatchResult = require('../../xacml/matchResult');
    target = new Target();
  });

  describe('constructor', () => {
    it('should create a Target instance', () => {
      expect(target).to.be.an.instanceof(Target);
    });
  });

  describe('targetInit()', () => {
    it('should initialize target with subjects, resources, and actions', () => {
      const subjects = ['subject1', 'subject2'];
      const resources = ['resource1'];
      const actions = ['action1'];

      target.targetInit(subjects, resources, actions);

      expect(target.subjects).to.equal(subjects);
      expect(target.resources).to.equal(resources);
      expect(target.actions).to.equal(actions);
    });

    it('should handle null values', () => {
      target.targetInit(null, null, null);

      expect(target.subjects).to.be.null;
      expect(target.resources).to.be.null;
      expect(target.actions).to.be.null;
    });
  });

  describe('getInstance()', () => {
    it('should create target from XML root', () => {
      // This method has complex XML parsing dependencies, so we test that it exists and is callable
      const mockRoot = {
        childNodes: () => []
      };

      expect(() => {
        Target.prototype.getInstance(mockRoot, 'xpath-version');
      }).to.not.throw();
    });

    it('should handle root with minimal structure', () => {
      const mockRoot = {
        childNodes: () => []
      };

      const result = Target.prototype.getInstance(mockRoot, 'xpath-version');

      expect(result).to.be.an.instanceof(Target);
      expect(result.subjects).to.be.null;
      expect(result.resources).to.be.null;
      expect(result.actions).to.be.null;
    });
  });

  describe('getActions()', () => {
    it('should return the actions array', () => {
      const actions = ['action1', 'action2'];
      target.actions = actions;

      const result = target.getActions();

      expect(result).to.equal(actions);
    });

    it('should return undefined when actions not set', () => {
      const result = target.getActions();

      expect(result).to.be.undefined;
    });
  });

  describe('match()', () => {
    let mockContext;

    beforeEach(() => {
      mockContext = {};
    });

    it('should return MATCH when all sections match', () => {
      const mockMatchResult = {
        getResult: () => MatchResult.prototype.MATCH
      };

      target.subjects = [['subject-match']];
      target.resources = [['resource-match']];
      target.actions = [['action-match']];

      const checkSetStub = sinon.stub(target, 'checkSet');
      checkSetStub.onCall(0).returns(mockMatchResult); // subjects
      checkSetStub.onCall(1).returns(mockMatchResult); // resources
      checkSetStub.onCall(2).returns(mockMatchResult); // actions

      const result = target.match(mockContext);

      expect(result.getResult()).to.equal(MatchResult.prototype.MATCH);
      expect(checkSetStub.callCount).to.equal(3);
    });

    it('should return NO_MATCH when subjects do not match', () => {
      const noMatchResult = {
        getResult: () => MatchResult.prototype.NO_MATCH
      };

      target.subjects = [['subject-match']];
      target.resources = [['resource-match']];
      target.actions = [['action-match']];

      const checkSetStub = sinon.stub(target, 'checkSet');
      checkSetStub.onCall(0).returns(noMatchResult);

      const result = target.match(mockContext);

      expect(result).to.equal(noMatchResult);
      expect(checkSetStub.callCount).to.equal(1);
    });

    it('should return NO_MATCH when resources do not match', () => {
      const matchResult = {
        getResult: () => MatchResult.prototype.MATCH
      };
      const noMatchResult = {
        getResult: () => MatchResult.prototype.NO_MATCH
      };

      target.subjects = [['subject-match']];
      target.resources = [['resource-match']];
      target.actions = [['action-match']];

      const checkSetStub = sinon.stub(target, 'checkSet');
      checkSetStub.onCall(0).returns(matchResult); // subjects match
      checkSetStub.onCall(1).returns(noMatchResult); // resources don't match

      const result = target.match(mockContext);

      expect(result).to.equal(noMatchResult);
      expect(checkSetStub.callCount).to.equal(2);
    });

    it('should return NO_MATCH when actions do not match', () => {
      const matchResult = {
        getResult: () => MatchResult.prototype.MATCH
      };
      const noMatchResult = {
        getResult: () => MatchResult.prototype.NO_MATCH
      };

      target.subjects = [['subject-match']];
      target.resources = [['resource-match']];
      target.actions = [['action-match']];

      const checkSetStub = sinon.stub(target, 'checkSet');
      checkSetStub.onCall(0).returns(matchResult); // subjects match
      checkSetStub.onCall(1).returns(matchResult); // resources match
      checkSetStub.onCall(2).returns(noMatchResult); // actions don't match

      const result = target.match(mockContext);

      expect(result).to.equal(noMatchResult);
      expect(checkSetStub.callCount).to.equal(3);
    });

    it('should skip subjects check when subjects is null', () => {
      const matchResult = {
        getResult: () => MatchResult.prototype.MATCH
      };

      target.subjects = null;
      target.resources = [['resource-match']];
      target.actions = [['action-match']];

      const checkSetStub = sinon.stub(target, 'checkSet');
      checkSetStub.onCall(0).returns(matchResult); // resources
      checkSetStub.onCall(1).returns(matchResult); // actions

      const result = target.match(mockContext);

      expect(result.getResult()).to.equal(MatchResult.prototype.MATCH);
      expect(checkSetStub.callCount).to.equal(2);
    });

    it('should skip resources check when resources is null', () => {
      const matchResult = {
        getResult: () => MatchResult.prototype.MATCH
      };

      target.subjects = [['subject-match']];
      target.resources = null;
      target.actions = [['action-match']];

      const checkSetStub = sinon.stub(target, 'checkSet');
      checkSetStub.onCall(0).returns(matchResult); // subjects
      checkSetStub.onCall(1).returns(matchResult); // actions

      const result = target.match(mockContext);

      expect(result.getResult()).to.equal(MatchResult.prototype.MATCH);
      expect(checkSetStub.callCount).to.equal(2);
    });

    it('should skip actions check when actions is null', () => {
      const matchResult = {
        getResult: () => MatchResult.prototype.MATCH
      };

      target.subjects = [['subject-match']];
      target.resources = [['resource-match']];
      target.actions = null;

      const checkSetStub = sinon.stub(target, 'checkSet');
      checkSetStub.onCall(0).returns(matchResult); // subjects
      checkSetStub.onCall(1).returns(matchResult); // resources

      const result = target.match(mockContext);

      expect(result.getResult()).to.equal(MatchResult.prototype.MATCH);
      expect(checkSetStub.callCount).to.equal(2);
    });
  });

  describe('checkSet()', () => {
    it('should return MATCH when any match list matches completely', () => {
      const mockMatch = {
        match: sinon.stub().returns({ getResult: () => MatchResult.prototype.MATCH })
      };

      const matchList = [
        [mockMatch] // One match list with one match that succeeds
      ];

      const result = target.checkSet(matchList, {});

      expect(result.getResult()).to.equal(MatchResult.prototype.MATCH);
      expect(mockMatch.match.calledOnce).to.be.true;
    });

    it('should return NO_MATCH when all match lists fail', () => {
      const mockNoMatch = {
        match: sinon.stub().returns({ getResult: () => MatchResult.prototype.NO_MATCH })
      };

      const matchList = [
        [mockNoMatch], // First match list fails
        [mockNoMatch]  // Second match list also fails
      ];

      const result = target.checkSet(matchList, {});

      expect(result.getResult()).to.equal(MatchResult.prototype.NO_MATCH);
    });

    it('should return INDETERMINATE when some matches are indeterminate', () => {
      const mockNoMatch = {
        match: sinon.stub().returns({ getResult: () => MatchResult.prototype.NO_MATCH })
      };
      const mockIndeterminate = {
        match: sinon.stub().returns({
          getResult: () => MatchResult.prototype.INDETERMINATE,
          getStatus: () => 'indeterminate-status'
        })
      };

      const matchList = [
        [mockNoMatch],        // First match list fails
        [mockIndeterminate]   // Second match list is indeterminate
      ];

      const result = target.checkSet(matchList, {});

      expect(result.getResult()).to.equal(MatchResult.prototype.INDETERMINATE);
    });

    it('should break early when a match in a list fails', () => {
      const mockMatch1 = {
        match: sinon.stub().returns({ getResult: () => MatchResult.prototype.MATCH })
      };
      const mockMatch2 = {
        match: sinon.stub().returns({ getResult: () => MatchResult.prototype.NO_MATCH })
      };
      const mockMatch3 = {
        match: sinon.stub() // Should not be called
      };

      const matchList = [
        [mockMatch1, mockMatch2, mockMatch3] // Only first two should be called
      ];

      const result = target.checkSet(matchList, {});

      expect(result.getResult()).to.equal(MatchResult.prototype.NO_MATCH);
      expect(mockMatch1.match.calledOnce).to.be.true;
      expect(mockMatch2.match.calledOnce).to.be.true;
      expect(mockMatch3.match.called).to.be.false;
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      expect(target.targetInit).to.be.a('function');
      expect(target.getInstance).to.be.a('function');
      expect(target.getActions).to.be.a('function');
      expect(target.match).to.be.a('function');
      expect(target.checkSet).to.be.a('function');
    });

    it('should initialize and match correctly', () => {
      const subjects = [['subject-match']];
      const resources = [['resource-match']];
      const actions = [['action-match']];

      target.targetInit(subjects, resources, actions);

      expect(target.getActions()).to.equal(actions);

      // Mock successful matching
      const matchResult = {
        getResult: () => MatchResult.prototype.MATCH
      };
      const checkSetStub = sinon.stub(target, 'checkSet').returns(matchResult);

      const result = target.match({});

      expect(result.getResult()).to.equal(MatchResult.prototype.MATCH);
      expect(checkSetStub.callCount).to.equal(3);
    });
  });
});