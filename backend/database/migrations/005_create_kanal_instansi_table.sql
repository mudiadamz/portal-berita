-- Create kanal_instansi table
-- Migration: 005_create_kanal_instansi_table
-- Description: Creates the kanal_instansi (institution channels) table

CREATE TABLE IF NOT EXISTS kanal_instansi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    deskripsi TEXT,
    slug VARCHAR(170) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    alamat TEXT,
    user_id INT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_nama (nama),
    INDEX idx_slug (slug),
    INDEX idx_user_id (user_id),
    INDEX idx_is_verified (is_verified),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- Insert sample institution channels
INSERT INTO kanal_instansi (nama, deskripsi, slug, website_url, contact_email, user_id, is_verified, is_active) VALUES 
('Kementerian Komunikasi dan Informatika', 'Kanal resmi Kementerian Komunikasi dan Informatika Republik Indonesia', 'kominfo', 'https://kominfo.go.id', 'humas@kominfo.go.id', 4, TRUE, TRUE),
('Badan Nasional Penanggulangan Bencana', 'Kanal resmi BNPB untuk informasi kebencanaan', 'bnpb', 'https://bnpb.go.id', 'humas@bnpb.go.id', 4, TRUE, TRUE);
