const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`API Gateway running on port ${port}`));

process.on('unhandledRejection', (err) => {
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});
