-- Create bookmark table
-- Migration: 008_create_bookmark_table
-- Description: Creates the bookmark table for users to save news articles

CREATE TABLE IF NOT EXISTS bookmark (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    berita_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (berita_id) REFERENCES berita(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate bookmarks
    UNIQUE KEY unique_user_berita (user_id, berita_id),
    
    -- Indexes for better performance
    INDEX idx_user_id (user_id),
    INDEX idx_berita_id (berita_id),
    INDEX idx_created_at (created_at)
);

-- Sample bookmarks will be added in a later migration after sample berita data is created
