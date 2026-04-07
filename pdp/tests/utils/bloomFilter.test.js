const { expect } = require('chai');
const BloomFilter = require('../../utils/bloomFilter');

describe('BloomFilter', () => {
  describe('constructor', () => {
    it('should create a BloomFilter with specified size and hash functions', () => {
      const filter = new BloomFilter(1000, 4);
      expect(filter).to.be.an('object');
      expect(filter.m).to.equal(1024); // Size gets rounded up to next power of 2 * 32
      expect(filter.k).to.equal(4);
    });

    it('should create a BloomFilter from an existing array', () => {
      const existing = [1, 2, 3, 4];
      const filter = new BloomFilter(existing, 4);
      expect(filter).to.be.an('object');
      expect(filter.buckets).to.be.an.instanceof(Int32Array);
      expect(filter.buckets.length).to.equal(existing.length);
    });
  });

  describe('add() and test()', () => {
    let filter;

    beforeEach(() => {
      filter = new BloomFilter(1000, 4);
    });

    it('should add and test strings', () => {
      filter.add('test');
      expect(filter.test('test')).to.be.true;
      expect(filter.test('not_added')).to.be.false;
    });

    it('should add and test numbers (converted to strings)', () => {
      filter.add(42);
      expect(filter.test(42)).to.be.true;
      expect(filter.test(43)).to.be.false;
    });

    it('should handle false positives (bloom filter property)', () => {
      // Add some items
      filter.add('apple');
      filter.add('banana');
      filter.add('cherry');

      // Test existing items
      expect(filter.test('apple')).to.be.true;
      expect(filter.test('banana')).to.be.true;
      expect(filter.test('cherry')).to.be.true;

      // Test non-existing items - some might return true due to false positives
      // We can't test for false here as it's expected behavior
      expect(filter.test('grape')).to.be.a('boolean');
    });

    it('should handle empty strings', () => {
      filter.add('');
      expect(filter.test('')).to.be.true;
    });
  });

  describe('size()', () => {
    it('should return 0 for empty filter', () => {
      const filter = new BloomFilter(1000, 4);
      expect(filter.size()).to.equal(0);
    });

    it('should estimate size after adding items', () => {
      const filter = new BloomFilter(1000, 4);
      filter.add('item1');
      filter.add('item2');
      filter.add('item3');

      const estimatedSize = filter.size();
      expect(estimatedSize).to.be.above(0);
      expect(estimatedSize).to.be.below(10); // Rough estimate
    });
  });

  describe('locations()', () => {
    it('should return an array-like object of hash locations', () => {
      const filter = new BloomFilter(1000, 4);
      const locations = filter.locations('test');
      expect(locations).to.have.lengthOf(4);
      locations.forEach(location => {
        expect(location).to.be.a('number');
        expect(location).to.be.at.least(0);
        expect(location).to.be.below(filter.m);
      });
    });

    it('should return consistent locations for same input', () => {
      const filter = new BloomFilter(1000, 4);
      const locations1 = filter.locations('test');
      const locations2 = filter.locations('test');
      expect(locations1).to.deep.equal(locations2);
    });
  });
});