/*
  Warnings:

  - You are about to drop the `budgetItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "budgetItem";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "planned" BIGINT NOT NULL,
    "actual" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "BudgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BudgetItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BudgetItemTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetItemId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetItemTransaction_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BudgetItemTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BudgetItemTransaction" ("budgetItemId", "createdAt", "id", "transactionId") SELECT "budgetItemId", "createdAt", "id", "transactionId" FROM "BudgetItemTransaction";
DROP TABLE "BudgetItemTransaction";
ALTER TABLE "new_BudgetItemTransaction" RENAME TO "BudgetItemTransaction";
CREATE INDEX "BudgetItemTransaction_transactionId_idx" ON "BudgetItemTransaction"("transactionId");
CREATE INDEX "BudgetItemTransaction_budgetItemId_idx" ON "BudgetItemTransaction"("budgetItemId");
CREATE UNIQUE INDEX "BudgetItemTransaction_budgetItemId_transactionId_key" ON "BudgetItemTransaction"("budgetItemId", "transactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
