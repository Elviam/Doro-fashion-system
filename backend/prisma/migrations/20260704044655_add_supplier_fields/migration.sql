/*
  Warnings:

  - Added the required column `updated_at` to the `suppliers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."suppliers" ADD COLUMN     "contacto" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "giro" TEXT,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "rfc" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
