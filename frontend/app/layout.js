// app/layout.js
import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/globals.css'

export const metadata = {
  title: 'BeritaKu',
  description: 'Portal berita Indonesia',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-bs-theme="light">
      <body>{children}</body>
    </html>
  )
}
