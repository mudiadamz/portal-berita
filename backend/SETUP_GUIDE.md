# Portal Berita API - Setup Guide

## 🚀 Quick Setup Instructions

### 1. Prerequisites
- **Node.js** v16 or higher
- **MySQL** v8.0 or higher
- **npm** or **yarn**

### 2. Installation Steps

```bash
# 1. Navigate to project directory
cd portal-berita

# 2. Install dependencies (already done)
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Setup database
npm run migrate

# 5. Start the server
npm run dev  # Development mode
# OR
npm start    # Production mode
```

### 3. Database Configuration

Update your `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=portal_berita
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
```

### 4. Default Users

After running migrations, these users are available:

| Email | Password | Role |
|-------|----------|------|
| admin@portalberita.com | Admin123! | admin |
| editor@portalberita.com | Editor123! | editor |
| user@portalberita.com | User123! | user |

### 5. Testing the API

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Login Example
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@portalberita.com",
    "password": "Admin123!"
  }'
```

#### Create Post Example
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "category": "Technology",
    "tags": ["tech", "api"]
  }'
```

## 📁 Project Structure

```
portal-berita/
├── src/
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── postController.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── validation.js
│   ├── models/             # Database models
│   │   ├── User.js
│   │   └── Post.js
│   ├── routes/             # Route definitions
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   └── index.js
│   └── utils/              # Utility functions
│       ├── auth.js
│       ├── logger.js
│       ├── response.js
│       └── validation.js
├── config/                 # Configuration files
│   ├── app.js
│   ├── database.js
│   └── database-connection.js
├── database/               # Database setup
│   ├── migrations/
│   │   ├── 001_create_users_table.sql
│   │   ├── 002_create_posts_table.sql
│   │   └── migrate.js
│   └── seeds/
├── tests/                  # Test files
│   └── auth.test.js
├── logs/                   # Log files
├── app.js                  # Main application file
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
└── README.md               # Documentation
```

## 🔧 Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run migrate    # Run database migrations
npm test           # Run tests
npm run test:watch # Run tests in watch mode
```

## 🛡️ Security Features

- **JWT Authentication** with access and refresh tokens
- **Role-based Access Control** (Admin, Editor, User)
- **Rate Limiting** to prevent abuse
- **Input Validation** with Joi
- **Password Hashing** with bcrypt
- **Security Headers** with Helmet
- **CORS** configuration

## 📊 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/stats` - User statistics

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/my-posts` - Get user's posts
- `GET /api/posts/categories` - Get categories
- `GET /api/posts/stats` - Post statistics

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env`
   - Kill process using the port

3. **JWT Token Issues**
   - Check JWT_SECRET in `.env`
   - Verify token format in Authorization header

### Logs

Check application logs in:
- `logs/app.log` - General application logs
- `logs/error.log` - Error logs
- Console output in development mode

## 📝 Next Steps

1. **Customize** the API for your specific needs
2. **Add more endpoints** as required
3. **Implement file upload** for post images
4. **Add email notifications**
5. **Set up production deployment**
6. **Add API documentation** with Swagger
7. **Implement caching** with Redis
8. **Add search functionality**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the logs
3. Open an issue in the repository
4. Contact the development team

---

**Happy coding! 🎉**
