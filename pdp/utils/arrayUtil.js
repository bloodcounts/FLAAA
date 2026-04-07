class ArrayUtil {
  // Fisher-Yates shuffle
  shuffle(arr) {
    return arr
      .map((a) => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map((a) => a[1]);
  }
}

module.exports = ArrayUtil;
