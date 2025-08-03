'use client';

import { useEffect, useState } from 'react';
import axiosClient from '@/app/lib/axiosClient';
import Sidebar from '@/app/components/Sidebar';
import Link from 'next/link';

export default function AdminBeritaPage() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient
      .get('/berita', {
        params: {
          page: 1,
          limit: 50,
          sort: 'created_at',
          order: 'desc',
        },
      })
      .then((res) => {
        if (res.data.success) {
          setArticles(res.data.data.articles);
        } else {
          setError(res.data.message || 'Gagal memuat data berita.');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Terjadi kesalahan saat mengambil data berita.');
      });
  }, []);

  return (
    <>
      <Sidebar />
      <main className="p-4 bg-light" style={{ marginLeft: '250px', minHeight: '100vh' }}>
        <div className="container-fluid">
          <h2 className="mb-4">📝 Validasi Berita</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th>No</th>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Tanggal Publikasi</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {articles.length > 0 ? (
                  articles.map((article, index) => (
                    <tr key={article.id}>
                      <td>{index + 1}</td>
                      <td>{article.judul}</td>
                      <td>{article.kategori?.nama || '-'}</td>
                      <td>
                        <span className={`badge bg-${article.status === 'published' ? 'success' : 'secondary'}`}>
                          {article.status}
                        </span>
                      </td>
                      <td>{new Date(article.tanggalPublikasi).toLocaleDateString('id-ID')}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2">
                          Validasi
                        </button>
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      Tidak ada berita ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
