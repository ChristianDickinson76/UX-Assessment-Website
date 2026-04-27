const app = require("./app");
const env = require("./config/env");
const connectDb = require("./config/db");

async function bootstrap() {
  try {
    await connectDb();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`API running on http://localhost:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

bootstrap();
