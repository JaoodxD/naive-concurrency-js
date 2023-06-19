'use strict';
const { Worker } = require('node:worker_threads');


const DEFAULT_POOL_SIZE = 5;

const balancer = {
  id: 1,
  pool: [],
  busy: new Map, // <Worker, true || false>
  workerForTask: new Map, // <taskId, Worker>
  tasks: new Map, // <taskId, { taskId, resolve, reject, args, queueStart, queueFinish, execStart, execFinish }>

  queue: [],
};

const createPool = (script, size) => {
  for (let i = 0; i < size; i++) {
    const worker = new Worker(script, {
      eval: true
    });
    balancer.pool.push(worker);
    balancer.busy.set(worker, false);
    worker.on('message', workerResult);
  }
};

const buildWorkerScriptWithFunction = (func) => {
  if (typeof func !== 'function') {
    throw new Error('first argument must be type of function');
  }

  const script = `'use strict';

const { parentPort } = require('node:worker_threads');
const func = ${func};//() => 'hello, world';

parentPort.on('message', ({ taskId, args }) => {
  try {
    const result = func.apply(null, args);
    parentPort.postMessage({ taskId, result }); 
  }
  catch({ message: error }){
    parentPort.postMessage({ taskId, error });
  }
});
`;
  return script;
};

const dispatchNewTask = (worker) => {
  const task = balancer.queue.shift();
  if (!task) return;

  const time = performance.now();
  task.queueFinish = time;
  task.execStart = time;
  const { taskId, args } = task;
  balancer.busy.set(worker, true);
  balancer.workerForTask.set(taskId, worker);
  balancer.tasks.set(taskId, task);
  // console.log('sending...$', taskId, 'to #', worker.threadId);
  worker.postMessage({ taskId, args });
};

const workerResult = ({ taskId, result, error }) => {
  const time = performance.now();
  
  const task = balancer.tasks.get(taskId);
  task.execFinish = time;
  const { queueStart, queueFinish, execStart, execFinish } = task;
  const worker = balancer.workerForTask.get(taskId);

  balancer.busy.set(worker, false);
  balancer.workerForTask.delete(taskId);
  balancer.tasks.delete(taskId);
  // console.log('recieving $', taskId, ' from #', worker.threadId);
  console.log(
    'Finished task#', taskId,
    '\nqueue time:', ~~(queueFinish - queueStart),
    '\nexec time:', ~~(execFinish - execStart),
    '\nworker:', worker.threadId,
    '\n~~~~~~~~~~~~~~~~~~~'
  );
  if (error) task.reject(error);
  else task.resolve(result);
  dispatchNewTask(worker);
};

const invoke = (...args) => {
  const taskId = balancer.id++;
  let freeWorker;
  for (const worker of balancer.pool) {
    if (!balancer.busy.get(worker)) {
      freeWorker = worker;
      break;
    }
  }
  return new Promise((resolve, reject) => {
    const time = performance.now();
    const task = {
      taskId,
      resolve, reject,
      args,
      queueStart: 0, queueFinish: 0,
      execStart: -Infinity, execFinish: -Infinity
    };
    if (!freeWorker) {
      task.queueStart = time;
      balancer.queue.push(task);
      return;
    }
    balancer.busy.set(freeWorker, true);
    balancer.workerForTask.set(taskId, freeWorker);
    balancer.tasks.set(taskId, task);
    // console.log('sending...$', taskId, 'to #', freeWorker.threadId);
    task.queueFinish;
    task.execStart = time;
    freeWorker.postMessage({ taskId, args });
  });
};

const parallelize = (func, options = {}) => {
  const pool = options.pool || DEFAULT_POOL_SIZE;
  const script = buildWorkerScriptWithFunction(func);
  createPool(script, pool);
  return invoke;
}

module.exports = { parallelize };
