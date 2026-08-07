const app = require('./src/app');

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`✅ Student Observations Server running on http://localhost:${PORT}`);
});