# Portal Berita API

A scalable Express.js REST API with MySQL database integration, featuring user authentication, role-based access control, and comprehensive content management.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with access and refresh tokens
- 👥 **Role-Based Access Control** - Admin, Editor, and User roles with different permissions
- 📝 **Content Management** - Complete CRUD operations for posts and users
- 🛡️ **Security** - Rate limiting, input validation, CORS, and security headers
- 📊 **Database** - MySQL with connection pooling and migrations
- 📋 **Logging** - Comprehensive logging with Winston
- ✅ **Validation** - Request validation with Joi
- 🚀 **Production Ready** - Error handling, graceful shutdown, and environment configuration

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portal-berita
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your database credentials and configuration.

4. **Database Setup**
   ```bash
   # Create database and run migrations
   npm run migrate
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | User login | Public |
| GET | `/auth/profile` | Get user profile | Private |
| PUT | `/auth/profile` | Update profile | Private |
| PUT | `/auth/change-password` | Change password | Private |
| POST | `/auth/logout` | User logout | Private |

### User Management Endpoints (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/users` | Get all users | Admin |
| GET | `/users/:id` | Get user by ID | Admin |
| POST | `/users` | Create new user | Admin |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| GET | `/users/stats` | User statistics | Admin |

### Post Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/posts` | Get all posts | Public |
| GET | `/posts/:id` | Get post by ID | Public |
| POST | `/posts` | Create new post | Private |
| PUT | `/posts/:id` | Update post | Private |
| DELETE | `/posts/:id` | Delete post | Private |
| GET | `/posts/my-posts` | Get user's posts | Private |
| GET | `/posts/categories` | Get categories | Public |
| GET | `/posts/stats` | Post statistics | Admin/Editor |

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Default Users

After running migrations, these default users are available:

| Email | Password | Role |
|-------|----------|------|
| admin@portalberita.com | Admin123! | admin |
| editor@portalberita.com | Editor123! | editor |
| user@portalberita.com | User123! | user |

## Request/Response Format

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
  "errors": [ ... ]
}
```

## User Roles & Permissions

### Admin
- Full access to all endpoints
- Can manage users and posts
- Can view all statistics

### Editor
- Can create, edit, and publish posts
- Can view post statistics
- Cannot manage users

### User
- Can create and edit own posts (drafts only)
- Can view published posts
- Cannot publish posts directly

## Database Schema

### Users Table
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR(100))
- email (VARCHAR(255), UNIQUE)
- password (VARCHAR(255))
- role (ENUM: admin, editor, user)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Posts Table
```sql
- id (INT, PRIMARY KEY)
- title (VARCHAR(200))
- content (TEXT)
- excerpt (VARCHAR(500))
- category (VARCHAR(50))
- tags (JSON)
- status (ENUM: draft, published, archived)
- author_id (INT, FOREIGN KEY)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run migrate    # Run database migrations
npm test           # Run tests
npm run test:watch # Run tests in watch mode
```

### Project Structure

```
portal-berita/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # Route definitions
│   └── utils/          # Utility functions
├── config/             # Configuration files
├── database/           # Database migrations and seeds
├── logs/              # Log files
├── tests/             # Test files
├── app.js             # Main application file
└── package.json       # Dependencies and scripts
```

## Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=portal_berita
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_SALT_ROUNDS=12
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.
