ALTER TABLE "Category"
  ALTER COLUMN "monthlyBudget" TYPE DOUBLE PRECISION USING "monthlyBudget"::double precision;

ALTER TABLE "Transaction"
  ALTER COLUMN "type" TYPE TEXT USING "type"::text,
  ALTER COLUMN "amount" TYPE DOUBLE PRECISION USING "amount"::double precision;

DROP TYPE "TransactionType";
