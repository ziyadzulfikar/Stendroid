# Authentication System

This document describes the authentication implementation on the server side.

## Overview

The application uses:
- JWT (JSON Web Tokens) for authentication
- Bcrypt for password hashing
- Express middleware for protecting routes

## JWT Implementation

Authentication tokens are created and verified using the `jsonwebtoken` library:

```javascript
// Creating a token
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verifying a token
jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  if (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Access the userId from decoded.userId
});
```

## Middleware

Protected routes use the `authenticateToken` middleware:

```javascript
// src/middlewares/auth.ts
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    res.locals.userId = user.userId;
    next();
  });
};
```

## Password Management

User passwords are hashed using bcrypt before storing in the database:

```javascript
// Hashing a password
const hashedPassword = await bcrypt.hash(password, 10);

// Comparing passwords
const isValid = await bcrypt.compare(password, user.password);
```

## Authentication Routes

### Login
`POST /api/auth/login` - Authenticates a user and returns a token

### Register
`POST /api/auth/register` - Creates a new user account

### Verify Token
`GET /api/auth/verify` - Verifies if a token is valid

## Session Management

The application uses stateless JWT authentication, but maintains user status through:
- Token expiration (7 days by default)
- User `updatedAt` fields in the database
- WebSocket connection status

## Role-Based Access

The system supports different user roles:
- Regular users
- Admin users

Role-based permission checking is implemented in route handlers:

```javascript
// Check for admin role
const checkAdmin = (req, res, next) => {
  const userId = res.locals.userId;
  
  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Get user from database and check role
  prisma.user.findUnique({
    where: { id: userId }
  }).then(user => {
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    next();
  }).catch(error => {
    next(error);
  });
};
```

## Security Considerations

- Tokens are signed with a secure secret
- Passwords are securely hashed
- Token expiration limits exposure
- HTTP-only cookies could be used for additional security
- HTTPS is enforced in production 