const { expect } = require('chai');
const ArrayUtil = require('../../utils/arrayUtil');

describe('ArrayUtil', () => {
  let arrayUtil;

  beforeEach(() => {
    arrayUtil = new ArrayUtil();
  });

  describe('shuffle()', () => {
    it('should return an array of the same length', () => {
      const input = [1, 2, 3, 4, 5];
      const result = arrayUtil.shuffle(input);
      expect(result).to.have.lengthOf(5);
    });

    it('should contain the same elements', () => {
      const input = [1, 2, 3, 4, 5];
      const result = arrayUtil.shuffle(input);
      expect(result).to.have.members(input);
    });

    it('should handle empty array', () => {
      const input = [];
      const result = arrayUtil.shuffle(input);
      expect(result).to.be.an('array').that.is.empty;
    });

    it('should handle single element array', () => {
      const input = [42];
      const result = arrayUtil.shuffle(input);
      expect(result).to.deep.equal([42]);
    });

    it('should handle array with duplicate elements', () => {
      const input = [1, 1, 2, 2, 3];
      const result = arrayUtil.shuffle(input);
      expect(result).to.have.lengthOf(5);
      expect(result).to.have.members(input);
    });

    it('should not modify the original array', () => {
      const input = [1, 2, 3, 4, 5];
      const original = [...input];
      arrayUtil.shuffle(input);
      expect(input).to.deep.equal(original);
    });
  });
});