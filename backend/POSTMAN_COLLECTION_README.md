# Portal Berita API - Postman Collection

## Overview

This comprehensive Postman collection provides complete API testing coverage for the Portal Berita news management system. It includes all endpoints with proper authentication, role-based access control testing, and realistic data examples.

## Files Included

1. **Portal_Berita_API.postman_collection.json** - Main collection file
2. **Portal_Berita_Environment.postman_environment.json** - Environment variables
3. **POSTMAN_COLLECTION_README.md** - This documentation

## Quick Setup

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import both JSON files:
   - `Portal_Berita_API.postman_collection.json`
   - `Portal_Berita_Environment.postman_environment.json`
4. Select the "Portal Berita Environment" from the environment dropdown

### 2. Configure Base URL

The environment is pre-configured with:
- **baseUrl**: `http://localhost:3000`

Update this if your server runs on a different port or domain.

### 3. Start Your Server

Make sure your Portal Berita API server is running:
```bash
npm run dev
```

## Collection Structure

### 📁 **Authentication**
- Register User
- Login User (Admin, Jurnalis, Instansi roles)
- Get Profile
- Update Profile
- Change Password
- Logout

### 📁 **User Management (Admin Only)**
- Get All Users
- Get User by ID
- Create User
- Update User
- Delete User
- Get User Statistics

### 📁 **Categories (Kategori)**
- Get All Categories
- Get Active Categories
- Get Category by ID/Slug
- Create Category (Admin)
- Update Category (Admin)
- Delete Category (Admin)
- Get Category Statistics (Admin)

### 📁 **Institution Channels (Kanal Instansi)**
- Get All Channels
- Get Verified Channels
- Get Channel by ID/Slug
- Get My Channels (Instansi)
- Create Channel (Instansi)
- Update Channel (Owner/Admin)
- Delete Channel (Owner/Admin)
- Get Channel Statistics (Admin)

### 📁 **News Articles (Berita)**
- Get All News
- Get News by ID/Slug
- Get My Articles
- Create News Article
- Update News Article
- Update News Status
- Delete News Article
- Get News Statistics

### 📁 **Comments (Komentar)**
- Get Comments for News
- Add Comment to News
- Get My Comments
- Update Comment
- Delete Comment
- Report Comment
- Get Comment Statistics (Admin)

### 📁 **Bookmarks**
- Get My Bookmarks
- Add Bookmark
- Check Bookmark Status
- Remove Bookmark
- Get Bookmark Statistics
- Get Bookmarks by Category
- Get Recent Bookmarks
- Bulk Remove Bookmarks

## Authentication Flow

### Step 1: Login with Different Roles

The collection includes login requests for all user roles:

1. **Admin Login**
   - Email: `admin@portalberita.com`
   - Password: `Admin123!`
   - Automatically sets `accessToken` variable

2. **Jurnalis Login**
   - Email: `jurnalis@portalberita.com`
   - Password: `Editor123!`
   - Automatically sets `jurnalisToken` variable

3. **Instansi Login**
   - Email: `instansi@portalberita.com`
   - Password: `Admin123!`
   - Automatically sets `instansiToken` variable

4. **Pengguna Login**
   - Email: `pengguna@portalberita.com`
   - Password: `User123!`

### Step 2: Token Management

The collection automatically:
- Extracts JWT tokens from login responses
- Stores tokens in environment variables
- Uses appropriate tokens for role-based requests

## Testing Different User Roles

### 🔴 **Admin Role**
- Full system access
- Can manage users, categories, channels
- Can moderate all content
- Use `{{accessToken}}` after admin login

### 🟡 **Jurnalis Role**
- Can create and publish news directly
- Can manage article workflow
- Can moderate comments
- Use `{{jurnalisToken}}` after jurnalis login

### 🟢 **Instansi Role**
- Can create institution channels
- Can publish news (goes to review)
- Can manage own content
- Use `{{instansiToken}}` after instansi login

### 🔵 **Pengguna Role**
- Basic user permissions
- Can comment and bookmark
- Can only create drafts
- Use `{{accessToken}}` after pengguna login

## Sample Test Workflow

### 1. **Setup Authentication**
```
1. Run "Login User" (Admin) → Sets accessToken
2. Run "Login as Jurnalis" → Sets jurnalisToken
3. Run "Login as Instansi" → Sets instansiToken
```

### 2. **Test Content Creation**
```
1. Run "Get Active Categories" → See available categories
2. Run "Create News Article (Jurnalis)" → Creates news, sets beritaId
3. Run "Get News by ID" → View created news
4. Run "Add Comment to News" → Add comment to news
5. Run "Add Bookmark" → Bookmark the news
```

### 3. **Test Role-Based Access**
```
1. Try "Create Category" with jurnalisToken → Should fail (403)
2. Try "Create Category" with accessToken (admin) → Should succeed
3. Try "Create Channel" with instansiToken → Should succeed
4. Try "Create Channel" with accessToken (non-instansi) → Should fail
```

## Environment Variables

### **Automatic Variables** (Set by scripts)
- `accessToken` - Current user's JWT token
- `jurnalisToken` - Jurnalis role JWT token
- `instansiToken` - Instansi role JWT token
- `userId` - Current user's ID
- `beritaId` - Created news article ID
- `kategoriId` - Category ID
- `kanalInstansiId` - Institution channel ID

### **Manual Variables** (Pre-configured)
- `baseUrl` - API base URL
- `adminEmail` / `adminPassword` - Admin credentials
- `jurnalisEmail` / `jurnalisPassword` - Jurnalis credentials
- `instansiEmail` / `instansiPassword` - Instansi credentials

## Response Examples

### **Success Response**
```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        "user": {
            "id": 1,
            "name": "Admin User",
            "email": "admin@portalberita.com",
            "role": "admin"
        }
    }
}
```

### **Error Response**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "email",
            "message": "Email is required"
        }
    ]
}
```

## Common HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (Validation Error)
- **401** - Unauthorized (Invalid/Missing Token)
- **403** - Forbidden (Insufficient Permissions)
- **404** - Not Found
- **409** - Conflict (Duplicate Data)
- **429** - Too Many Requests (Rate Limited)
- **500** - Internal Server Error

## Testing Tips

### 1. **Sequential Testing**
Run requests in logical order:
1. Authentication first
2. Create dependencies (categories, channels)
3. Create content (news articles)
4. Test interactions (comments, bookmarks)

### 2. **Role-Based Testing**
Test the same endpoint with different user roles to verify access control:
```
GET /api/berita/stats
- With adminToken → Should work
- With jurnalisToken → Should work  
- With penggunaToken → Should fail (403)
```

### 3. **Data Dependencies**
Some requests depend on data from previous requests:
- Creating news requires valid `kategoriId`
- Adding comments requires valid `beritaId`
- Bookmarking requires published news articles

### 4. **Pagination Testing**
Test pagination parameters:
```
GET /api/berita?page=1&limit=5&sort=created_at&order=desc
```

### 5. **Search and Filtering**
Test search functionality:
```
GET /api/berita?search=teknologi&kategoriId=1&status=published
```

## Troubleshooting

### **401 Unauthorized**
- Check if you're logged in
- Verify token is set in environment
- Token might be expired - login again

### **403 Forbidden**
- Check user role permissions
- Some endpoints require specific roles
- Admin-only endpoints need admin token

### **404 Not Found**
- Check if resource exists
- Verify ID parameters are correct
- Some resources might be soft-deleted

### **429 Rate Limited**
- Wait before making more requests
- Rate limits are per IP/user
- Check rate limiting configuration

## Support

For issues with the API or collection:
1. Check server logs for detailed error messages
2. Verify database is properly migrated
3. Ensure all environment variables are set
4. Check API documentation for endpoint requirements

## Collection Maintenance

To keep the collection updated:
1. Add new endpoints as they're developed
2. Update request examples with realistic data
3. Add response examples for common scenarios
4. Update environment variables as needed
5. Test collection after API changes
