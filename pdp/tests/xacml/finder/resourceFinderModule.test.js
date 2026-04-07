const { expect } = require('chai');

describe('ResourceFinderModule', () => {
  let ResourceFinderModule;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../../xacml/finder/resourceFinderModule')];
    ResourceFinderModule = require('../../../xacml/finder/resourceFinderModule');
  });

  describe('constructor', () => {
    it('should create a ResourceFinderModule instance', () => {
      const module = new ResourceFinderModule();
      expect(module).to.be.an.instanceof(ResourceFinderModule);
    });
  });

  describe('findChildResources()', () => {
    it('should return a ResourceFinderResult instance', () => {
      const module = new ResourceFinderModule();
      const mockContext = {};

      const result = module.findChildResources('parent-resource-id', mockContext);

      expect(result).to.be.an.instanceof(require('../../../xacml/finder/resourceFinderResult'));
      expect(result.isEmpty()).to.be.true;
    });
  });

  describe('findDescendantResources()', () => {
    it('should return a ResourceFinderResult instance', () => {
      const module = new ResourceFinderModule();
      const mockContext = {};

      const result = module.findDescendantResources('parent-resource-id', mockContext);

      expect(result).to.be.an.instanceof(require('../../../xacml/finder/resourceFinderResult'));
      expect(result.isEmpty()).to.be.true;
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      const module = new ResourceFinderModule();

      expect(module.findChildResources).to.be.a('function');
      expect(module.findDescendantResources).to.be.a('function');
    });

    it('should work with different parent resource IDs and contexts', () => {
      const module = new ResourceFinderModule();
      const context1 = { user: 'test-user' };
      const context2 = { user: 'another-user' };

      const result1 = module.findChildResources('resource-1', context1);
      const result2 = module.findDescendantResources('resource-2', context2);

      expect(result1).to.be.an.instanceof(require('../../../xacml/finder/resourceFinderResult'));
      expect(result2).to.be.an.instanceof(require('../../../xacml/finder/resourceFinderResult'));
      expect(result1.isEmpty()).to.be.true;
      expect(result2.isEmpty()).to.be.true;
    });
  });
});