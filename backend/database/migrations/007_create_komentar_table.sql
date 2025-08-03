-- Create komentar table
-- Migration: 007_create_komentar_table
-- Description: Creates the komentar (comments) table for news articles

CREATE TABLE IF NOT EXISTS komentar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    konten TEXT NOT NULL,
    berita_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    is_reported BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (berita_id) REFERENCES berita(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES komentar(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_berita_id (berita_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_approved (is_approved),
    INDEX idx_is_reported (is_reported),
    INDEX idx_created_at (created_at),
    INDEX idx_berita_approved (berita_id, is_approved),
    
    -- Full-text search index
    FULLTEXT INDEX ft_konten (konten)
);

-- Sample comments will be added in a later migration after sample berita data is created
