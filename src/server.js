import "dotenv/config";

import app from "./app.js";
import { logger } from "./logger.js";
import { DatabaseConnect } from "./database/setup.js";

const PORT = process.env.PORT || 3000;

/* Menjalankan server */
async function startServer() {
  try {
    await DatabaseConnect();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
}

startServer();
