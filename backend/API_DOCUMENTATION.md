# Portal Berita API - Complete Documentation

## Overview

The Portal Berita API is a comprehensive news management system with role-based access control, supporting multiple user types and content management workflows.

## User Roles

### 1. **Pengguna** (Regular User)
- Can register and login
- Can view published news articles
- Can comment on articles
- Can bookmark articles
- Can only create draft articles

### 2. **Jurnalis** (Journalist)
- All Pengguna permissions
- Can create, edit, and publish news articles
- Can manage article status workflow
- Can view news statistics
- Can moderate comments

### 3. **Admin** (Administrator)
- All system permissions
- Can manage users, categories, and institution channels
- Can manage all content regardless of ownership
- Can access all statistics and reports
- Can moderate all content

### 4. **Instansi** (Institution)
- Can create and manage institution channels
- Can publish news through their channels (requires review)
- Can manage their own content
- Limited publishing permissions

## Database Schema

### Users Table
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR(100))
- email (VARCHAR(255), UNIQUE)
- password (VARCHAR(255))
- role (ENUM: pengguna, jurnalis, admin, instansi)
- status (ENUM: aktif, nonaktif)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### Kategori Table
```sql
- id (INT, PRIMARY KEY)
- nama (VARCHAR(100), UNIQUE)
- deskripsi (TEXT)
- slug (VARCHAR(120), UNIQUE)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### KanalInstansi Table
```sql
- id (INT, PRIMARY KEY)
- nama (VARCHAR(150))
- deskripsi (TEXT)
- slug (VARCHAR(170), UNIQUE)
- logo_url, website_url (VARCHAR(500))
- contact_email (VARCHAR(255))
- contact_phone (VARCHAR(20))
- alamat (TEXT)
- user_id (INT, FOREIGN KEY)
- is_verified, is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### Berita Table
```sql
- id (INT, PRIMARY KEY)
- judul (VARCHAR(255))
- slug (VARCHAR(280), UNIQUE)
- konten (LONGTEXT)
- ringkasan (TEXT)
- gambar_utama (VARCHAR(500))
- tags (JSON)
- status (ENUM: draft, review, published, rejected, archived)
- tanggal_publikasi (TIMESTAMP)
- views_count, likes_count, shares_count (INT)
- author_id, kategori_id (INT, FOREIGN KEY)
- kanal_instansi_id (INT, FOREIGN KEY, NULLABLE)
- meta_title, meta_description (VARCHAR/TEXT)
- is_featured, is_breaking_news (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### Komentar Table
```sql
- id (INT, PRIMARY KEY)
- konten (TEXT)
- berita_id, user_id (INT, FOREIGN KEY)
- parent_id (INT, FOREIGN KEY, NULLABLE)
- is_approved, is_reported (BOOLEAN)
- likes_count (INT)
- created_at, updated_at (TIMESTAMP)
```

### Bookmark Table
```sql
- id (INT, PRIMARY KEY)
- user_id, berita_id (INT, FOREIGN KEY)
- created_at (TIMESTAMP)
- UNIQUE(user_id, berita_id)
```

## API Endpoints

### Authentication Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/profile` | Get user profile | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |
| POST | `/api/auth/logout` | User logout | Private |

### User Management (Admin Only)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| POST | `/api/users` | Create new user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| GET | `/api/users/stats` | User statistics | Admin |

### Category Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/kategori` | Get all categories | Public |
| GET | `/api/kategori/:id` | Get category by ID | Public |
| GET | `/api/kategori/slug/:slug` | Get category by slug | Public |
| GET | `/api/kategori/active` | Get active categories | Public |
| POST | `/api/kategori` | Create category | Admin |
| PUT | `/api/kategori/:id` | Update category | Admin |
| DELETE | `/api/kategori/:id` | Delete category | Admin |
| GET | `/api/kategori/stats` | Category statistics | Admin |

### Institution Channel Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/kanal-instansi` | Get all channels | Public |
| GET | `/api/kanal-instansi/:id` | Get channel by ID | Public |
| GET | `/api/kanal-instansi/slug/:slug` | Get channel by slug | Public |
| GET | `/api/kanal-instansi/verified` | Get verified channels | Public |
| GET | `/api/kanal-instansi/my-channels` | Get user's channels | Instansi |
| POST | `/api/kanal-instansi` | Create channel | Instansi |
| PUT | `/api/kanal-instansi/:id` | Update channel | Owner/Admin |
| DELETE | `/api/kanal-instansi/:id` | Delete channel | Owner/Admin |
| GET | `/api/kanal-instansi/stats` | Channel statistics | Admin |

### News Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/berita` | Get all news | Public |
| GET | `/api/berita/:id` | Get news by ID | Public |
| GET | `/api/berita/slug/:slug` | Get news by slug | Public |
| GET | `/api/berita/my-articles` | Get user's articles | Private |
| POST | `/api/berita` | Create news | Jurnalis/Admin/Instansi |
| PUT | `/api/berita/:id` | Update news | Author/Admin/Jurnalis |
| PUT | `/api/berita/:id/status` | Update news status | Admin/Jurnalis |
| DELETE | `/api/berita/:id` | Delete news | Author/Admin/Jurnalis |
| GET | `/api/berita/stats` | News statistics | Admin/Jurnalis |

### Comment Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/berita/:id/komentar` | Get comments for news | Public |
| POST | `/api/berita/:id/komentar` | Add comment | Private |
| GET | `/api/komentar/:id` | Get comment by ID | Public |
| PUT | `/api/komentar/:id` | Update comment | Owner/Admin |
| DELETE | `/api/komentar/:id` | Delete comment | Owner/Admin |
| POST | `/api/komentar/:id/report` | Report comment | Private |
| GET | `/api/komentar/my-comments` | Get user's comments | Private |
| GET | `/api/komentar/stats` | Comment statistics | Admin |

### Bookmark Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/bookmarks` | Get user's bookmarks | Private |
| GET | `/api/bookmarks/:id` | Get bookmark by ID | Private |
| POST | `/api/bookmarks` | Add bookmark | Private |
| DELETE | `/api/bookmarks/:id` | Remove bookmark | Private |
| DELETE | `/api/bookmarks/article/:id` | Remove by article ID | Private |
| GET | `/api/bookmarks/check/:id` | Check bookmark status | Private |
| GET | `/api/bookmarks/stats` | Bookmark statistics | Private |
| GET | `/api/bookmarks/by-category` | Bookmarks by category | Private |
| GET | `/api/bookmarks/recent` | Recent bookmarks | Private |
| DELETE | `/api/bookmarks/bulk` | Bulk remove bookmarks | Private |

## Status Workflow

### News Article Status Flow
1. **draft** → **review** → **published**
2. **draft** → **published** (for Jurnalis/Admin)
3. **review** → **rejected** → **draft**
4. **published** → **archived**

### Role-Based Publishing Rules
- **Pengguna**: Can only create drafts
- **Instansi**: Articles go to review before publishing
- **Jurnalis**: Can publish directly
- **Admin**: Full control over all statuses

## Authentication

### JWT Token Structure
```json
{
  "userId": 123,
  "email": "user@example.com",
  "role": "jurnalis",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Authorization Header
```
Authorization: Bearer <jwt-token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Rate Limiting

- **General**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Read Operations**: 200 requests per 15 minutes
- **Write Operations**: 20 requests per 15 minutes

## Default Users (After Migration)

| Email | Password | Role |
|-------|----------|------|
| admin@portalberita.com | Admin123! | admin |
| jurnalis@portalberita.com | Editor123! | jurnalis |
| pengguna@portalberita.com | User123! | pengguna |
| instansi@portalberita.com | Admin123! | instansi |

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run Migrations**
   ```bash
   npm run migrate
   ```

4. **Start Server**
   ```bash
   npm run dev  # Development
   npm start    # Production
   ```

## Testing

### Example API Calls

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@portalberita.com", "password": "Admin123!"}'
```

#### Create News Article
```bash
curl -X POST http://localhost:3000/api/berita \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "judul": "Breaking News Title",
    "slug": "breaking-news-title",
    "konten": "Full article content here...",
    "ringkasan": "Article summary",
    "kategoriId": 1,
    "tags": ["news", "breaking"]
  }'
```

#### Get Published News
```bash
curl http://localhost:3000/api/berita?status=published&limit=10
```

This documentation provides a comprehensive overview of the updated Portal Berita API with all the new features and endpoints implemented.
