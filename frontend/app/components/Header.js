'use client';

import Link from 'next/link';

export default function Header() {
    return (
        <nav className="navbar navbar-expand-lg bg-dark navbar-dark px-3">
            <Link className="navbar-brand" href="/">📰 PORTAL BERITA</Link>
            <div className="d-flex ms-auto">
                <Link className="btn btn-outline-light me-2" href="/login">Login</Link>
                <form role="search" className="d-flex">
                    <input className="form-control me-2" type="search" placeholder="Cari berita..." />
                    <button className="btn btn-outline-light" type="submit">Cari</button>
                </form>
            </div>
        </nav>
    );
}
