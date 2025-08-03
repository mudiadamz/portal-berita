-- Insert sample berita data
-- Migration: 009_insert_sample_berita
-- Description: Inserts sample news articles for testing

-- Update existing posts table to berita table structure (if needed)
-- This migration assumes we're working with the new berita table

INSERT INTO berita (
    judul, 
    slug, 
    konten, 
    ringkasan, 
    tags, 
    status, 
    tanggal_publikasi, 
    author_id, 
    kategori_id, 
    kanal_instansi_id,
    meta_title,
    meta_description,
    is_featured,
    views_count
) VALUES 
(
    'Perkembangan Teknologi AI di Indonesia Tahun 2024',
    'perkembangan-teknologi-ai-indonesia-2024',
    'Indonesia mengalami perkembangan pesat dalam adopsi teknologi Artificial Intelligence (AI) di berbagai sektor. Pemerintah melalui Kementerian Komunikasi dan Informatika terus mendorong inovasi teknologi untuk meningkatkan daya saing bangsa...',
    'Indonesia mengalami perkembangan pesat dalam adopsi teknologi AI di berbagai sektor dengan dukungan pemerintah.',
    '["teknologi", "AI", "indonesia", "inovasi"]',
    'published',
    NOW(),
    2,
    3,
    1,
    'Perkembangan AI Indonesia 2024 - Portal Berita',
    'Berita terkini tentang perkembangan teknologi AI di Indonesia tahun 2024',
    TRUE,
    150
),
(
    'Kebijakan Ekonomi Digital untuk UMKM',
    'kebijakan-ekonomi-digital-umkm',
    'Pemerintah meluncurkan kebijakan baru untuk mendukung transformasi digital UMKM. Program ini mencakup pelatihan, bantuan teknologi, dan akses pembiayaan untuk usaha mikro, kecil, dan menengah...',
    'Pemerintah meluncurkan kebijakan baru untuk mendukung transformasi digital UMKM dengan berbagai program bantuan.',
    '["ekonomi", "digital", "umkm", "kebijakan"]',
    'published',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    1,
    2,
    1,
    'Kebijakan Ekonomi Digital UMKM - Portal Berita',
    'Informasi lengkap kebijakan ekonomi digital untuk mendukung UMKM Indonesia',
    FALSE,
    89
),
(
    'Program Vaksinasi COVID-19 Tahap Lanjutan',
    'program-vaksinasi-covid19-tahap-lanjutan',
    'Kementerian Kesehatan mengumumkan program vaksinasi COVID-19 tahap lanjutan dengan target cakupan yang lebih luas. Program ini fokus pada kelompok rentan dan daerah terpencil...',
    'Kemenkes umumkan program vaksinasi COVID-19 lanjutan dengan target cakupan lebih luas.',
    '["kesehatan", "vaksinasi", "covid19"]',
    'review',
    NULL,
    2,
    5,
    NULL,
    'Program Vaksinasi COVID-19 Lanjutan - Portal Berita',
    'Update terbaru program vaksinasi COVID-19 tahap lanjutan dari Kementerian Kesehatan',
    FALSE,
    45
);
