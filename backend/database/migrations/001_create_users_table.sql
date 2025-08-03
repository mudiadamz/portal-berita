-- Create users table
-- Migration: 001_create_users_table
-- Description: Creates the users table with authentication and role management

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- Insert default admin user (password: Admin123!)
-- Note: In production, change this password immediately
INSERT INTO users (name, email, password, role) VALUES
  ('Administrator', 'admin@portalberita.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ooqWw.', 'admin');

-- Insert sample editor user (password: Editor123!)
INSERT INTO users (name, email, password, role) VALUES
  ('Editor User', 'editor@portalberita.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ooqWw.', 'editor');

-- Insert sample regular user (password: User123!)
INSERT INTO users (name, email, password, role) VALUES
  ('Regular User', 'user@portalberita.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ooqWw.', 'user');
