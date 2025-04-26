# REST API Documentation

## Overview

This document provides comprehensive documentation for the REST API endpoints available in the LinkedIn clone application. The API follows RESTful principles and uses JSON for data exchange.

## API Versioning & Base URL

The API does not currently use explicit versioning in the URL. Future versions may use the pattern `/api/v2/...` if backward-incompatible changes are introduced.

**Base URL:**
- Development: `http://localhost:5001/api`
- Production: `https://your-app-url.com/api`

## Authentication

Most API endpoints require authentication using a JWT token. Include the token in the request header:

```
Authorization: Bearer <your-token>
```

JWT tokens are obtained by registering or logging in through the authentication endpoints.

**Token Lifetime:** 24 hours (as specified in the server code)

## Common Query Parameters

Many list endpoints support the following query parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number for pagination (starts at 1) | `?page=2` |
| `limit` | Number of items per page | `?limit=20` |
| `search` | Search term for filtering results | `?search=john` |
| `sortBy` | Field to sort by | `?sortBy=createdAt` |
| `sortOrder` | Order of sorting (asc/desc) | `?sortOrder=desc` |

## Endpoints

### Authentication

#### POST /auth/register
Registers a new user.

**Request:**
```json
{
  "name": "Full Name",
  "email": "email@example.com",
  "password": "securepassword",
  "userType": "startup"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-id",
    "name": "Full Name",
    "email": "email@example.com",
    "avatar": null,
    "userType": "startup"
  }
}
```

**curl Example:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Name",
    "email": "email@example.com",
    "password": "securepassword",
    "userType": "startup"
  }'
```

**Client Example:**
```javascript
const registerUser = async (userData) => {
  const response = await fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  return response.json();
};
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `409 Conflict`: Email already in use

#### POST /auth/login
Authenticates a user and returns a token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "jwt-token-string",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "avatar": "profile-image-url"
  }
}
```

**curl Example:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing required fields
- `403 Forbidden`: Account is banned

### Users

#### GET /users
Retrieves a list of users.

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "avatar": "profile-image-url",
    "title": "Professional Title"
  }
]
```

**curl Example:**
```bash
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Client Example:**
```javascript
const getUsers = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5001/api/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
};
```

#### GET /users/search
Searches for users by name or email.

**Authentication:** Required

**Query Parameters:**
- `q` (required): Search query string (minimum 2 characters)

**Response:** `200 OK`
```json
[
  {
    "id": "user-id",
    "name": "User Name", 
    "email": "user@example.com",
    "avatar": "profile-image-url"
  }
]
```

**curl Example:**
```bash
curl -X GET "http://localhost:5001/api/users/search?q=john" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Error Responses:**
- `400 Bad Request`: Search query too short
- `401 Unauthorized`: Not authenticated

### Posts

#### GET /posts
Retrieves a list of posts for the feed.

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "post-id",
    "content": "Post content text",
    "authorId": "author-user-id",
    "createdAt": "2023-06-15T14:30:00Z",
    "author": {
      "id": "author-user-id",
      "name": "Author Name",
      "avatar": "profile-image-url"
    }
  }
]
```

**curl Example:**
```bash
curl -X GET http://localhost:5001/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### GET /posts/:id
Retrieves a specific post.

**Authentication:** Required

**Parameters:**
- `id` (path parameter): The ID of the post to retrieve

**Response:** `200 OK`
```json
{
  "id": "post-id",
  "content": "Post content text",
  "authorId": "author-user-id",
  "createdAt": "2023-06-15T14:30:00Z",
  "author": {
    "id": "author-user-id",
    "name": "Author Name",
    "avatar": "profile-image-url"
  }
}
```

**curl Example:**
```bash
curl -X GET http://localhost:5001/api/posts/post-id \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Error Responses:**
- `404 Not Found`: Post not found
- `401 Unauthorized`: Not authenticated

#### POST /posts
Creates a new post.

**Authentication:** Required

**Request:**
```json
{
  "content": "Post content text"
}
```

**Response:** `201 Created`
```json
{
  "id": "new-post-id",
  "content": "Post content text",
  "authorId": "authenticated-user-id",
  "createdAt": "2023-06-15T14:35:00Z",
  "author": {
    "id": "authenticated-user-id",
    "name": "Author Name",
    "avatar": "profile-image-url"
  }
}
```

**curl Example:**
```bash
curl -X POST http://localhost:5001/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Post content text"
  }'
```

**Client Example:**
```javascript
const createPost = async (content) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5001/api/posts', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });
  
  return response.json();
};
```

#### DELETE /posts/:id
Deletes a post (user can only delete their own posts).

**Authentication:** Required

**Parameters:**
- `id` (path parameter): The ID of the post to delete

**Response:** `200 OK`
```json
{
  "message": "Post deleted successfully"
}
```

**curl Example:**
```bash
curl -X DELETE http://localhost:5001/api/posts/post-id \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Error Responses:**
- `404 Not Found`: Post not found
- `403 Forbidden`: Not authorized to delete this post
- `401 Unauthorized`: Not authenticated

### Messaging

#### GET /messages/:userId
Retrieves message history between the authenticated user and another user.

**Authentication:** Required

**Parameters:**
- `userId` (path parameter): The ID of the other user in the conversation

**Response:** `200 OK`
```json
[
  {
    "id": "message-id",
    "content": "Hello, how are you?",
    "senderId": "sender-user-id",
    "receiverId": "receiver-user-id",
    "createdAt": "2023-06-15T14:30:00Z",
    "read": true,
    "sender": {
      "id": "sender-user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "profile-image-url"
    },
    "receiver": {
      "id": "receiver-user-id",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar": "profile-image-url"
    }
  }
]
```

**curl Example:**
```bash
curl -X GET http://localhost:5001/api/messages/recipient-user-id \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Client Example:**
```javascript
const getMessages = async (userId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5001/api/messages/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
};
```

#### POST /messages
Sends a new message.

**Authentication:** Required

**Request:**
```json
{
  "receiverId": "recipient-user-id",
  "content": "Your message text here"
}
```

**Response:** `201 Created`
```json
{
  "id": "new-message-id",
  "content": "Your message text here",
  "senderId": "authenticated-user-id",
  "receiverId": "recipient-user-id",
  "createdAt": "2023-06-15T14:35:00Z",
  "read": false,
  "sender": {
    "id": "authenticated-user-id",
    "name": "Sender Name",
    "email": "sender@example.com",
    "avatar": "profile-image-url"
  },
  "receiver": {
    "id": "recipient-user-id",
    "name": "Recipient Name",
    "email": "recipient@example.com",
    "avatar": "profile-image-url"
  }
}
```

**curl Example:**
```bash
curl -X POST http://localhost:5001/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "receiverId": "recipient-user-id",
    "content": "Your message text here"
  }'
```

**Error Responses:**
- `400 Bad Request`: Missing receiver ID or content
- `404 Not Found`: Recipient not found
- `401 Unauthorized`: Not authenticated

#### GET /conversations
Retrieves a list of the authenticated user's conversations.

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "conv-user123",
    "userId": "user123",
    "userName": "Jane Smith",
    "userAvatar": "profile-image-url",
    "userEmail": "jane@example.com",
    "lastMessage": "We should meet for coffee",
    "timestamp": "2023-06-15T16:20:00Z",
    "unreadCount": 2
  }
]
```

**curl Example:**
```bash
curl -X GET http://localhost:5001/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Client Example:**
```javascript
const getConversations = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5001/api/conversations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
};
```

### Early Bird Access

#### POST /early-bird/signup
Signs up for early access to the platform.

**Request:**
```json
{
  "email": "user@example.com",
  "userType": "startup"
}
```

**Response:** `201 Created`
```json
{
  "message": "Thank you for your interest! We will notify you when early access is available.",
  "success": true
}
```

**curl Example:**
```bash
curl -X POST http://localhost:5001/api/early-bird/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "userType": "startup"
  }'
```

**Error Responses:**
- `400 Bad Request`: Invalid email format
- `200 OK` with `alreadyRegistered: true`: Email already registered

### Health Check

#### GET /health
Simple health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "ok"
}
```

**curl Example:**
```bash
curl -X GET http://localhost:5001/health
```

## Status Codes

The API uses standard HTTP status codes to indicate the success or failure of requests:

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource was successfully created |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Authenticated but not authorized |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server-side error |

## Error Handling

Error responses have a consistent format:

```json
{
  "message": "Error description"
}
```

## Rate Limiting

The API currently does not implement rate limiting, but it may be added in future versions.

## Using the API with React

### Basic API Hook

```javascript
import { useState, useEffect } from 'react';

export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5001/api${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            ...options.headers
          }
        });
        
        if (!response.ok) {
          throw await response.json();
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [endpoint]);
  
  return { data, loading, error };
};
```

### Example Usage

```jsx
import { useApi } from '../hooks/useApi';

const UserProfile = ({ userId }) => {
  const { data: user, loading, error } = useApi(`/users/${userId}`);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>{user.bio}</p>
    </div>
  );
};
``` 