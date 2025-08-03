-- Update users table for new schema
-- Migration: 003_update_users_table
-- Description: Updates users table to support new roles and status field

-- First, add status field
ALTER TABLE users ADD COLUMN status ENUM('aktif', 'nonaktif') DEFAULT 'aktif' AFTER role;

-- Update the role enum to include all old and new roles temporarily
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'editor', 'user', 'pengguna', 'jurnalis', 'instansi') DEFAULT 'pengguna';

-- Update existing users to use new role names
UPDATE users SET role = 'jurnalis' WHERE role = 'editor';
UPDATE users SET role = 'pengguna' WHERE role = 'user';
-- admin stays as admin

-- Now remove old role values from enum
ALTER TABLE users MODIFY COLUMN role ENUM('pengguna', 'jurnalis', 'admin', 'instansi') DEFAULT 'pengguna';

-- Add indexes for better performance
ALTER TABLE users ADD INDEX idx_status (status);
ALTER TABLE users ADD INDEX idx_role_status (role, status);

-- Update existing sample users with status
UPDATE users SET status = 'aktif' WHERE email = 'admin@portalberita.com';
UPDATE users SET status = 'aktif' WHERE email = 'editor@portalberita.com';
UPDATE users SET status = 'aktif' WHERE email = 'user@portalberita.com';

-- Insert sample instansi user
INSERT INTO users (name, email, password, role, status, is_active, created_at, updated_at) VALUES 
('Instansi User', 'instansi@portalberita.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL.ooqWw.', 'instansi', 'aktif', 1, NOW(), NOW());
