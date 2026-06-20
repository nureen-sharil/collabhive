SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Table: users 
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100) NOT NULL,
  `email`         VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `ix_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: workspaces 
-- Stores workspace details securely mapped to its owner
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `workspaces` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `workspace_name` VARCHAR(100) NOT NULL,
  `description`    TEXT         DEFAULT NULL,
  
  -- FIX: Changed NOT NULL to DEFAULT NULL so optional deadlines don't crash the database insertion
  `deadline`       VARCHAR(50)  DEFAULT NULL, 
  
  `owner_id`       INT          NOT NULL,
  `color`          VARCHAR(7)   NOT NULL DEFAULT '#2563EB',
  `progress`       INT          NOT NULL DEFAULT 0,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_workspaces_owner_id` (`owner_id`),
  CONSTRAINT `fk_workspaces_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: workspace_members 
-- Maps many-to-many relationship of users inside groups
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `workspace_members` (
  `id`           INT         NOT NULL AUTO_INCREMENT,
  `workspace_id` INT         NOT NULL,
  `user_id`      INT         NOT NULL,
  `role`         VARCHAR(20) NOT NULL DEFAULT 'member',
  `joined_at`    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_workspace_user` (`workspace_id`, `user_id`),
  KEY `ix_workspace_members_user_id` (`user_id`),
  CONSTRAINT `fk_members_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table: chat_messages 
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `workspace_id`    VARCHAR(100) NOT NULL,
  `sender_id`       INT          NOT NULL,
  `receiver_id`     INT          DEFAULT NULL,
  `message_text`    TEXT         NOT NULL,
  `attachment_type` VARCHAR(20)  DEFAULT NULL,
  `attachment_name` VARCHAR(255) DEFAULT NULL,
  `attachment_url`  TEXT         DEFAULT NULL,
  `voice_duration`  VARCHAR(20)  DEFAULT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_chat_messages_workspace_id` (`workspace_id`),
  KEY `ix_chat_messages_sender_id` (`sender_id`),
  KEY `ix_chat_messages_receiver_id` (`receiver_id`),
  KEY `ix_chat_messages_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;