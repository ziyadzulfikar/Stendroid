# Authentication System

This document describes how authentication is implemented in the client application.

## Overview

The application uses:
- JWT (JSON Web Tokens) for authentication
- Local storage for token persistence
- Protected routes to restrict access to authenticated users

## User Authentication Flow

1. User enters credentials on the login page
2. Credentials are sent to the server
3. Server validates and returns a JWT token
4. Client stores the token in localStorage
5. Token is included in the Authorization header for subsequent requests

## API Authentication

All authenticated API requests should include:

```
Authorization: Bearer <token>
```

Example of an authenticated fetch request:

```typescript
const fetchData = async (url) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login or handle unauthenticated state
    return;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

## Protected Routes

The application uses Next.js middleware to protect routes:

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  if (!token && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
```

## User Context

The application provides a user context to access the current user:

```typescript
import { useUser } from '../contexts/UserContext';

export default function ProfileComponent() {
  const { user, isLoading } = useUser();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>{user.name}'s Profile</h1>
      {/* Rest of the component */}
    </div>
  );
}
```

## Logout

To log out a user:

```typescript
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login page
  router.push('/auth/login');
};
```

## Security Considerations

- Store tokens in memory for SPA usage
- Implement token refresh mechanism for long sessions
- Set appropriate token expiration
- Use HTTPS for all requests
- Implement CSRF protection
- Clear tokens on logout 