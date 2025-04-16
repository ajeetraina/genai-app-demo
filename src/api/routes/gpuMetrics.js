// File: src/api/routes/gpuMetrics.js

const express = require('express');
const router = express.Router();
const { getGpuMetrics } = require('../gpuMetricsService');

/**
 * API endpoint to retrieve GPU metrics for Docker Model Runner
 * 
 * Can be placed in a feature branch as it's not core functionality
 */
router.get('/gpu-metrics', async (req, res) => {
  try {
    const metrics = await getGpuMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error in GPU metrics endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve GPU metrics',
      message: error.message
    });
  }
});

module.exports = router;
