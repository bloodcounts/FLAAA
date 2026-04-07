const { expect } = require('chai');

describe('SelectorModule', () => {
  let SelectorModule;
  let selectorModule;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/selectorModule')];
    SelectorModule = require('../../xacml/selectorModule');
    selectorModule = new SelectorModule();
  });

  describe('constructor', () => {
    it('should create a SelectorModule instance', () => {
      expect(selectorModule).to.be.an.instanceof(SelectorModule);
    });
  });

  describe('isDesignatorSupported()', () => {
    it('should return false', () => {
      expect(selectorModule.isDesignatorSupported()).to.be.false;
    });
  });

  describe('isSelectorSupported()', () => {
    it('should return true', () => {
      expect(selectorModule.isSelectorSupported()).to.be.true;
    });
  });

  describe('integration tests', () => {
    it('should have both methods defined', () => {
      expect(selectorModule.isDesignatorSupported).to.be.a('function');
      expect(selectorModule.isSelectorSupported).to.be.a('function');
    });

    it('should return correct support values', () => {
      expect(selectorModule.isDesignatorSupported()).to.equal(false);
      expect(selectorModule.isSelectorSupported()).to.equal(true);
    });
  });
});