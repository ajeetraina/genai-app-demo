// File: src/api/gpuMetricsService.js

/**
 * Service for gathering GPU metrics from Docker Model Runner
 * 
 * This can be added to a separate branch as it's an enhancement to the main application
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Cache for metrics to avoid excessive polling
let metricsCache = {
  timestamp: 0,
  data: null
};

// Cache TTL in milliseconds (500ms)
const CACHE_TTL = 500;

/**
 * Get GPU metrics for Apple Silicon (Metal API)
 */
async function getAppleSiliconMetrics() {
  try {
    // Using powermetrics to get GPU stats (requires admin privileges)
    const { stdout } = await execPromise('sudo powermetrics --samplers gpu_power -n 1 -i 500 -o stdout');
    
    // Parse the powermetrics output
    const gpuUtilization = parseFloat(stdout.match(/GPU active residency: ([0-9.]+)%/)?.[1] || 0);
    
    // Get the Model Runner process stats
    const { stdout: llamaStats } = await execPromise('ps -eo pid,pmem,pcpu,command | grep llama.cpp | grep -v grep');
    const statsMatch = llamaStats.match(/\d+\s+([0-9.]+)\s+([0-9.]+)/);
    
    const memoryUsage = statsMatch ? parseFloat(statsMatch[1]) : 0;
    const cpuUsage = statsMatch ? parseFloat(statsMatch[2]) : 0;
    
    // Check if an inference is currently running
    const { stdout: portCheck } = await execPromise('lsof -i :12434 -sTCP:ESTABLISHED');
    const inferenceActive = portCheck.includes('ESTABLISHED');
    
    // Get token generation speed from logs (this is approximate)
    let tokensPerSecond = 0;
    if (inferenceActive) {
      try {
        const { stdout: logTail } = await execPromise('tail -n 20 ~/.docker/model-runner/logs/llama.log');
        const perfMatch = logTail.match(/([0-9.]+) tokens\/sec/);
        if (perfMatch) {
          tokensPerSecond = parseFloat(perfMatch[1]);
        }
      } catch (err) {
        // Ignore log parsing errors
      }
    }
    
    return {
      gpuUtilization,
      gpuMemoryUsage: memoryUsage,  // Using process memory as proxy for GPU memory
      cpuUsage,
      tokensPerSecond,
      inferenceActive,
      latency: inferenceActive ? 1000 / tokensPerSecond : 0,
      temperature: 0  // Metal API doesn't easily expose GPU temperature
    };
  } catch (error) {
    console.error('Error getting Apple Silicon GPU metrics:', error);
    return getFallbackMetrics();
  }
}

/**
 * Get GPU metrics for NVIDIA GPUs (for Windows support)
 */
async function getNvidiaMetrics() {
  try {
    // Get GPU stats from nvidia-smi
    const { stdout } = await execPromise('nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits');
    const [gpuUtil, memoryUsed, memoryTotal, temperature] = stdout.trim().split(',').map(v => parseFloat(v.trim()));
    
    // Calculate memory usage percentage
    const gpuMemoryUsage = (memoryUsed / memoryTotal) * 100;
    
    // Check if an inference is currently running
    const { stdout: portCheck } = await execPromise('netstat -an | findstr 12434 | findstr ESTABLISHED');
    const inferenceActive = portCheck.includes('ESTABLISHED');
    
    // Approximate tokens per second based on GPU util
    // This is a very rough approximation - would need model-specific benchmarks for accuracy
    const tokensPerSecond = inferenceActive ? (gpuUtil / 10) : 0;
    
    return {
      gpuUtilization: gpuUtil,
      gpuMemoryUsage,
      tokensPerSecond,
      inferenceActive,
      latency: inferenceActive ? 1000 / tokensPerSecond : 0,
      temperature
    };
  } catch (error) {
    console.error('Error getting NVIDIA GPU metrics:', error);
    return getFallbackMetrics();
  }
}

/**
 * Provide fallback metrics when hardware monitoring fails
 */
function getFallbackMetrics() {
  return {
    gpuUtilization: 0,
    gpuMemoryUsage: 0,
    tokensPerSecond: 0,
    inferenceActive: false,
    latency: 0,
    temperature: 0
  };
}

/**
 * Get appropriate GPU metrics based on platform
 */
async function getGpuMetrics() {
  // Check cache first
  const now = Date.now();
  if (now - metricsCache.timestamp < CACHE_TTL && metricsCache.data) {
    return metricsCache.data;
  }
  
  // Determine platform
  const platform = process.platform;
  let metrics;
  
  if (platform === 'darwin') {
    metrics = await getAppleSiliconMetrics();
  } else if (platform === 'win32') {
    metrics = await getNvidiaMetrics();
  } else {
    // Linux or other platforms - check for NVIDIA first, fall back to generic
    try {
      const { stdout } = await execPromise('which nvidia-smi');
      if (stdout.trim()) {
        metrics = await getNvidiaMetrics();
      } else {
        metrics = getFallbackMetrics();
      }
    } catch (error) {
      metrics = getFallbackMetrics();
    }
  }
  
  // Update cache
  metricsCache = {
    timestamp: now,
    data: metrics
  };
  
  return metrics;
}

module.exports = {
  getGpuMetrics
};
