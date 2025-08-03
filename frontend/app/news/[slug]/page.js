'use client';

import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import Image from 'next/image';
import axiosClient from "@/app/lib/axiosClient";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";

export default function NewsDetailPage() {
    const {slug} = useParams();
    const router = useRouter();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!slug) return;

        const fetchArticle = async () => {
            try {
                const res = await axiosClient.get(`/berita/slug/${slug}`);
                const data = res.data;

                if (data.success) {
                    setArticle(data.data.article);
                } else {
                    setError(data.message || 'Gagal memuat artikel.');
                }
            } catch (err) {
                console.error(err);
                setError('Terjadi kesalahan saat mengambil data.');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [slug]);

    if (loading) return <div className="container mt-5">Memuat artikel...</div>;
    if (error) return <div className="container mt-5 text-danger">{error}</div>;
    if (!article) return <div className="container mt-5">Artikel tidak ditemukan.</div>;

    return (<>
            <Header/>
            <div className="container mt-5">
                <h1 className="mb-3">{article.judul}</h1>

                <p className="text-muted mb-1">
                    <strong>Kategori:</strong> {article.kategori?.nama} |{' '}
                    <strong>Oleh:</strong> {article.author?.name} |{' '}
                    <strong>Tanggal:</strong>{' '}
                    {new Date(article.tanggalPublikasi).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </p>

                {article.gambarUtama && (
                    <div className="my-3">
                        <Image
                            src={article.gambarUtama}
                            alt="Gambar Utama"
                            width={800}
                            height={450}
                            className="img-fluid rounded"
                        />
                    </div>
                )}

                <div className="mt-4" style={{whiteSpace: 'pre-line'}}>
                    {article.konten}
                </div>

                <div className="mt-4">
                    <strong>Tags:</strong>{' '}
                    {article.tags?.map((tag, i) => (
                        <span key={i} className="badge bg-secondary me-1">{tag}</span>
                    ))}
                </div>

                <div className="mt-4 text-muted">
                    <small>
                        Views: {article.viewsCount} | Likes: {article.likesCount} | Shares: {article.sharesCount}
                    </small>
                </div>
            </div>
            <Footer/>
        </>
    );
}
