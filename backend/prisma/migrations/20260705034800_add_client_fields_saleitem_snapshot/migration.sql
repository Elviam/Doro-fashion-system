/*
  Warnings:

  - Added the required column `updated_at` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre_producto` to the `sale_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."clients" ADD COLUMN     "contacto" TEXT,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "rfc" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."sale_items" ADD COLUMN     "imagen_producto" TEXT,
ADD COLUMN     "nombre_producto" TEXT NOT NULL;
