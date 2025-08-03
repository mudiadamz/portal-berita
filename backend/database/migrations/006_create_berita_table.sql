-- Create berita table
-- Migration: 006_create_berita_table
-- Description: Creates the berita (news) table with comprehensive fields

CREATE TABLE IF NOT EXISTS berita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    konten LONGTEXT NOT NULL,
    ringkasan TEXT,
    gambar_utama VARCHAR(500),
    tags JSON,
    status ENUM('draft', 'review', 'published', 'rejected', 'archived') DEFAULT 'draft',
    tanggal_publikasi TIMESTAMP NULL,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    
    -- Author and category relationships
    author_id INT NOT NULL,
    kategori_id INT NOT NULL,
    kanal_instansi_id INT NULL,
    
    -- Metadata
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_breaking_news BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE RESTRICT,
    FOREIGN KEY (kanal_instansi_id) REFERENCES kanal_instansi(id) ON DELETE SET NULL,
    
    -- Indexes for better performance
    INDEX idx_judul (judul),
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_author_id (author_id),
    INDEX idx_kategori_id (kategori_id),
    INDEX idx_kanal_instansi_id (kanal_instansi_id),
    INDEX idx_tanggal_publikasi (tanggal_publikasi),
    INDEX idx_is_featured (is_featured),
    INDEX idx_is_breaking_news (is_breaking_news),
    INDEX idx_views_count (views_count),
    INDEX idx_created_at (created_at),
    INDEX idx_status_publikasi (status, tanggal_publikasi),
    
    -- Full-text search indexes
    FULLTEXT INDEX ft_judul_konten (judul, konten),
    FULLTEXT INDEX ft_judul_ringkasan (judul, ringkasan)
);
