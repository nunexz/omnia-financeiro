/*
  Warnings:

  - Added the required column `saldo_devedor` to the `Divida` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `divida` ADD COLUMN `quitado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `saldo_devedor` DECIMAL(12, 2) NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `googleId` VARCHAR(191) NOT NULL DEFAULT '';
