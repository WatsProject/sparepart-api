import { Router } from "express";
import { stockTransactionsController } from "../controllers/stockTransactions.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";

const StockTransactionsRouter = Router();

StockTransactionsRouter.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  stockTransactionsController.getAllTransactions,
);
StockTransactionsRouter.get(
  "/in",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  stockTransactionsController.getStockIn,
);
StockTransactionsRouter.get(
  "/out",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  stockTransactionsController.getStockOut,
);
StockTransactionsRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  stockTransactionsController.getTransactionById,
);
StockTransactionsRouter.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  stockTransactionsController.createTransaction,
);
StockTransactionsRouter.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  stockTransactionsController.updateTransaction,
);
StockTransactionsRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "petugas"),
  stockTransactionsController.deleteTransaction,
);

export default StockTransactionsRouter;
