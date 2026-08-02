-- ============================================================
-- Crowdsourced Civic Issue Reporting and Resolution System
-- MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS civic_issues;
USE civic_issues;

-- ---------- Users (citizens) ----------
CREATE TABLE IF NOT EXISTS users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- Issues ----------
CREATE TABLE IF NOT EXISTS issues (
  issue_id      INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  title         VARCHAR(150) NOT NULL,
  category      VARCHAR(50) NOT NULL,
  description   TEXT,
  photo_url     VARCHAR(255),
  location      VARCHAR(255),
  latitude      DECIMAL(10,7),
  longitude     DECIMAL(10,7),
  status        ENUM('Reported','In Progress','Resolved') DEFAULT 'Reported',
  upvote_count  INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Status change history ----------
CREATE TABLE IF NOT EXISTS status_updates (
  update_id   INT AUTO_INCREMENT PRIMARY KEY,
  issue_id    INT NOT NULL,
  updated_by  VARCHAR(100),
  status      ENUM('Reported','In Progress','Resolved') NOT NULL,
  remarks     VARCHAR(255),
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Upvotes ----------
CREATE TABLE IF NOT EXISTS upvotes (
  upvote_id  INT AUTO_INCREMENT PRIMARY KEY,
  issue_id   INT NOT NULL,
  user_id    INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_upvote (issue_id, user_id),
  FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Note: The Admin account is NOT stored in this table.
-- Admin login (username: admin / password: admin) is verified against
-- ADMIN_USERNAME / ADMIN_PASSWORD in backend/.env — see README.
