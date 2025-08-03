'use client';

import {useEffect, useState} from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Link from 'next/link';
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function HomePage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        axiosClient.get('/berita', {
            params: {
                sort: 'created_at',
                order: 'desc',
                status: 'published',
            },
        })
            .then(res => {
                if (res.data.success) {
                    setArticles(res.data.data.articles);
                } else {
                    setError(res.data.message || 'Gagal memuat berita');
                }
            })
            .catch(() => setError('Terjadi kesalahan saat mengambil berita.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Header/>

            <div className="container mt-4">
                <div className="row mb-3">
                    <div className="col-md-4">
                        <select className="form-select">
                            <option>Semua Kategori</option>
                            <option value="1">Nasional</option>
                            <option value="2">Lokal</option>
                            <option value="3">Teknologi</option>
                            <option value="4">Olahraga</option>
                        </select>
                    </div>
                </div>

                {loading && <p>Memuat berita...</p>}
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="row g-4">
                    {articles.map((news) => (
                        <div className="col-md-4" key={news.id}>
                            <div className="card h-100 shadow-sm">
                                <img
                                    src={news.gambarUtama || 'https://placehold.co/600x400?text=No+Image'}
                                    className="card-img-top"
                                    alt={news.judul}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{news.judul}</h5>
                                    <p className="card-text">{news.ringkasan}</p>
                                    <Link href={`/news/${news.slug}`} className="btn btn-primary float-end">
                                        Baca Selengkapnya
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {articles.length === 0 && !loading && (
                        <p className="text-muted">Belum ada berita tersedia.</p>
                    )}
                </div>
            </div>

            <Footer/>
        </>
    );
}
