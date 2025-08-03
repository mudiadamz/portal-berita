'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import axiosClient from '../../../lib/axiosClient';

export default function TambahBeritaPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  const [kategoriError, setKategoriError] = useState('');

  useEffect(() => {
    axiosClient.get('/kategori/active')
      .then(res => {
        if (res.data.success) {
          setCategories(res.data.data.categories);
        } else {
          setKategoriError('Gagal memuat kategori');
          setFieldErrors(res.data.errors || []);
        }
      })
      .catch(() => {
        setKategoriError('Terjadi kesalahan saat memuat kategori.');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const title = e.target.judul.value;
    const slug = title.toLowerCase().replace(/\s+/g, '-');
    const content = e.target.isi.value;
    const ringkasan = content.slice(0, 100) + '...';
    const kategori = e.target.kategori.value;
    const status = e.target.status.value;

    const payload = {
      judul: title,
      slug,
      konten: content,
      ringkasan,
      gambarUtama: 'https://placehold.co/600x400',
      tags: ['berita', 'umum'],
      kategoriId: parseInt(kategori),
      status,
      metaTitle: `${title} - Portal Berita`,
      metaDescription: ringkasan,
      isFeatured: false,
      isBreakingNews: false,
    };

    try {
      const res = await axiosClient.post('/berita', payload);
      if (res.data.success) {
        alert('Berita berhasil ditambahkan!');
        router.push('/admin/news');
      } else {
        setError(res.data.message || 'Gagal menambahkan berita.');
          setFieldErrors(res.data.errors || []);
      }
    } catch (err) {
  if (err.response && err.response.status === 400) {
    const data = err.response.data;
    setError(data.message || 'Permintaan tidak valid.');
    setFieldErrors(data.errors || []);
  } else {
    console.error(err);
    setError('Terjadi kesalahan saat menyimpan berita.');
    setFieldErrors([]);
  }
    }

    setLoading(false);
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <main className="p-4 bg-light" style={{ marginLeft: '250px', minHeight: '100vh', width: '100%' }}>
        <div className="container mt-5">
          <h2 className="mb-4">📝 Tambah Berita Baru</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          {fieldErrors.length > 0 && (
            <div className="alert alert-warning">
              <ul className="mb-0">
                {fieldErrors.map((err, idx) => (
                  <li key={idx}>
                    <strong>{err.field}:</strong> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}


          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Judul Berita</label>
              <input name="judul" type="text" className="form-control" required />
            </div>

            <div className="mb-3">
              <label className="form-label">Kategori</label>
              <select name="kategori" className="form-select" required>
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Isi Berita</label>
              <textarea name="isi" className="form-control" rows="6" required></textarea>
            </div>

            <div className="mb-3">
              <label className="form-label">Status</label>
              <select name="status" className="form-select">
                <option value="draft">Draft</option>
                <option value="published">Tayang</option>
                <option value="review">Menunggu Validasi</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary me-2" disabled={loading}>
              {loading ? 'Menyimpan...' : '🧾 Simpan Berita'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
