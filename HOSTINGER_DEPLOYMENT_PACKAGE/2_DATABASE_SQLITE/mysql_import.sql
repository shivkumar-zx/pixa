-- ========================================================
-- PixBox Vault Hostinger MySQL Import Database Script
-- Compatible with Hostinger MySQL & MariaDB (phpMyAdmin)
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `Notification`;
DROP TABLE IF EXISTS `ActivityLog`;
DROP TABLE IF EXISTS `FileShare`;
DROP TABLE IF EXISTS `Favorite`;
DROP TABLE IF EXISTS `File`;
DROP TABLE IF EXISTS `Category`;
DROP TABLE IF EXISTS `User`;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Table structure for User
-- --------------------------------------------------------
CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `username` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `avatar` VARCHAR(191) NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'EMPLOYEE',
  `storageUsed` BIGINT NOT NULL DEFAULT 0,
  `storageQuota` BIGINT NOT NULL DEFAULT 5368709120,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for Category
-- --------------------------------------------------------
CREATE TABLE `Category` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `parentId` VARCHAR(191) NULL,
  `allowedRoles` VARCHAR(191) NOT NULL DEFAULT '[]',
  `createdById` VARCHAR(191) NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_name_key` (`name`),
  UNIQUE KEY `Category_slug_key` (`slug`),
  KEY `Category_createdById_fkey` (`createdById`),
  CONSTRAINT `Category_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for File
-- --------------------------------------------------------
CREATE TABLE `File` (
  `id` VARCHAR(191) NOT NULL,
  `originalName` VARCHAR(191) NOT NULL,
  `storedName` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NOT NULL,
  `size` BIGINT NOT NULL,
  `storageKey` VARCHAR(191) NOT NULL,
  `bucketName` VARCHAR(191) NOT NULL DEFAULT 'pixbox-documents',
  `storagePath` VARCHAR(191) NOT NULL DEFAULT '',
  `fileType` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `uploadedById` VARCHAR(191) NOT NULL,
  `categoryId` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
  `version` INT NOT NULL DEFAULT 1,
  `parentFileId` VARCHAR(191) NULL,
  `downloadCount` INT NOT NULL DEFAULT 0,
  `isPublic` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `File_storedName_key` (`storedName`),
  KEY `File_uploadedById_fkey` (`uploadedById`),
  KEY `File_categoryId_fkey` (`categoryId`),
  CONSTRAINT `File_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `File_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for Favorite
-- --------------------------------------------------------
CREATE TABLE `Favorite` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `fileId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Favorite_userId_fileId_key` (`userId`, `fileId`),
  CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Favorite_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for FileShare
-- --------------------------------------------------------
CREATE TABLE `FileShare` (
  `id` VARCHAR(191) NOT NULL,
  `fileId` VARCHAR(191) NOT NULL,
  `sharedWithId` VARCHAR(191) NOT NULL,
  `sharedById` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `FileShare_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FileShare_sharedWithId_fkey` FOREIGN KEY (`sharedWithId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FileShare_sharedById_fkey` FOREIGN KEY (`sharedById`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for ActivityLog
-- --------------------------------------------------------
CREATE TABLE `ActivityLog` (
  `id` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `fileId` VARCHAR(191) NULL,
  `metadata` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ActivityLog_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `File` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for Notification
-- --------------------------------------------------------
CREATE TABLE `Notification` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `isRead` TINYINT(1) NOT NULL DEFAULT 0,
  `type` VARCHAR(191) NOT NULL,
  `link` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Default Seed Data Insertion
-- Default Password for all seed users: Admin@123 / Manager@123 / Employee@123 (hashed with bcryptjs)
-- --------------------------------------------------------

INSERT INTO `User` (`id`, `email`, `username`, `name`, `password`, `role`, `storageQuota`) VALUES
('user-admin-01', 'admin@company.com', 'admin', 'System Admin', '$2a$12$R.AypO/dI2cK.2L7F3i4fexxQx31lR0fH3w7rT6B2n0qD8y4K3.7C', 'ADMIN', 10737418240),
('user-manager-01', 'manager@example.com', 'manager', 'Manager User', '$2a$12$R.AypO/dI2cK.2L7F3i4fexxQx31lR0fH3w7rT6B2n0qD8y4K3.7C', 'MANAGER', 5368709120),
('user-employee-01', 'employee@example.com', 'employee', 'Employee User', '$2a$12$R.AypO/dI2cK.2L7F3i4fexxQx31lR0fH3w7rT6B2n0qD8y4K3.7C', 'EMPLOYEE', 5368709120);

INSERT INTO `Category` (`id`, `name`, `slug`, `createdById`) VALUES
('cat-hr-01', 'HR Guidelines', 'hr-guidelines', 'user-admin-01'),
('cat-finance-01', 'Financial Reports', 'financial-reports', 'user-admin-01'),
('cat-marketing-01', 'Marketing Assets', 'marketing-assets', 'user-admin-01');

INSERT INTO `Notification` (`id`, `userId`, `title`, `message`, `type`) VALUES
('notif-welcome-01', 'user-admin-01', 'Welcome to PixBox Vault', 'Your production vault is ready for storing and managing team documents.', 'SYSTEM');
