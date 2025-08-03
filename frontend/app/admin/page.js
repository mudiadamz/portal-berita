'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axiosClient from '../lib/axiosClient';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get('/users/stats');
        if (res.data.success) {
          setStats(res.data.data.stats);
        } else {
          setError(res.data.message || 'Gagal memuat statistik');
        }
      } catch (err) {
        console.error(err);
        setError('Terjadi kesalahan saat mengambil data.');
      }

    };

    fetchStats();
  }, []);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar/>

      <main className="p-4 bg-light" style={{ marginLeft: '250px', minHeight: '100vh', width: '100%' }}>
        <h2>Selamat Datang, Admin</h2>
        <p>Gunakan menu di sebelah kiri untuk mengelola konten berita dan pengguna.</p>

        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        )}

        {stats && (
          <div className="card mt-4">
            <div className="card-header">📈 Statistik Pengguna</div>
            <div className="card-body">
              <ul className="list-group">
                <li className="list-group-item">Total Pengguna: {stats.total_users}</li>
                <li className="list-group-item">Admin: {stats.admin_count}</li>
                <li className="list-group-item">Jurnalis: {stats.jurnalis_count}</li>
                <li className="list-group-item">Instansi: {stats.instansi_count}</li>
                <li className="list-group-item">Pengguna: {stats.pengguna_count}</li>
                <li className="list-group-item">Aktif: {stats.active_users}</li>
                <li className="list-group-item">Tidak Aktif: {stats.inactive_users}</li>
                <li className="list-group-item">Enabled: {stats.enabled_users}</li>
                <li className="list-group-item">Disabled: {stats.disabled_users}</li>
                <li className="list-group-item">Pengguna Hari Ini: {stats.users_today}</li>
                <li className="list-group-item">Pengguna Minggu Ini: {stats.users_this_week}</li>
                <li className="list-group-item">Pengguna Bulan Ini: {stats.users_this_month}</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
