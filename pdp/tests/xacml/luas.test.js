const { expect } = require('chai');

describe('Luas', () => {
  let Luas;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/luas')];
    Luas = require('../../xacml/luas');
  });

  describe('constructor', () => {
    it('should create a Luas instance with policy files', () => {
      const policyFiles = ['policy1.xml', 'policy2.xml'];
      const luas = new Luas(policyFiles);

      expect(luas).to.be.an.instanceOf(Luas);
      expect(luas.policyFiles).to.deep.equal(policyFiles);
    });
  });

  describe('create()', () => {
    it('should have create static method', () => {
      expect(Luas.create).to.be.a('function');
    });
  });

  describe('evaluates()', () => {
    it('should have evaluates method', () => {
      const luas = new Luas(['policy.xml']);

      expect(luas.evaluates).to.be.a('function');
    });

    it('should handle invalid request XML gracefully', () => {
      const luas = new Luas(['policy.xml']);

      // This will fail due to missing dependencies but should not throw
      const result = luas.evaluates('<invalid></invalid>');

      // Should return an error result structure
      expect(result).to.be.an('object');
      expect(result).to.have.property('decision');
      expect(result).to.have.property('obligations');
      expect(result).to.have.property('attributes');
      expect(result).to.have.property('reason');
      expect(result).to.have.property('message');
    });
  });

  describe('evaluate()', () => {
    it('should have evaluate method', () => {
      const luas = new Luas(['policy.xml']);

      expect(luas.evaluate).to.be.a('function');
    });
  });

  describe('_evaluateCallBack()', () => {
    it('should have _evaluateCallBack method', () => {
      const luas = new Luas(['policy.xml']);

      expect(luas._evaluateCallBack).to.be.a('function');
    });
  });

  describe('_getFullObligationsFromPolicy()', () => {
    it('should have _getFullObligationsFromPolicy method', () => {
      const luas = new Luas(['policy.xml']);

      expect(luas._getFullObligationsFromPolicy).to.be.a('function');
    });

    it('should return empty array when no obligations provided', () => {
      const luas = new Luas(['policy.xml']);

      const result = luas._getFullObligationsFromPolicy(null);
      expect(result).to.deep.equal([]);

      const result2 = luas._getFullObligationsFromPolicy([]);
      expect(result2).to.deep.equal([]);
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      const luas = new Luas(['policy.xml']);

      expect(luas).to.have.property('evaluate');
      expect(luas.evaluate).to.be.a('function');
      expect(luas).to.have.property('evaluates');
      expect(luas.evaluates).to.be.a('function');
      expect(luas).to.have.property('_evaluateCallBack');
      expect(luas._evaluateCallBack).to.be.a('function');
      expect(luas).to.have.property('_getFullObligationsFromPolicy');
      expect(luas._getFullObligationsFromPolicy).to.be.a('function');
    });

    it('should store policy files correctly', () => {
      const policyFiles = ['policy1.xml', 'policy2.xml', 'policy3.xml'];
      const luas = new Luas(policyFiles);

      expect(luas.policyFiles).to.deep.equal(policyFiles);
      expect(luas.policyFiles).to.have.lengthOf(3);
    });
  });
});