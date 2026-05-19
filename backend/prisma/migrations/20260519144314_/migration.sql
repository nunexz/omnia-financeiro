-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `googleId` VARCHAR(191) NOT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `totpSecret` VARCHAR(191) NULL,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_googleId_key`(`googleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Renda` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `valor_bruto` DECIMAL(12, 2) NOT NULL,
    `valor_liquido` DECIMAL(12, 2) NOT NULL,
    `is_clt` BOOLEAN NOT NULL,
    `dependentes` INTEGER NOT NULL DEFAULT 0,
    `mes_ano` VARCHAR(191) NOT NULL,
    `pago` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Renda_userId_idx`(`userId`),
    INDEX `Renda_mes_ano_idx`(`mes_ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DescontoRenda` (
    `id` VARCHAR(191) NOT NULL,
    `rendaId` VARCHAR(191) NOT NULL,
    `desc` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,

    INDEX `DescontoRenda_rendaId_idx`(`rendaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GastoFixo` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `vencimento` INTEGER NOT NULL,
    `mes_ano` VARCHAR(191) NOT NULL,
    `pago` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GastoFixo_userId_idx`(`userId`),
    INDEX `GastoFixo_mes_ano_idx`(`mes_ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Divida` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `parcela` DECIMAL(12, 2) NOT NULL,
    `vencimento` INTEGER NOT NULL,
    `parcelas_pagas` INTEGER NOT NULL DEFAULT 0,
    `parcelas_totais` INTEGER NOT NULL,
    `mes_ano` VARCHAR(191) NOT NULL,
    `pago` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Divida_userId_idx`(`userId`),
    INDEX `Divida_mes_ano_idx`(`mes_ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GastoVariavel` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `obs` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GastoVariavel_userId_idx`(`userId`),
    INDEX `GastoVariavel_data_idx`(`data`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Investimento` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `mes_ano` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Investimento_userId_idx`(`userId`),
    INDEX `Investimento_mes_ano_idx`(`mes_ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditoriaLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `tabela` VARCHAR(191) NOT NULL,
    `registroId` VARCHAR(191) NOT NULL,
    `dados` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditoriaLog_userId_idx`(`userId`),
    INDEX `AuditoriaLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Renda` ADD CONSTRAINT `Renda_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DescontoRenda` ADD CONSTRAINT `DescontoRenda_rendaId_fkey` FOREIGN KEY (`rendaId`) REFERENCES `Renda`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GastoFixo` ADD CONSTRAINT `GastoFixo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Divida` ADD CONSTRAINT `Divida_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GastoVariavel` ADD CONSTRAINT `GastoVariavel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Investimento` ADD CONSTRAINT `Investimento_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditoriaLog` ADD CONSTRAINT `AuditoriaLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
