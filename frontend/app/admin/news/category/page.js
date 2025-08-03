'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../../../../app/components/Sidebar';
import axiosClient from '../../../lib/axiosClient';

export default function KategoriAdminPage() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get('/kategori/active')
      .then((res) => {
        if (res.data.success) {
          setCategories(res.data.data.categories);
        } else {
          setError(res.data.message || 'Gagal memuat kategori');
        }
      })
      .catch(() => {
        setError('Terjadi kesalahan saat mengambil data kategori.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <main className="p-4 bg-light" style={{ marginLeft: '250px', width: '100%' }}>
        <div className="container">
          <h2 className="mb-4">📂 Daftar Kategori Aktif</h2>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading ? (
            <p>Memuat data...</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th>No</th>
                    <th>Nama</th>
                    <th>Slug</th>
                    <th>Deskripsi</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, i) => (
                    <tr key={cat.id}>
                      <td>{i + 1}</td>
                      <td>{cat.nama}</td>
                      <td><code>{cat.slug}</code></td>
                      <td>{cat.deskripsi}</td>
                      <td>
                        <span className="badge bg-success">
                          {cat.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">Tidak ada kategori ditemukan</td>
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
