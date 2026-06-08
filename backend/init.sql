-- EasyNotes MySQL Initialization Script
-- This runs automatically when the MySQL container starts for the first time

CREATE DATABASE IF NOT EXISTS easynotes_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE easynotes_db;

CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  color VARCHAR(10) DEFAULT '#6C63FF',
  createdAt DATETIME(3) NOT NULL,
  updatedAt DATETIME(3) NOT NULL,
  INDEX idx_updated (updatedAt DESC),
  FULLTEXT INDEX idx_search (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON easynotes_db.* TO 'easynotes'@'%';
FLUSH PRIVILEGES;
