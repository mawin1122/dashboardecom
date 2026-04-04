-- ========================================
-- ecomdb - Database Schema
-- ========================================

CREATE DATABASE IF NOT EXISTS ecomdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecomdb;

-- ========================================
-- Table: users
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100)        NOT NULL,
    email    VARCHAR(150)        NOT NULL UNIQUE,
    password VARCHAR(255)        NOT NULL,
    role     VARCHAR(20)         NOT NULL DEFAULT 'user',
    point    INT                 NOT NULL DEFAULT 0,
    created_at TIMESTAMP         DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- Table: categories
-- ========================================
CREATE TABLE IF NOT EXISTS categories (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(100) NOT NULL UNIQUE,
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- Table: products
-- ========================================
CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255)   NOT NULL,
    category    VARCHAR(100)   DEFAULT NULL,
    price       DECIMAL(10,2)  NOT NULL,
    stock       INT            NOT NULL DEFAULT 0,
    status      VARCHAR(20)    NOT NULL DEFAULT 'active',
    description TEXT           DEFAULT NULL,
    image_url   VARCHAR(500)   DEFAULT NULL,
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- Table: stock  (serial/item-level stock)
-- ========================================
CREATE TABLE IF NOT EXISTS stock (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT          NOT NULL,
    items      VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- Table: order_history
-- ========================================
CREATE TABLE IF NOT EXISTS order_history (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT            NOT NULL,
    product_id  INT            NOT NULL,
    quantity    INT            NOT NULL,
    unit_price  DECIMAL(10,2)  NOT NULL,
    total_price DECIMAL(10,2)  NOT NULL,
    status      VARCHAR(20)    NOT NULL DEFAULT 'completed',
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
