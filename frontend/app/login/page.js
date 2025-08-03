'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerErrors([]);
    setGeneralError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerErrors([]);
    setGeneralError('');

    try {
      const res = await axiosClient('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Save token and redirect
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        alert('Login berhasil!');
        router.push('/admin');
      } else {
        setGeneralError(data.message || 'Login gagal');
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
      <h2 className="mb-4 text-center">🔐 Login</h2>

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

      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            name="email"
            type="email"
            className="form-control"
            required
            placeholder="you@example.com"
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
            placeholder="********"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Sedang Login...' : 'Login'}
        </button>
        <p className="mt-3 text-center">
          Belum punya akun? <Link href="/register">Daftar</Link>
        </p>
      </form>
    </div>
  );
}
