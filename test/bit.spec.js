"use strict";
const assert = require("power-assert");
import BIT from '../src/bit';

const maxArraySize = 8;

describe('sequencial test', function () {
    describe(`with size = 0`, basicTest.bind(null, createSequencial(0)));

    for(let size = 1, i = 0, l = maxArraySize; i < l; ++i, size*=2) {
        describe(`with size = ${size}`, basicTest.bind(null, createSequencial(size)));
    };

});

describe('random test', function () {

    for(let size = 1, i = 0, l = maxArraySize; i < l; ++i, size*=2) {
        describe(`with size = ${size}`, basicTest.bind(null, createRandom(size)));
    };

});

function lowerBoundExpected(cusum, func) {
    let i = cusum.findIndex(func);
    if(!func(cusum[cusum.length-1])) return cusum.length;
    return i;
}

function createSequencial(size) {
    const ret = Array(size);
    for(let i = 0; i < size; ++i) ret[i] = i;
    return ret;
}

function createRandom(size) {
    const ret = Array(size);
    for(let i = 0; i < size; ++i) ret[i] = (Math.random() * size) | 0;
    return ret;
}

function basicTest(seed) {
    let bit, cusum, size = seed.length;
    beforeEach(function () {
        bit = new BIT(size);
        for(let i = 0, l = size; i < l; ++i) {
            bit.add(i, seed[i]);
        }
        cusum = seed.reduce((acc, x, i) => (acc.push(i ? x + acc[i - 1] : x), acc), []);
    });

    it('works', function () {
        for(let i = 0, l = size; i < l; ++i) {
            assert(bit.get(i) === cusum[i]);
        }
    });

    it('#original - original values', function () {
        for(let i = 0, l = size; i < l; ++i) {
            assert(bit.original(i) === seed[i]);
        }
    });

    it('build', function () {
        const seq = Array(size).fill(0).map((x, i) => i);
        const built = BIT.build(seq);

        for(let i = 0, l = size; i < l; ++i) {
            assert(bit.get(i) === cusum[i]);
        }
    });

    it('access out of range returns undefined', function () {
        assert(bit.get(size) === undefined);
        assert(bit.get(-1) === undefined);
    });

    xdescribe('#find', function () {
        it('works', function () {
            const target = (size / 2) | 0;
            const message = 'target: ' + target;
            const fn = x => x > target;

            assert(cusum.find(fn) === bit.find(fn), message);
        });
    });

    xdescribe('#findIndex', function () {
        it('works', function () {
            const target = (size / 2) | 0;
            const fn = x => x > target;

            assert(cusum.findIndex(fn) === bit.findIndex(fn), 'target: ' + target);
        });
    });

    describe('#lowerBound, #upperBound', function () {

        describe('each item', function () {
            for(let i = 0, l = size; i < l; ++i) {
                it('works', function () {
                    const target = cusum[i];
                    const message = 'target: ' + target;
                    const lb = bit.lowerBound(target);
                    const ub = bit.upperBound(target);

                    const expected_lb = lowerBoundExpected(cusum, x => target <= x);
                    const expected_ub = lowerBoundExpected(cusum, x => target < x);

                    assert(expected_lb === lb, message);
                    assert(expected_ub === ub, message);
                });
            };
        });


        it('too small target', function () {
            const target = -1;
            const message = 'target: ' + target;
            const lb = bit.lowerBound(target);
            const ub = bit.upperBound(target);
            assert(lb === 0, message);
            assert(ub === 0, message);

            const expected_lb = lowerBoundExpected(cusum, x => target <= x);
            const expected_ub = lowerBoundExpected(cusum, x => target < x);

            assert(expected_lb === lb, message);
            assert(expected_ub === ub, message);
        });

        it('too large target', function () {
            const target = bit.sum() + 1;
            const lb = bit.lowerBound(target);
            const ub = bit.upperBound(target);

            assert(lb === size);
            assert(ub === size);
        });

        if (2 < size) {
            it('custom comperator', function () {
                const comp = (a, b) => a <= b;

                const target = (size / 2) | 0;

                const lb = bit.lowerBound(target);
                const ub = bit.upperBound(target);
                const lb_ = bit.lowerBound(target, comp);
                const ub_ = bit.upperBound(target, comp);

                assert(ub === lb_);
                assert(lb === ub_);
            });
        }
    });

    it('#toArray', () => {
        const arr = bit.toArray();
        assert.deepEqual(arr, cusum);
    });
}
