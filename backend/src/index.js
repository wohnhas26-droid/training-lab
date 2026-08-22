import './loadEnv.js';
import { config, jwtSecretIssue } from './config.js';
import { createApp } from './app.js';

const secretIssue = jwtSecretIssue();
if (secretIssue) {
  console.error(`FATAL: ${secretIssue}. Set a strong JWT_SECRET before starting in production.`);
  process.exit(1);
}

const app = createApp();
app.listen(config.port, () => {
  console.log(`Futbol Training Lab API running on http://localhost:${config.port}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
});
