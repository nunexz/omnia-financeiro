import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

// Health check - deve estar ANTES de qualquer middleware
app.get('/health', (req, res) => {
  console.log('GET /health');
  res.json({ status: 'ok', message: 'Omnia API is running' });
});

// Catch all 404
app.use((req, res) => {
  console.log(`${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not Found' });
});

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});
