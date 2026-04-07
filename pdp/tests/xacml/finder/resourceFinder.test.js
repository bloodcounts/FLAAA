const { expect } = require('chai');
const sinon = require('sinon');

describe('ResourceFinder', () => {
  let ResourceFinder;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../../xacml/finder/resourceFinder')];
    ResourceFinder = require('../../../xacml/finder/resourceFinder');
  });

  describe('constructor', () => {
    it('should create a ResourceFinder instance', () => {
      const finder = new ResourceFinder();
      expect(finder).to.be.an.instanceof(ResourceFinder);
      expect(finder.childModules).to.be.an('array').that.is.empty;
      expect(finder.descendantModules).to.be.an('array').that.is.empty;
    });
  });

  describe('setModules()', () => {
    it('should set modules and categorize them correctly', () => {
      const finder = new ResourceFinder();

      const mockChildModule = {
        isChildSupported: () => true,
        isDescendantSupported: () => false
      };

      const mockDescendantModule = {
        isChildSupported: () => false,
        isDescendantSupported: () => true
      };

      const mockBothModule = {
        isChildSupported: () => true,
        isDescendantSupported: () => true
      };

      const modules = [mockChildModule, mockDescendantModule, mockBothModule];

      finder.setModules(modules);

      expect(finder.allModules).to.equal(modules);
      expect(finder.childModules).to.have.lengthOf(2);
      expect(finder.descendantModules).to.have.lengthOf(2);
    });

    it('should handle empty modules array', () => {
      const finder = new ResourceFinder();
      finder.setModules([]);

      expect(finder.allModules).to.be.an('array').that.is.empty;
      expect(finder.childModules).to.be.an('array').that.is.empty;
      expect(finder.descendantModules).to.be.an('array').that.is.empty;
    });
  });

  describe('findChildResources()', () => {
    let finder;
    let mockContext;

    beforeEach(() => {
      finder = new ResourceFinder();
      mockContext = {};
    });

    it('should return result from first module that finds child resources', () => {
      const mockResult = { found: true };
      const mockModule1 = {
        findChildResources: sinon.stub().returns(null)
      };
      const mockModule2 = {
        findChildResources: sinon.stub().returns(mockResult)
      };

      finder.childModules = [mockModule1, mockModule2];

      const result = finder.findChildResources('parent-resource-id', mockContext);

      expect(result).to.equal(mockResult);
      expect(mockModule1.findChildResources.calledOnceWith('parent-resource-id', mockContext)).to.be.true;
      expect(mockModule2.findChildResources.calledOnceWith('parent-resource-id', mockContext)).to.be.true;
    });

    it('should return default result when no modules find child resources', () => {
      const mockModule1 = {
        findChildResources: sinon.stub().returns(null)
      };
      const mockModule2 = {
        findChildResources: sinon.stub().returns(null)
      };

      finder.childModules = [mockModule1, mockModule2];

      const result = finder.findChildResources('parent-resource-id', mockContext);

      expect(result).to.be.an.instanceof(require('../../../xacml/finder/resourceFinderResult'));
      expect(result.isEmpty()).to.be.true;
    });

    it('should handle empty child modules array', () => {
      finder.childModules = [];

      const result = finder.findChildResources('parent-resource-id', mockContext);

      expect(result).to.be.an.instanceof(require('../../../xacml/finder/resourceFinderResult'));
      expect(result.isEmpty()).to.be.true;
    });
  });

  describe('findDescendantResources()', () => {
    let finder;
    let mockContext;

    beforeEach(() => {
      finder = new ResourceFinder();
      mockContext = {};
    });

    it('should return result from first module that finds descendant resources', () => {
      const mockResult = { found: true };
      const mockModule1 = {
        findDescendantResources: sinon.stub().returns(null)
      };
      const mockModule2 = {
        findDescendantResources: sinon.stub().returns(mockResult)
      };

      finder.descendantModules = [mockModule1, mockModule2];

      const result = finder.findDescendantResources('parent-resource-id', mockContext);

      expect(result).to.equal(mockResult);
      expect(mockModule1.findDescendantResources.calledOnceWith('parent-resource-id', mockContext)).to.be.true;
      expect(mockModule2.findDescendantResources.calledOnceWith('parent-resource-id', mockContext)).to.be.true;
    });

    it('should return default result when no modules find descendant resources', () => {
      const mockModule1 = {
        findDescendantResources: sinon.stub().returns(null)
      };
      const mockModule2 = {
        findDescendantResources: sinon.stub().returns(null)
      };

      finder.descendantModules = [mockModule1, mockModule2];

      const result = finder.findDescendantResources('parent-resource-id', mockContext);

      expect(result).to.be.an.instanceof(require('../../../xacml/finder/resourceFinderResult'));
      expect(result.isEmpty()).to.be.true;
    });

    it('should handle empty descendant modules array', () => {
      finder.descendantModules = [];

      const result = finder.findDescendantResources('parent-resource-id', mockContext);

      expect(result).to.be.an.instanceof(require('../../../xacml/finder/resourceFinderResult'));
      expect(result.isEmpty()).to.be.true;
    });
  });
});