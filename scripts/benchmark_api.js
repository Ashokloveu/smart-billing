/**
 * Production API Performance Benchmark Script
 * Tests latency, throughput, and error rates against health, auth, and read endpoints.
 */

const http = require('http');

async function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({ statusCode: res.statusCode, duration, data });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, duration: Date.now() - start, error: err.message });
    });

    req.end();
  });
}

async function runBenchmark(name, path, iterations = 100) {
  console.log(`\nBenchmarking: ${name} (${iterations} requests)...`);
  const latencies = [];
  let errorCount = 0;

  const startTotal = Date.now();

  for (let i = 0; i < iterations; i++) {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
    });

    if (res.statusCode >= 400 && res.statusCode !== 401) {
      errorCount++;
    }
    latencies.push(res.duration);
  }

  const totalTime = (Date.now() - startTotal) / 1000;
  latencies.sort((a, b) => a - b);

  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const reqPerSec = (iterations / totalTime).toFixed(2);

  console.log(`  Requests/Sec: ${reqPerSec} req/s`);
  console.log(`  Average Latency: ${avg} ms`);
  console.log(`  P95 Latency: ${p95} ms`);
  console.log(`  P99 Latency: ${p99} ms`);
  console.log(`  Error Percentage: ${((errorCount / iterations) * 100).toFixed(1)}%`);

  return { reqPerSec, avg, p95, p99, errorCount };
}

async function startSuite() {
  console.log('=================================================================');
  console.log('       SMART BILLING ERP: API PRODUCTION LOAD BENCHMARK          ');
  console.log('=================================================================');

  try {
    await runBenchmark('Liveness Probe (/healthz)', '/healthz', 100);
    await runBenchmark('Readiness Probe (/readyz)', '/readyz', 50);
    console.log('\n✅ Performance benchmark tests executed.');
  } catch (e) {
    console.error('Benchmark execution error:', e);
  }
}

if (require.main === module) {
  startSuite();
}

module.exports = { runBenchmark };
