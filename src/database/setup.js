import { createSchema } from "./schema.js";
import { logger } from "../logger.js";

export async function DatabaseConnect() {
  try {
    logger.info("Connecting to database...");

    await createSchema();

    logger.info("Database connected successfully.");
    logger.info("Database ready.");
  } catch (err) {
    logger.fatal({ err }, "Database connection failed");
    throw err;
  }
}
