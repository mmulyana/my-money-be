-- CreateTable
CREATE TABLE "BudgetItemTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetItemId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetItemTransaction_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budgetItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BudgetItemTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BudgetItemTransaction_transactionId_idx" ON "BudgetItemTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "BudgetItemTransaction_budgetItemId_idx" ON "BudgetItemTransaction"("budgetItemId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItemTransaction_budgetItemId_transactionId_key" ON "BudgetItemTransaction"("budgetItemId", "transactionId");
