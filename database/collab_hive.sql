-- ============================================================
-- CollabHive database schema
-- Import this file into a MySQL database called `collab_hive`
--
-- phpMyAdmin: select the database → Import tab → choose this file → Go
-- CLI:        mysql -u root -p collab_hive < collab_hive.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Table: users
-- Stores registered accounts. Passwords are bcrypt-hashed.
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
-- Table: chat_messages
-- Stores workspace chat messages (text, attachments, voice).
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
