-- DropForeignKey
ALTER TABLE "public"."receptions" DROP CONSTRAINT "receptions_supplier_id_fkey";

-- AlterTable
ALTER TABLE "public"."receptions" ADD COLUMN     "origen" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sent_at" TIMESTAMP(3),
ADD COLUMN     "sent_by" TEXT,
ALTER COLUMN "supplier_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."receptions" ADD CONSTRAINT "receptions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
