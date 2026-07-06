/*
  Warnings:

  - You are about to drop the column `precio` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `talla` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[folio]` on the table `receptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fecha` to the `receptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `folio` to the `receptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `receptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `talla` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Made the column `client_id` on table `sales` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."sales" DROP CONSTRAINT "sales_client_id_fkey";

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "precio",
DROP COLUMN "stock",
DROP COLUMN "talla",
ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "imagen" TEXT,
ADD COLUMN     "marca" TEXT,
ADD COLUMN     "precio_compra" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "precio_venta" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."receptions" ADD COLUMN     "comentarios" TEXT,
ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "confirmed_by" TEXT,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "folio" TEXT NOT NULL,
ADD COLUMN     "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

-- AlterTable
ALTER TABLE "public"."sale_items" ADD COLUMN     "talla" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."sales" ADD COLUMN     "envio" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "client_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "talla" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reception_items" (
    "id" TEXT NOT NULL,
    "reception_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "talla" TEXT,
    "cantidad" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "reception_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_talla_key" ON "public"."product_variants"("product_id", "talla");

-- CreateIndex
CREATE UNIQUE INDEX "receptions_folio_key" ON "public"."receptions"("folio");

-- AddForeignKey
ALTER TABLE "public"."product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reception_items" ADD CONSTRAINT "reception_items_reception_id_fkey" FOREIGN KEY ("reception_id") REFERENCES "public"."receptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reception_items" ADD CONSTRAINT "reception_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
