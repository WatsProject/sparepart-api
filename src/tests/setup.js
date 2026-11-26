import dotenv from "dotenv";
import { beforeAll } from "vitest";

dotenv.config({ path: ".env.test" });

beforeAll(async () => {
  if (!process.env.DB_NAME?.endsWith("_test")) {
    throw new Error(
      `DB_NAME harus berakhiran "_test", sekarang: ${process.env.DB_NAME}`,
    );
  }

  const { dB } = await import("../database/index.js");
  const { DatabaseConnect } = await import("../database/setup.js");

  await DatabaseConnect();

  await dB.execute("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of [
    "stock_transactions",
    "spareparts",
    "suppliers",
    "categories",
    "users",
  ]) {
    await dB.execute(`TRUNCATE TABLE ${table}`);
  }
  await dB.execute("SET FOREIGN_KEY_CHECKS = 1");
});
