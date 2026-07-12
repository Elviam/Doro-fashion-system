-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "stock_ideal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock_maximo" INTEGER NOT NULL DEFAULT 0;
