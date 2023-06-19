'use strict';

const { parallelize, finalize } = require('./parallelizer.js');
const testcases = require('./testcases.js');

const { cpus } = require('node:os');

const [, , cores_text, printStat_text] = process.argv;
const cores = +cores_text;
const print = printStat_text === 'true';

const CPU_COUNT = cpus().length;

const heavyComputation = (m, n) => {
  let sum = 0;
  for (let i = m; i <= n; i++) sum += i ** 6;
  return sum;
};

// Sequential execution
/* console.time('sum of ranges');
const results = inputs.map((args) => heavyComputation(...args));
console.timeEnd('sum of ranges');
console.table(results);
 */

// Concurrent execution
(async () => {

  const poolSize = Number.isFinite(cores) ? cores : CPU_COUNT - 1;
  console.log({ poolSize });

  console.time('pool initialization');
  const func = parallelize(heavyComputation, {
    pool: poolSize,
    interval: 250
  });
  console.timeEnd('pool initialization');

  console.time('parallel sum of ranges');
  const promises = testcases.map((args) => func(...args));
  const results = await Promise.all(promises);
  console.timeEnd('parallel sum of ranges');

  if (print) {
    console.log('calculation results:');
    console.table(results);
  }
  finalize(print);
})();
