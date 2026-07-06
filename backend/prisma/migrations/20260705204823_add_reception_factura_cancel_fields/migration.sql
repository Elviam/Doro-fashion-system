-- AlterTable
ALTER TABLE "public"."receptions" ADD COLUMN     "canceled_at" TIMESTAMP(3),
ADD COLUMN     "canceled_by" TEXT,
ADD COLUMN     "factura_proveedor" TEXT;
