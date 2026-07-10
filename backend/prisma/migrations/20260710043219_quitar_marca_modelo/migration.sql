/*
  Warnings:

  - You are about to drop the column `marca` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `modelo` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "marca",
DROP COLUMN "modelo";
