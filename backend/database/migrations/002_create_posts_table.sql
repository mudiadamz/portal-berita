-- Create posts table
-- Migration: 002_create_posts_table
-- Description: Creates the posts table for news articles

CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    category VARCHAR(50) NOT NULL,
    tags JSON,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_title (title),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status_created (status, created_at),
    
    -- Full-text search indexes
    FULLTEXT INDEX ft_title_content (title, content),
    FULLTEXT INDEX ft_title (title)
);

-- Insert sample posts
INSERT INTO posts (title, content, excerpt, category, tags, status, author_id) VALUES 
(
    'Welcome to Portal Berita',
    'This is the first post on our news portal. Portal Berita is a modern news platform built with Express.js and MySQL, featuring user authentication, role-based access control, and comprehensive content management capabilities.',
    'Welcome to our new news portal platform.',
    'Announcement',
    '["welcome", "news", "portal"]',
    'published',
    1
),
(
    'Getting Started with the API',
    'Our REST API provides comprehensive endpoints for managing users and posts. This guide will help you understand how to authenticate and interact with our API endpoints. The API supports JWT authentication and role-based access control.',
    'Learn how to use our REST API effectively.',
    'Technology',
    '["api", "guide", "tutorial"]',
    'published',
    2
),
(
    'Draft Article Example',
    'This is an example of a draft article. Draft articles are only visible to their authors and users with editor or admin privileges.',
    'An example draft article for testing purposes.',
    'Example',
    '["draft", "example"]',
    'draft',
    3
);
