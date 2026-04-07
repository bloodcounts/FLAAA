const { expect } = require('chai');

describe('ResourceFinderResult', () => {
  let ResourceFinderResult;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../../xacml/finder/resourceFinderResult')];
    ResourceFinderResult = require('../../../xacml/finder/resourceFinderResult');
  });

  describe('constructor', () => {
    it('should create a ResourceFinderResult instance', () => {
      const result = new ResourceFinderResult();
      expect(result).to.be.an.instanceof(ResourceFinderResult);
    });
  });

  describe('resourceFinderResultInit()', () => {
    it('should initialize result as empty', () => {
      const result = new ResourceFinderResult();

      result.resourceFinderResultInit();

      expect(result.empty).to.be.true;
    });
  });

  describe('getResources()', () => {
    it('should return the resources property', () => {
      const result = new ResourceFinderResult();
      const mockResources = ['resource1', 'resource2'];
      result.resources = mockResources;

      const resources = result.getResources();

      expect(resources).to.equal(mockResources);
    });

    it('should return undefined when resources is not set', () => {
      const result = new ResourceFinderResult();

      const resources = result.getResources();

      expect(resources).to.be.undefined;
    });
  });

  describe('isEmpty()', () => {
    it('should return true when result is empty', () => {
      const result = new ResourceFinderResult();
      result.resourceFinderResultInit();

      const isEmpty = result.isEmpty();

      expect(isEmpty).to.be.true;
    });

    it('should return false when result is not empty', () => {
      const result = new ResourceFinderResult();
      result.empty = false;

      const isEmpty = result.isEmpty();

      expect(isEmpty).to.be.false;
    });

    it('should return undefined when empty property is not set', () => {
      const result = new ResourceFinderResult();

      const isEmpty = result.isEmpty();

      expect(isEmpty).to.be.undefined;
    });
  });

  describe('integration tests', () => {
    it('should work with resourceFinderResultInit and getters', () => {
      const result = new ResourceFinderResult();

      result.resourceFinderResultInit();

      expect(result.isEmpty()).to.be.true;
      expect(result.getResources()).to.be.undefined;
    });

    it('should handle setting resources after initialization', () => {
      const result = new ResourceFinderResult();
      const mockResources = ['resource1', 'resource2'];

      result.resourceFinderResultInit();
      result.resources = mockResources;

      expect(result.isEmpty()).to.be.true; // empty property remains true
      expect(result.getResources()).to.equal(mockResources);
    });
  });
});