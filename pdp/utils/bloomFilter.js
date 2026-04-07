/* eslint-disable no-bitwise, camelcase, no-param-reassign */

const typedArrays = typeof ArrayBuffer !== 'undefined';

function popcnt(v) {
  v -= (v >> 1) & 0x55555555;
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
  return ((v + (v >> 4) & 0xf0f0f0f) * 0x1010101) >> 24;
}

function fnv_multiply(a) {
  return a + (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
}

function fnv_mix(a) {
  a += a << 13;
  a ^= a >>> 7;
  a += a << 3;
  a ^= a >>> 17;
  a += a << 5;
  return a & 0xffffffff;
}

function fnv_1a(v, seed) {
  let a = 2166136261 ^ (seed || 0);
  for (let i = 0, n = v.length; i < n; i += 1) {
    const c = v.charCodeAt(i);
    const d = c & 0xff00;
    if (d) a = fnv_multiply(a ^ d >> 8);
    a = fnv_multiply(a ^ c & 0xff);
  }
  return fnv_mix(a);
}

class BloomFilter {
  constructor(sizeOrArray, k) {
    let a;
    let m = sizeOrArray;
    if (typeof sizeOrArray !== 'number') {
      a = sizeOrArray;
      m = a.length * 32;
    }

    const n = Math.ceil(m / 32);
    let i = -1;
    const actualSize = n * 32;
    this.m = actualSize;
    this.k = k;

    if (typedArrays) {
      const kbytes = 1 << Math.ceil(
        Math.log(Math.ceil(Math.log(actualSize) / Math.LN2 / 8)) / Math.LN2,
      );
      let ArrayType;
      if (kbytes === 1) {
        ArrayType = Uint8Array;
      } else if (kbytes === 2) {
        ArrayType = Uint16Array;
      } else {
        ArrayType = Uint32Array;
      }
      const kbuffer = new ArrayBuffer(kbytes * k);
      this.buckets = new Int32Array(n);
      if (a) {
        while (i < n - 1) {
          i += 1;
          this.buckets[i] = a[i];
        }
      }
      this.locationsArray = new ArrayType(kbuffer);
    } else {
      this.buckets = [];
      if (a) {
        while (i < n - 1) {
          i += 1;
          this.buckets[i] = a[i];
        }
      } else {
        while (i < n - 1) {
          i += 1;
          this.buckets[i] = 0;
        }
      }
      this.locationsArray = [];
    }
  }

  locations(v) {
    const { k } = this;
    const { m } = this;
    const r = this.locationsArray;
    const a = fnv_1a(v);
    const b = fnv_1a(v, 1576284489); // The seed value is chosen randomly
    let x = a % m;
    for (let i = 0; i < k; i += 1) {
      r[i] = x < 0 ? (x + m) : x;
      x = (x + b) % m;
    }
    return r;
  }

  add(v) {
    const l = this.locations(`${v}`);
    const { k } = this;
    const { buckets } = this;
    for (let i = 0; i < k; i += 1) {
      buckets[Math.floor(l[i] / 32)] |= 1 << (l[i] % 32);
    }
  }

  test(v) {
    const l = this.locations(`${v}`);
    const { k } = this;
    const { buckets } = this;
    for (let i = 0; i < k; i += 1) {
      const b = l[i];
      if ((buckets[Math.floor(b / 32)] & (1 << (b % 32))) === 0) {
        return false;
      }
    }
    return true;
  }

  size() {
    const { buckets } = this;
    let bits = 0;
    for (let i = 0, n = buckets.length; i < n; i += 1) {
      bits += popcnt(buckets[i]);
    }
    return (-this.m * Math.log(1 - bits / this.m)) / this.k;
  }
}

module.exports = BloomFilter;
