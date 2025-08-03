'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import axiosClient from '@/app/lib/axiosClient';
import Link from 'next/link';

export default function KomentarAdminPage() {
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get('/komentar/my-comments', {
      params: {
        page: 1,
        limit: 10,
        sort: 'created_at',
        order: 'desc',
      }
    })
      .then(res => {
        if (res.data.success) {
          setComments(res.data.data.comments);
        } else {
          setError(res.data.message || 'Gagal memuat komentar');
        }
      })
      .catch(() => {
        setError('Terjadi kesalahan saat mengambil komentar.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <main className="p-4 bg-light" style={{ marginLeft: '250px', width: '100%' }}>
        <div className="container">
          <h2 className="mb-4">💬 Komentar</h2>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading ? (
            <p>Memuat komentar...</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>No</th>
                    <th>Isi Komentar</th>
                    <th>Berita</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((komentar, i) => (
                    <tr key={komentar.id}>
                      <td>{i + 1}</td>
                      <td>{komentar.isi}</td>
                      <td>
                        {komentar.berita ? (
                          <Link href={`/berita/${komentar.berita.id}`}>
                            {komentar.berita.judul}
                          </Link>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{new Date(komentar.createdAt).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                  {comments.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">Belum ada komentar</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
