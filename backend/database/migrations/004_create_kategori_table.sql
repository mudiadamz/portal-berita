-- Create kategori table
-- Migration: 004_create_kategori_table
-- Description: Creates the kategori (categories) table for news classification

CREATE TABLE IF NOT EXISTS kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT,
    slug VARCHAR(120) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_nama (nama),
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- Insert sample categories
INSERT INTO kategori (nama, deskripsi, slug, is_active) VALUES 
('Politik', 'Berita seputar politik dan pemerintahan', 'politik', TRUE),
('Ekonomi', 'Berita ekonomi, bisnis, dan keuangan', 'ekonomi', TRUE),
('Teknologi', 'Berita teknologi, inovasi, dan digital', 'teknologi', TRUE),
('Olahraga', 'Berita olahraga dan kompetisi', 'olahraga', TRUE),
('Kesehatan', 'Berita kesehatan dan medis', 'kesehatan', TRUE),
('Pendidikan', 'Berita pendidikan dan akademik', 'pendidikan', TRUE),
('Hiburan', 'Berita hiburan, selebriti, dan lifestyle', 'hiburan', TRUE),
('Lingkungan', 'Berita lingkungan dan alam', 'lingkungan', TRUE);
