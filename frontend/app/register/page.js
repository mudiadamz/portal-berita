'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'pengguna'
  });
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerErrors([]); // clear field errors on input
    setGeneralError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerErrors([]);
    setGeneralError('');

    try {
      const res = await axiosClient.post('/auth/register', form );

      const data = await res.json();

      if (res.ok && data.success) {
        alert('Pendaftaran berhasil!');
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        router.push('/login');
      } else {
        setGeneralError(data.message || 'Pendaftaran gagal');
        setServerErrors(data.errors || []);
      }
    } catch (err) {
      console.error(err);
      setGeneralError('Terjadi kesalahan. Silakan coba lagi.');
    }

    setLoading(false);
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h2 className="mb-4 text-center">📝 Daftar</h2>

      {/* General Error */}
      {generalError && (
        <div className="alert alert-danger" role="alert">
          {generalError}
        </div>
      )}

      {/* Field-specific Errors */}
      {serverErrors.length > 0 && (
        <div className="alert alert-warning" role="alert">
          <ul className="mb-0">
            {serverErrors.map((err, i) => (
              <li key={i}><strong>{err.field}:</strong> {err.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleRegister}>
        <div className="mb-3">
          <label className="form-label">Nama</label>
          <input
            name="name"
            type="text"
            className="form-control"
            required
            value={form.name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            name="email"
            type="email"
            className="form-control"
            required
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            name="password"
            type="password"
            className="form-control"
            required
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn btn-success w-100" disabled={loading}>
          {loading ? 'Mendaftarkan...' : 'Daftar'}
        </button>
        <p className="mt-3 text-center">
          Sudah punya akun? <Link href="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
