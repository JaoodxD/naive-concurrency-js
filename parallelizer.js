'use strict';
const { Worker } = require('node:worker_threads');

const DEFAULT_POOL_SIZE = 5;

const script = `'use strict';

const { parentPort } = require('node:worker_threads');
const func = () => 'hello, world';

parentPort.on('message', () => {
  const result = func();
  parentPort.postMessage(result);
});

`;

const createPool = (size) => {
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
      console.log('Recieved answer from thread#', worker.threadId);
      resolve(result);
    });
  });
};

const parallelize = (func, options = {}) => {
  const pool = options.pool || DEFAULT_POOL_SIZE;
  const workers = createPool(pool);
  let i = 0;
  return (args) => execute(workers[i++ % pool], args);
}


module.exports = { parallelize };
