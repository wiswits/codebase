const app = require('./src/app');

const PORT = process.env.PORT || 5007;

app.listen(PORT, () => {
  console.log(`✅ Utilization Server running on http://localhost:${PORT}`);
  console.log(`📝 Utilization API: http://localhost:${PORT}/api/v1/utilization`);
});