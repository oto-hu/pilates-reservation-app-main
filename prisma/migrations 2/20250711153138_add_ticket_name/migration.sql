-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "emergency_contact_furigana" TEXT,
ADD COLUMN     "emergency_contact_name" TEXT,
ADD COLUMN     "emergency_contact_phone" TEXT,
ADD COLUMN     "emergency_contact_relation" TEXT,
ADD COLUMN     "postal_code" TEXT;
