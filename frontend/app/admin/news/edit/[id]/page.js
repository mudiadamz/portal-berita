'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axiosClient from '../../../../lib/axiosClient';
import Sidebar from '../../../../../app/components/Sidebar';

export default function EditBeritaPage() {
  const router = useRouter();
  const { id } = useParams();

  const [form, setForm] = useState({
    judul: '',
    konten: '',
    kategoriId: '',
    status: 'draft',
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  // Load berita by ID
  useEffect(() => {
    async function loadData() {
      try {
        const [beritaRes, kategoriRes] = await Promise.all([
          axiosClient.get(`/berita/${id}`),
          axiosClient.get(`/kategori/active`),
        ]);

        const article = beritaRes.data.data.article;

        setForm({
          judul: article.judul,
          konten: article.konten,
          kategoriId: article.kategori?.id || '',
          status: article.status,
        });

        setCategories(kategoriRes.data.data.categories);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data berita.');
      }
      setFetching(false);
    }

    loadData();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors([]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors([]);

    const ringkasan = form.konten.slice(0, 100) + '...';
    const payload = {
      judul: form.judul,
      slug: form.judul.toLowerCase().replace(/\s+/g, '-'),
      konten: form.konten,
      ringkasan,
      kategoriId: parseInt(form.kategoriId),
      status: form.status,
      gambarUtama: 'https://placehold.co/600x400',
      tags: ['berita'],
      metaTitle: `${form.judul} - Portal Berita`,
      metaDescription: ringkasan,
      isFeatured: false,
      isBreakingNews: false,
    };

    try {
      const res = await axiosClient.put(`/berita/${id}`, payload);

      if (res.data.success) {
        alert('Berita berhasil diperbarui.');
        router.push('/admin/news');
      } else {
        setError(res.data.message || 'Gagal menyimpan perubahan.');
        setFieldErrors(res.data.errors || []);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.message);
        setFieldErrors(err.response.data.errors || []);
      } else {
        setError('Terjadi kesalahan saat menyimpan berita.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <main className="p-4 bg-light" style={{ marginLeft: '250px', width: '100%' }}>
        <div className="container mt-4">
          <h2 className="mb-4">✏️ Edit Berita</h2>

          {fetching ? (
            <p>Loading...</p>
          ) : (
            <>
              {error && <div className="alert alert-danger">{error}</div>}
              {fieldErrors.length > 0 && (
                <div className="alert alert-warning">
                  <ul className="mb-0">
                    {fieldErrors.map((err, i) => (
                      <li key={i}><strong>{err.field}:</strong> {err.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Judul Berita</label>
                  <input
                    name="judul"
                    value={form.judul}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Kategori</label>
                  <select
                    name="kategoriId"
                    value={form.kategoriId}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Isi Berita</label>
                  <textarea
                    name="konten"
                    value={form.konten}
                    onChange={handleChange}
                    rows="6"
                    className="form-control"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Tayang</option>
                    <option value="review">Menunggu Validasi</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Menyimpan...' : '💾 Simpan Perubahan'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
