# Naive worker pool implementation

## Description
Simple implementation of [`worker_threads`](https://nodejs.org/api/worker_threads.html) pool for single pure function.

## Usage
Main script has two command line optional parameters:  
1. `N` - pool size (default value: CPU_CORES - 1).
2. `print` - *true/false* to show execution statistics.

### Example 
`node main.js 6 false`

## Pre-built npm scripts list
- `start`
- `w2` - 2 workers
- `w5` - 5 workers
- `w6` - 6 workers
- `w11` - 11 workers
- `w18` - 18 workers
- `w11:stat` - 11 workers, additional stats to print
### Example
`npm run w11:stat`
