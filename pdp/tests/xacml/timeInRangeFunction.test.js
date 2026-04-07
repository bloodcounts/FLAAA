const { expect } = require('chai');
const sinon = require('sinon');

describe('TimeInRangeFunction', () => {
  let TimeInRangeFunction;
  let timeInRangeFunction;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/timeInRangeFunction')];
    TimeInRangeFunction = require('../../xacml/timeInRangeFunction');
    timeInRangeFunction = new TimeInRangeFunction();
  });

  describe('constructor', () => {
    it('should create a TimeInRangeFunction instance', () => {
      expect(timeInRangeFunction).to.be.an.instanceOf(TimeInRangeFunction);
    });
  });

  describe('timeInRangeFunctionInit()', () => {
    it('should initialize the function with correct parameters', () => {
      timeInRangeFunction.timeInRangeFunctionInit();

      // Check that it inherits from FunctionBase
      expect(timeInRangeFunction.superConstructor).to.be.a('function');
    });

    it('should call superConstructor with correct arguments', () => {
      const superConstructorSpy = sinon.spy(timeInRangeFunction, 'superConstructor');

      timeInRangeFunction.timeInRangeFunctionInit();

      expect(superConstructorSpy.calledOnce).to.be.true;
      expect(superConstructorSpy.firstCall.args[0]).to.equal('http://research.sun.com/projects/xacml/names/function#time-in-range');
      expect(superConstructorSpy.firstCall.args[1]).to.equal(0);
      expect(superConstructorSpy.firstCall.args[2]).to.be.a('string'); // TimeAttribute identifier
      expect(superConstructorSpy.firstCall.args[3]).to.equal(false);
      expect(superConstructorSpy.firstCall.args[4]).to.equal(3);
      expect(superConstructorSpy.firstCall.args[5]).to.be.a('string'); // BooleanAttribute identifier
      expect(superConstructorSpy.firstCall.args[6]).to.equal(false);

      superConstructorSpy.restore();
    });
  });

  describe('inheritance', () => {
    it('should inherit from FunctionBase', () => {
      expect(timeInRangeFunction).to.have.property('superConstructor');
      expect(timeInRangeFunction.superConstructor).to.be.a('function');
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      expect(timeInRangeFunction).to.have.property('timeInRangeFunctionInit');
      expect(timeInRangeFunction.timeInRangeFunctionInit).to.be.a('function');
    });

    it('should be properly initialized after calling timeInRangeFunctionInit', () => {
      timeInRangeFunction.timeInRangeFunctionInit();
      // The function should be initialized without throwing errors
      expect(() => timeInRangeFunction.timeInRangeFunctionInit()).to.not.throw();
    });
  });
});