'use strict';

const heavyComputation = (m, n) => {
  let sum = 0;
  for (let i = m; i <= n; i++) sum += i ** 6;
  return sum;
};

const inputs = [
  [1, 100_000],
  [200_000, 500_000],
  [1_000_000, 10_000_000],
  [2_000_000, 20_000_000],
  [3_000_000, 30_000_000],
  [4_000_000, 40_000_000],
];

console.time('sum of ranges');
const results = inputs.map((args) => heavyComputation(...args));
console.timeEnd('sum of ranges');
console.table(results);
