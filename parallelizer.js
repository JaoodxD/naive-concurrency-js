'use strict';
const { Worker } = require('node:worker_threads');

const DEFAULT_POOL_SIZE = 5;

const createPool = (script, size) => {
  const pool = [];
  for (let i = 0; i < size; i++) {
    const worker = new Worker(script, {
      eval: true
    });
    pool.push(worker);
  }
  return pool;
};

/**
 * @param { Worker } worker
 */
const execute = (worker, args) => {
  return new Promise((resolve) => {
    worker.postMessage(args);
    worker.on('message', (result) => {
      console.log('Recieved answer from thread#', worker.threadId, result);
      resolve(result);
    });
  });
};

const parallelize = (func, options = {}) => {
  const pool = options.pool || DEFAULT_POOL_SIZE;

  if (typeof func !== 'function') {
    throw new Error('first argument must be type of function');
  }

  const script = `'use strict';

const { parentPort } = require('node:worker_threads');
const func = ${func};//() => 'hello, world';

parentPort.on('message', (args) => {
  const result = func.apply(null, args);
  parentPort.postMessage(result);
});
`;

  const workers = createPool(script, pool);
  let i = 0;
  return (...args) => execute(workers[i++ % pool], args);
}


module.exports = { parallelize };
