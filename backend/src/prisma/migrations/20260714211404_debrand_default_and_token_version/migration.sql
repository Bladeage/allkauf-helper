-- AlterTable
ALTER TABLE "project_settings" ALTER COLUMN "project_name" SET DEFAULT 'Fertighaus-Helfer';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;
