-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('customer', 'admin', 'super_admin') NOT NULL DEFAULT 'customer';

-- CreateTable
CREATE TABLE `ChatMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `sender` ENUM('customer', 'admin', 'super_admin') NOT NULL DEFAULT 'customer',
    `message` TEXT NOT NULL,
    `messageType` VARCHAR(191) NOT NULL DEFAULT 'text',
    `metadata` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
