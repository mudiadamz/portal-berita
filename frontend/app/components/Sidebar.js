'use client';

import { useRouter } from 'next/navigation';
import axiosClient from '@/app/lib/axiosClient';
import Link from 'next/link';

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return router.push('/login');

    try {
      const res = await axiosClient.post('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.data;
      console.log('[Logout]', data.message);

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      alert('Gagal logout. Silakan coba lagi.');
    }
  };

  return (
    <div
      className="sidebar d-flex flex-column p-3 text-white bg-dark"
      style={{
        width: '250px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        overflowY: 'auto',
        zIndex: 1030,
      }}
    >
      <h4 className="text-white mb-4">🛠 Admin Panel</h4>
      <ul className="nav nav-pills flex-column mb-auto">
        <li><Link href="/admin" className="nav-link text-white">🏠 Dashboard</Link></li>
        <li><Link href="/admin/news" className="nav-link text-white">📝 Berita</Link></li>
        <li><Link href="/admin/news/category" className="nav-link text-white">📂 Kategori</Link></li>
        <li><Link href="/admin/news/comment" className="nav-link text-white">💬 Komentar</Link></li>
        <li><Link href="/admin/news/validation" className="nav-link text-white">✅ Validasi Berita</Link></li>
        {/*<li><Link href="/admin" className="nav-link text-white">📊 Statistik</Link></li>*/}
        <li><Link href="/" className="nav-link text-white" target="_blank">📊 View Frontend</Link></li>
      </ul>
      <hr />
      <button onClick={handleLogout} className="btn btn-outline-danger mt-auto">🚪 Logout</button>
    </div>
  );
}
