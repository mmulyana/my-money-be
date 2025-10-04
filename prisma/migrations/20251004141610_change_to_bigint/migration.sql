/*
  Warnings:

  - You are about to alter the column `total` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `balance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `actual` on the `budgetItem` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `planned` on the `budgetItem` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "total" BIGINT NOT NULL,
    "walletId" TEXT NOT NULL,
    CONSTRAINT "Budget_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Budget" ("endAt", "id", "name", "startAt", "total", "walletId") SELECT "endAt", "id", "name", "startAt", "total", "walletId" FROM "Budget";
DROP TABLE "Budget";
ALTER TABLE "new_Budget" RENAME TO "Budget";
CREATE TABLE "new_Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "balance" BIGINT DEFAULT 0
);
INSERT INTO "new_Wallet" ("balance", "color", "id", "name") SELECT "balance", "color", "id", "name" FROM "Wallet";
DROP TABLE "Wallet";
ALTER TABLE "new_Wallet" RENAME TO "Wallet";
CREATE TABLE "new_budgetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "planned" BIGINT NOT NULL,
    "actual" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "budgetItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "budgetItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_budgetItem" ("actual", "budgetId", "categoryId", "id", "planned") SELECT "actual", "budgetId", "categoryId", "id", "planned" FROM "budgetItem";
DROP TABLE "budgetItem";
ALTER TABLE "new_budgetItem" RENAME TO "budgetItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
