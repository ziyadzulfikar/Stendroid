// Health check route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
}); 