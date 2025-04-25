# LinkedIn Clone API

This is the backend server for the LinkedIn Clone application. It provides RESTful APIs for user authentication, posts, and messaging.

## Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies
```bash
npm install
```

3. Set up environment variables in `.env` file
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/linkedin_clone?schema=public"
JWT_SECRET="your-secret-key"
PORT=5001
FRONTEND_URL="http://localhost:3000"
```

4. Generate Prisma client
```bash
npx prisma generate
```

5. Run database migrations
```bash
npx prisma migrate dev
```

6. Start the server
```bash
npm run dev
```

## API Documentation

### Authentication

#### Register a new user
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body**:
```json
{
  "name": "Full Name",
  "email": "email@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "message": "User created successfully",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "email@example.com",
    "name": "Full Name"
  }
}
```
- **CURL Example**:
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
```json
{
  "email": "email@example.com",
  "password": "password123"
}
```
- **Response**:
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "email@example.com",
    "name": "Full Name"
  }
}
```
- **CURL Example**:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Get User Profile
- **URL**: `/api/auth/profile`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Response**:
```json
{
  "id": "user-id",
  "email": "email@example.com",
  "name": "Full Name"
}
```
- **CURL Example**:
```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Users

#### Get All Users
- **URL**: `/api/users`
- **Method**: `GET`
- **Response**: Array of user objects
- **CURL Example**:
```bash
curl -X GET http://localhost:5001/api/users
```

### Messages

#### Send a Message
- **URL**: `/api/messages`
- **Method**: `POST`
- **Request Body**:
```json
{
  "senderId": "sender-user-id",
  "receiverId": "receiver-user-id",
  "content": "Message content"
}
```
- **Response**: The created message object
- **CURL Example**:
```bash
curl -X POST http://localhost:5001/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "actual-sender-id",
    "receiverId": "actual-receiver-id",
    "content": "Hello, this is a test message!"
  }'
```

#### Get Messages for a User
- **URL**: `/api/messages/:userId`
- **Method**: `GET`
- **Path Parameter**: `userId` - ID of the user
- **Response**: Array of message objects
- **CURL Example**:
```bash
curl -X GET http://localhost:5001/api/messages/actual-user-id
```

### Posts

#### Get All Posts
- **URL**: `/api/posts`
- **Method**: `GET`
- **Response**: Array of post objects with author details
- **CURL Example**:
```bash
curl -X GET http://localhost:5001/api/posts
```

### Early Bird Signup

#### Submit Email for Early Access
- **URL**: `/api/early-bird/signup`
- **Method**: `POST`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "userType": "startup" // Optional, can be "startup" or "enterprise", defaults to "startup"
}
```
- **Response** (Success):
```json
{
  "message": "Thank you for your interest! We will notify you when early access is available.",
  "success": true
}
```
- **Response** (Already Registered):
```json
{
  "message": "Email already registered for early access",
  "alreadyRegistered": true
}
```
- **CURL Example**:
```bash
curl -X POST http://localhost:5001/api/early-bird/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "userType": "enterprise"
  }'
```

#### Get All Early Bird Signups (Admin only)
- **URL**: `/api/early-bird`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Response**: Array of early bird signup objects
- **CURL Example**:
```bash
curl -X GET http://localhost:5001/api/early-bird \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Approve Early Bird Access (Admin only)
- **URL**: `/api/early-bird/:id/approve`
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Response**:
```json
{
  "message": "Early bird access approved",
  "signup": {
    "id": "signup-id",
    "email": "user@example.com",
    "approved": true,
    "createdAt": "2023-04-17T14:30:00Z",
    "updatedAt": "2023-04-17T15:00:00Z"
  }
}
```
- **CURL Example**:
```bash
curl -X PUT http://localhost:5001/api/early-bird/signup-id/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Admin Dashboard

These endpoints are protected and require authentication. In a production environment, you should also implement role-based access control to restrict these endpoints to admin users only.

#### Get Dashboard Statistics
- **URL**: `/api/admin/dashboard`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Response**:
```json
{
  "stats": {
    "users": 42,
    "posts": 128,
    "messages": 256,
    "earlyBirdSignups": 30,
    "pendingEarlyBirdSignups": 15
  },
  "lastUpdated": "2023-04-17T15:30:00Z"
}
```

#### Get All Users
- **URL**: `/api/admin/users`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**:
```json
{
  "users": [
    {
      "id": "user-id",
      "name": "User Name",
      "email": "user@example.com",
      "createdAt": "2023-04-15T10:30:00Z",
      "_count": {
        "posts": 5,
        "sentMessages": 10,
        "receivedMessages": 8
      }
    },
    // More users...
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

#### Ban a User
- **URL**: `/api/admin/users/:id/ban`
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Request Body**:
```json
{
  "reason": "Violated terms of service by posting inappropriate content"
}
```
- **Response**:
```json
{
  "message": "User banned successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "banned": true,
    "banReason": "Violated terms of service by posting inappropriate content"
  }
}
```

#### Get All Posts
- **URL**: `/api/admin/posts`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**:
```json
{
  "posts": [
    {
      "id": "post-id",
      "content": "Post content",
      "createdAt": "2023-04-16T11:20:00Z",
      "author": {
        "id": "user-id",
        "name": "User Name",
        "email": "user@example.com"
      }
    },
    // More posts...
  ],
  "pagination": {
    "total": 128,
    "page": 1,
    "limit": 10,
    "pages": 13
  }
}
```

#### Delete a Post
- **URL**: `/api/admin/posts/:id`
- **Method**: `DELETE`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Response**:
```json
{
  "message": "Post deleted successfully"
}
```

#### Get Early Bird Signups
- **URL**: `/api/admin/early-bird`
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `approved`: Filter by approval status (`true` or `false`)
- **Response**:
```json
{
  "signups": [
    {
      "id": "signup-id",
      "email": "user@example.com",
      "approved": false,
      "createdAt": "2023-04-17T09:15:00Z",
      "updatedAt": "2023-04-17T09:15:00Z"
    },
    // More signups...
  ],
  "pagination": {
    "total": 30,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

#### Bulk Approve Early Bird Signups
- **URL**: `/api/admin/early-bird/approve`
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Request Body**:
```json
{
  "ids": ["signup-id-1", "signup-id-2", "signup-id-3"]
}
```
- **Response**:
```json
{
  "message": "3 signups approved successfully",
  "updated": 3
}
```

### Admin API

#### Create Admin User (Temporary endpoint)
- **URL**: `/api/admin/create-admin`
- **Method**: `POST`
- **Security**: Uses a secret key instead of user authentication
- **Request Body**:
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "strong-password",
  "secretKey": "the-admin-secret-key-from-env"
}
```
- **Response**:
```json
{
  "message": "Admin user created successfully",
  "user": {
    "id": "user-id",
    "email": "admin@example.com",
    "name": "Admin Name",
    "isAdmin": true,
    "createdAt": "2023-04-17T14:30:00Z",
    "updatedAt": "2023-04-17T14:30:00Z"
  }
}
```
- **CURL Example**:
```bash
curl -X POST https://your-api-url/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "strong-admin-password",
    "secretKey": "your-admin-secret-key"
  }'
```

#### Toggle User Admin Status (Admin only)
- **URL**: `/api/admin/users/:id/toggle-admin`
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer jwt-token`
- **Request Body**:
```json
{
  "isAdmin": true
}
```
- **Response**:
```json
{
  "message": "User promoted to admin successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "isAdmin": true,
    // Other user fields...
  }
}
```
- **CURL Example**:
```bash
curl -X PUT https://your-api-url/api/admin/users/user-id-here/toggle-admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isAdmin": true
  }'
```

## Common Issues and Troubleshooting

### Invalid Token Error
If you get an "Invalid token" error, make sure you:
1. Are logged in and have a valid token
2. Are including the token in the Authorization header with the "Bearer " prefix
3. The token hasn't expired (tokens expire after 1 day)

### User ID Issues
When sending messages, make sure you're using valid user IDs that exist in your database. You can get the list of users with their IDs using the `/api/users` endpoint.

### Database Connection Issues
If you're having trouble connecting to the database, check:
1. Your PostgreSQL server is running
2. The DATABASE_URL in the .env file is correct
3. The database specified in the URL exists

## Database Schema

### Models

- User - User accounts information
- Post - User posts/updates
- Message - Direct messages between users
- EarlyBirdSignup - Early access registrations with organization type

### User
- id: String (Primary Key)
- email: String (Unique)
- password: String
- name: String
- createdAt: DateTime
- updatedAt: DateTime

### EarlyBirdSignup
- id: String (Primary Key)
- email: String (Unique)
- userType: String ("startup" or "enterprise", defaults to "startup")
- approved: Boolean
- createdAt: DateTime
- updatedAt: DateTime

The `userType` field distinguishes between different types of organizations signing up for early access. In the admin dashboard, this information is displayed with color-coded badges (blue for Enterprise, green for Startup) in a dedicated "User Type" column.

### Post
- id: String (Primary Key)
- content: String
- authorId: String (Foreign Key to User)
- createdAt: DateTime
- updatedAt: DateTime

### Message
- id: String (Primary Key)
- content: String
- senderId: String (Foreign Key to User)
- receiverId: String (Foreign Key to User)
- createdAt: DateTime
- updatedAt: DateTime 

## Application Architecture

### Directory Structure

```
server/
├── prisma/                 # Database schema and migrations
│   └── schema.prisma       # Prisma schema file
├── src/
│   ├── config/             # Configuration files
│   │   └── database.ts     # Database connection setup
│   ├── controllers/        # Request handlers
│   │   ├── authController.ts   # Authentication logic
│   │   └── postController.ts   # Post management logic
│   ├── middleware/         # Express middleware
│   │   └── auth.ts         # Authentication middleware
│   ├── routes/             # API route definitions
│   │   ├── auth.ts         # Authentication routes
│   │   └── index.ts        # Main router that combines all routes
│   └── index.ts            # Entry point - Express app setup
├── .env                    # Environment variables
└── package.json            # Dependencies and scripts
```

### Request Flow

1. **Client Request**: The client sends an HTTP request to the server.
2. **Server Entry Point (`src/index.ts`)**: 
   - The request is received by the Express application.
   - Global middleware (CORS, JSON parsing) is applied.
   - The request is routed to the appropriate router.

3. **Routing (`src/routes/`)**: 
   - The router determines which controller method should handle the request.
   - Authentication middleware may be applied to protected routes.

4. **Authentication Middleware (`src/middleware/auth.ts`)**:
   - For protected routes, verifies the JWT token.
   - Adds the authenticated user's ID to the request.

5. **Controller (`src/controllers/`)**: 
   - Contains the business logic for handling the request.
   - Interacts with the Prisma client to perform database operations.
   - Returns a response to the client.

6. **Database Interaction**:
   - Prisma client executes queries on the PostgreSQL database.
   - Results are returned to the controller.

7. **Response**: 
   - The controller formats the data and returns a JSON response.
   - Error handling middleware catches any errors thrown during the process.

### Authentication Flow

1. **Registration**:
   - User submits registration data.
   - Password is hashed using bcryptjs.
   - User record is created in the database.
   - JWT token is generated and returned to the client.

2. **Login**:
   - User submits email and password.
   - Password is verified against the hashed version in the database.
   - JWT token is generated and returned to the client.

3. **Protected Routes**:
   - Client includes JWT token in the Authorization header.
   - Authentication middleware verifies the token.
   - User ID is extracted from the token and made available to the route handler.

### Data Flow Example: Creating a Post

1. Client sends a POST request to `/api/posts` with post content and JWT token.
2. Authentication middleware verifies the token and extracts the user ID.
3. Post controller creates a new post in the database with the user as the author.
4. Controller returns the created post with author details.

### Error Handling

- Global error handling middleware catches exceptions thrown anywhere in the application.
- Controllers use try/catch blocks to handle specific errors and return appropriate status codes.
- Authentication errors return 401 (Unauthorized) or 403 (Forbidden) status codes.
- Database errors are caught and translated into user-friendly messages. 