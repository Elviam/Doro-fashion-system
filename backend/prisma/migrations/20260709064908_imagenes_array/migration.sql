/*
  Warnings:

  - You are about to drop the column `imagen` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "imagen",
ADD COLUMN     "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[];
