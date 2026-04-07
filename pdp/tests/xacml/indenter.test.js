const { expect } = require('chai');

describe('Indenter', () => {
  let Indenter;
  let indenter;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/indenter')];
    Indenter = require('../../xacml/indenter');
    indenter = new Indenter();
  });

  describe('indenterInit()', () => {
    it('should initialize with default width of 2', () => {
      indenter.indenterInit();

      // Test that depth starts at 0
      expect(indenter.makeString()).to.equal('');
    });

    it('should reset depth to 0 when initialized', () => {
      indenter.indenterInit2(4);
      indenter.in();
      indenter.in();

      indenter.indenterInit();

      expect(indenter.makeString()).to.equal('');
    });
  });

  describe('indenterInit2()', () => {
    it('should initialize with custom width', () => {
      indenter.indenterInit2(4);

      indenter.in();
      expect(indenter.makeString()).to.equal('    '); // 4 spaces
    });

    it('should reset depth to 0 when initialized with custom width', () => {
      indenter.indenterInit2(2);
      indenter.in();
      indenter.in();

      indenter.indenterInit2(3);

      expect(indenter.makeString()).to.equal('');
    });
  });

  describe('makeString()', () => {
    it('should return empty string when depth is 0', () => {
      indenter.indenterInit2(2);

      expect(indenter.makeString()).to.equal('');
    });

    it('should return empty string when depth is negative', () => {
      indenter.indenterInit2(2);
      indenter.out();

      expect(indenter.makeString()).to.equal('');
    });

    it('should return correct indentation for depth 1', () => {
      indenter.indenterInit2(2);
      indenter.in();

      expect(indenter.makeString()).to.equal('  '); // 2 spaces
    });

    it('should return correct indentation for depth 2', () => {
      indenter.indenterInit2(3);
      indenter.in();
      indenter.in();

      expect(indenter.makeString()).to.equal('      '); // 6 spaces (3 * 2)
    });

    it('should return correct indentation for custom width', () => {
      indenter.indenterInit2(4);
      indenter.in();

      expect(indenter.makeString()).to.equal('    '); // 4 spaces
    });
  });

  describe('in()', () => {
    it('should increase depth by width amount', () => {
      indenter.indenterInit2(3);
      indenter.in();

      expect(indenter.makeString()).to.equal('   '); // 3 spaces
    });

    it('should accumulate depth with multiple in() calls', () => {
      indenter.indenterInit2(2);
      indenter.in();
      indenter.in();
      indenter.in();

      expect(indenter.makeString()).to.equal('      '); // 6 spaces (2 * 3)
    });
  });

  describe('out()', () => {
    it('should decrease depth by width amount', () => {
      indenter.indenterInit2(3);
      indenter.in();
      indenter.in();
      indenter.out();

      expect(indenter.makeString()).to.equal('   '); // 3 spaces
    });

    it('should allow depth to go negative', () => {
      indenter.indenterInit2(2);
      indenter.out();

      expect(indenter.makeString()).to.equal('');
    });

    it('should handle multiple out() calls', () => {
      indenter.indenterInit2(4);
      indenter.in();
      indenter.in();
      indenter.out();
      indenter.out();
      indenter.out();

      expect(indenter.makeString()).to.equal('');
    });
  });

  describe('integration tests', () => {
    it('should handle complex indentation patterns', () => {
      indenter.indenterInit2(2);

      expect(indenter.makeString()).to.equal('');

      indenter.in();
      expect(indenter.makeString()).to.equal('  ');

      indenter.in();
      expect(indenter.makeString()).to.equal('    ');

      indenter.out();
      expect(indenter.makeString()).to.equal('  ');

      indenter.in();
      expect(indenter.makeString()).to.equal('    ');

      indenter.out();
      indenter.out();
      expect(indenter.makeString()).to.equal('');
    });

    it('should work with different widths', () => {
      // Test with width 1
      indenter.indenterInit2(1);
      indenter.in();
      indenter.in();
      expect(indenter.makeString()).to.equal('  ');

      // Test with width 4
      indenter.indenterInit2(4);
      indenter.in();
      expect(indenter.makeString()).to.equal('    ');

      indenter.in();
      expect(indenter.makeString()).to.equal('        '); // 8 spaces
    });

    it('should maintain state correctly across operations', () => {
      indenter.indenterInit2(3);

      indenter.in(); // depth = 3
      expect(indenter.makeString()).to.equal('   ');

      indenter.in(); // depth = 6
      expect(indenter.makeString()).to.equal('      ');

      indenter.out(); // depth = 3
      expect(indenter.makeString()).to.equal('   ');

      indenter.in(); // depth = 6
      expect(indenter.makeString()).to.equal('      ');
    });
  });
});