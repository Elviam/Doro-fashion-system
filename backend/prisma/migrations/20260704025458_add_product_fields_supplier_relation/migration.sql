-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "modelo" TEXT,
ADD COLUMN     "supplier_id" TEXT,
ADD COLUMN     "unidad" TEXT;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
