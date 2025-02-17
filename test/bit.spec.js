import { describe, it, assert, beforeEach } from 'vitest'
import BIT from '../src/bit'

const maxSize = 2
const randomSeed = [75938205, 57102950, 91702362]

describe("sequencial test", function() {
  it(`with size = 0`, basicTest(zeroTo(0)))

  for (let size = 1, i = 0, l = maxSize; i < l; ++i, size *= 2) {
    it(`with size = ${size}`,
      basicTest(zeroTo(size))
    )
  }
});

describe("random test", function() {
  for (let seed of randomSeed) {
    for (let size = 1, i = 0, l = maxSize; i < l; ++i, size *= 2) {
      it(`with size = ${size}`,
        basicTest(randomInts(size, seed))
      )
    }
  }
});

function lowerBoundExpected(cusum, func) {
  let i = cusum.findIndex(func);
  if (!func(cusum[cusum.length - 1]))
    return cusum.length;
  return i;
}

function zeroTo(size) {
  return Array.from({length: size}, (_, i) => i)
}

function randomInts(size, maxValue) {
  return Array.from({length: size}, () => Math.floor(Math.random() * maxValue))
}

function basicTest(ints) {
  let bit,
    cusum,
    size = ints.length;
  beforeEach(function() {
    bit = new BIT(size);
    for (let i = 0, l = size; i < l; ++i) {
      bit.add(i, ints[i]);
    }
    cusum = ints.reduce(
      (acc, x, i) => (acc.push(i ? x + acc[i - 1] : x), acc),
      []
    );
  });

  it("works", function() {
    for (let i = 0, l = size; i < l; ++i) {
      assert(bit.get(i) === cusum[i]);
    }
  });

  it("#original - original values", function() {
    for (let i = 0, l = size; i < l; ++i) {
      assert(bit.original(i) === ints[i]);
    }
  });

  it("build", function() {
    const seq = Array(size)
      .fill(0)
      .map((x, i) => i);
    const built = BIT.build(seq);

    for (let i = 0, l = size; i < l; ++i) {
      assert(bit.get(i) === cusum[i]);
    }
  });

  it("access out of range returns undefined", function() {
    assert(bit.get(size) === undefined);
    assert(bit.get(-1) === undefined);
  });

  describe("#find", function() {
    it(`works with each item`, function() {
      for (let i = 0, l = size; i < l; ++i) {
        const target = cusum[i];
        const message = `target: ${target}`;
        const fn = x => x > target;

        assert(cusum.find(fn) === bit.find(fn), message);
      }
    });
  })

  describe("#findIndex", function() {
    it(`works with each item`, function() {
      for (let i = 0, l = size; i < l; ++i) {
        const target = cusum[i];
        const message = `target: ${target}`;
        const fn = x => x > target;

        assert(cusum.findIndex(fn) === bit.findIndex(fn), message);
      }
    });
  });

  describe("#indexOf", function() {
    it(`works with each item`, function() {
      for (let i = 0, l = size; i < l; ++i) {
        const target = cusum[i];
        const message = `target: ${target}`;

        assert(cusum.indexOf(target) === bit.indexOf(target), message);
      }
    });
  });

  describe("#lastIndexOf", function() {
    it(`works with each item`, function() {
      for (let i = 0, l = size; i < l; ++i) {
        const target = cusum[i];
        const message = `target: ${target}`;

        assert(cusum.lastIndexOf(target) === bit.lastIndexOf(target), message);
      }
    });
  });

  describe("#lowerBound, #upperBound", function() {
    describe("each item", function() {
      it("works", function() {
        for (let i = 0, l = size; i < l; ++i) {
          const target = cusum[i];
          const message = "target: " + target;
          const lb = bit.lowerBound(target);
          const ub = bit.upperBound(target);

          const expected_lb = lowerBoundExpected(cusum, x => target <= x);
          const expected_ub = lowerBoundExpected(cusum, x => target < x);

          assert(expected_lb === lb, message);
          assert(expected_ub === ub, message);
        }
      });
    });

    it("too small target", function() {
      const target = -1;
      const message = "target: " + target;
      const lb = bit.lowerBound(target);
      const ub = bit.upperBound(target);
      assert(lb === 0, message);
      assert(ub === 0, message);

      const expected_lb = lowerBoundExpected(cusum, x => target <= x);
      const expected_ub = lowerBoundExpected(cusum, x => target < x);

      assert(expected_lb === lb, message);
      assert(expected_ub === ub, message);
    });

    it("too large target", function() {
      const target = bit.sum() + 1;
      const lb = bit.lowerBound(target);
      const ub = bit.upperBound(target);

      assert(lb === size);
      assert(ub === size);
    });

    it("custom comperator", function() {
      if (2 < size) {
        const comp = (a, b) => a <= b;
        const target = (size / 2) | 0;

        const lb = bit.lowerBound(target);
        const ub = bit.upperBound(target);
        const lb_ = bit.lowerBound(target, comp);
        const ub_ = bit.upperBound(target, comp);

        assert(ub === lb_);
        assert(lb === ub_);
      }
    });
  });

  it("#toArray", () => {
    const arr = bit.toArray();
    assert.deepEqual(arr, cusum);
  });
}
