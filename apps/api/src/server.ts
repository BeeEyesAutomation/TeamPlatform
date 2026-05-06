import { createApp } from "./app";
import { env } from "./config/env";
import "./jobs/email.worker";

const app = createApp();

app.listen(env.API_PORT, () => {
  console.log(`API listening on port ${env.API_PORT}`);
});
