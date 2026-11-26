import { logger } from "../logger.js";
import { dB } from "./index.js";

export async function createSchema() {
  try {
    // 1. Tabel Users
    await dB.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        username   VARCHAR(100) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        role       ENUM('admin', 'petugas') NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_users_username (username),
        INDEX idx_users_role (role)
      );
    `);

    // 2. Tabel Categories
    await dB.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_categories_name (name)
      );
    `);

    // 3. Tabel Suppliers
    await dB.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        address    TEXT,
        phone      VARCHAR(20),
        contact    VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        INDEX idx_suppliers_name (name)
      );
    `);

    // 4. Tabel Spareparts
    await dB.execute(`
      CREATE TABLE IF NOT EXISTS spareparts (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        kode        VARCHAR(50) NOT NULL UNIQUE,
        name        VARCHAR(100) NOT NULL,
        brand       VARCHAR(100),
        unit        VARCHAR(20) DEFAULT 'pcs',
        category_id INT,
        supplier_id INT,
        buy_price   DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        sell_price  DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        stock       INT NOT NULL DEFAULT 0,
        min_stock   INT NOT NULL DEFAULT 0,
        description TEXT,

        -- Status dihitung otomatis oleh MySQL
        status      VARCHAR(20) GENERATED ALWAYS AS (
                      CASE
                        WHEN stock <= 0 THEN 'habis'
                        WHEN stock <= min_stock THEN 'hampir habis'
                        ELSE 'aman'
                      END
                    ) STORED,

        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Foreign Key Constraints
        CONSTRAINT fk_spareparts_category
          FOREIGN KEY (category_id)
          REFERENCES categories(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,

        CONSTRAINT fk_spareparts_supplier
          FOREIGN KEY (supplier_id)
          REFERENCES suppliers(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,

        -- Indexes
        INDEX idx_spareparts_kode (kode),
        INDEX idx_spareparts_name (name),
        INDEX idx_spareparts_brand (brand),
        INDEX idx_spareparts_category_id (category_id),
        INDEX idx_spareparts_supplier_id (supplier_id),
        INDEX idx_spareparts_status (status)
      );
    `);

    // 5. Tabel Stock Transactions
    await dB.execute(`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        date         DATE NOT NULL,
        type         ENUM('in', 'out') NOT NULL,
        sparepart_id INT NOT NULL,
        supplier_id  INT,
        user_id      INT,
        quantity     INT NOT NULL DEFAULT 1,
        buy_price    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        notes        TEXT,

        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Foreign Key Constraints
        CONSTRAINT fk_stock_transactions_sparepart
          FOREIGN KEY (sparepart_id)
          REFERENCES spareparts(id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,

        CONSTRAINT fk_stock_transactions_supplier
          FOREIGN KEY (supplier_id)
          REFERENCES suppliers(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,

        CONSTRAINT fk_stock_transactions_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,

        -- Indexes
        INDEX idx_stock_transactions_date (date),
        INDEX idx_stock_transactions_type (type),
        INDEX idx_stock_transactions_sparepart_id (sparepart_id),
        INDEX idx_stock_transactions_supplier_id (supplier_id),
        INDEX idx_stock_transactions_user_id (user_id)
      );
    `);

    logger.info(
      "Database schema created successfully (5 tables - Simple Version).",
    );
  } catch (error) {
    logger.error({ err: error }, "Failed to create database schema");
    throw error;
  }
}
