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

## Documentation

Comprehensive API documentation is available in the `src/docs` directory:

- [REST API Documentation](src/docs/api.md) - Complete reference for REST endpoints
- [Socket.IO API Documentation](src/docs/socketAPI.md) - WebSocket real-time functionality
- [Authentication Documentation](src/docs/auth.md) - Authentication system details
- [Logging Documentation](src/docs/logging.md) - Logging system and log rotation details

## Server Architecture

The server is built on a modern Node.js architecture that follows these design principles:

- **Modular Design**: Functionality is separated into controllers, routes, and middleware
- **MVC Pattern**: The application follows a Model-View-Controller pattern (minus View for API server)
- **TypeScript**: Strongly typed codebase for enhanced reliability and developer experience
- **Prisma ORM**: Database access layer that provides type-safe database operations
- **REST API**: Well-defined RESTful endpoints for client-server communication
- **WebSockets**: Real-time communication for messaging features
- **JWT Authentication**: Secure authentication using JSON Web Tokens

### Architecture Flow Charts

#### HTTP Request Flow

```
┌─────────────┐      ┌───────────────┐      ┌────────────┐      ┌────────────────┐
│             │      │               │      │            │      │                │
│   Client    │──1──▶│  Express      │──2──▶│  Routes    │──3──▶│  Middleware    │
│   Request   │      │  Application  │      │            │      │  (Auth, etc.)  │
│             │      │               │      │            │      │                │
└─────────────┘      └───────────────┘      └────────────┘      └────────────────┘
                                                                        │
                                                                        │
                                                                        ▼
┌─────────────┐      ┌───────────────┐      ┌────────────┐      ┌────────────────┐
│             │      │               │      │            │      │                │
│   Client    │◀─8───│  Response     │◀─7───│  Routes    │◀─6───│  Controllers   │
│   Browser   │      │  Formatting   │      │            │      │                │
│             │      │               │      │            │      │                │
└─────────────┘      └───────────────┘      └────────────┘      └────────────────┘
                                                                        │
                                                                        │
                                                                        ▼
                                                               ┌────────────────┐
                                                               │                │
                                                               │  Database      │
                                                               │  (Prisma)      │
                                                               │                │
                                                               └────────────────┘
```

1. Client sends HTTP request to the server
2. Express application receives the request
3. Request is routed to the appropriate endpoint
4. Request passes through authentication middleware 
5. Controller processes the request (business logic)
6. Controller sends response back through routes
7. Response is formatted (JSON)
8. Client receives the response

#### WebSocket Communication Flow

```
┌─────────────┐                              ┌─────────────────────┐
│             │                              │                     │
│   Client    │◀────────────────────────────▶│  Socket.IO Server   │
│   Browser   │        Connection            │                     │
│             │                              │                     │
└─────────────┘                              └─────────────────────┘
      │                                                │
      │                                                │
      │ Events                                         │ Processing
      │                                                │
      ▼                                                ▼
┌─────────────┐                              ┌─────────────────────┐
│             │  message:send                │                     │
│  Socket.IO  │ ───────────────────────────▶ │   Event Handlers    │
│   Client    │                              │                     │
│             │ ◀─────────────────────────── │                     │
└─────────────┘  message:received            └─────────────────────┘
                                                      │
                                                      │ Persistence
                                                      │
                                                      ▼
                                             ┌─────────────────────┐
                                             │                     │
                                             │      Database       │
                                             │      (Prisma)       │
                                             │                     │
                                             └─────────────────────┘
```

Key WebSocket events:
- `connection`: Client connects to server
- `disconnect`: Client disconnects
- `message:send`: Client sends a message
- `message:received`: Server confirms message receipt
- `typing`: Client indicates user is typing
- `user:online`: User comes online
- `user:offline`: User goes offline

### Folder Structure

```
server/
├── dist/                  # Compiled TypeScript output
├── logs/                  # Server logs
├── node_modules/          # Dependencies
├── prisma/                # Database schema and migrations
│   ├── migrations/        # Database migration history
│   └── schema.prisma      # Prisma schema definition
├── src/                   # Source code
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── docs/              # API documentation
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models
│   ├── public/            # Static assets
│   ├── routes/            # API route definitions
│   ├── types/             # TypeScript type definitions
│   └── index.ts           # Application entry point
├── .env                   # Environment variables (development)
├── .env.production        # Environment variables (production)
├── createAdmin.js         # Utility to create admin user
├── makeAdmin.js           # Utility to promote user to admin
├── package.json           # Project metadata and dependencies
├── package-lock.json      # Dependency lock file
├── README.md              # Project documentation
└── tsconfig.json          # TypeScript configuration
```

### Key Components

- **Controllers**: Handle request processing and response generation
- **Routes**: Define API endpoints and map them to controllers
- **Middleware**: Process requests before they reach route handlers (authentication, logging, etc.)
- **Prisma Client**: Type-safe database client generated from the schema
- **Socket.IO Server**: Handles real-time messaging and notifications

### Request Flow

1. Client makes HTTP request to an endpoint
2. Request passes through relevant middleware (logging, authentication, etc.)
3. Router directs request to appropriate controller
4. Controller handles business logic, interacts with database via Prisma
5. Controller sends response back to client

### WebSocket Communication Flow

1. Client establishes WebSocket connection
2. Socket middleware authenticates the connection
3. Client and server exchange events (messages, typing status, etc.)
4. Changes are persisted to database when appropriate

## Server Features

- User authentication with JWT
- RESTful API endpoints
- Real-time messaging with Socket.IO
- File uploads and storage
- Database access with Prisma ORM
- Admin features for user management
- Early bird registration system

## Environment Variables

Required environment variables:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/linkedin_clone?schema=public"
JWT_SECRET="your-secret-key"
PORT=5001
FRONTEND_URL="http://localhost:3000"
```

Optional environment variables:

```
# Additional allowed origins for CORS (comma-separated list)
# Example: "https://app1.example.com,https://app2.example.com"
CORS_ALLOWED_ORIGINS=""

# Set NODE_ENV to "development" to allow all origins for CORS during development
# Set to "production" in production environments
NODE_ENV="development"
```

For security reasons, you should replace the placeholder JWT secret with a strong, random string:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

**Important Security Notes:**
- Never commit your `.env` file to version control
- Use different JWT secrets for development and production
- Consider rotating your JWT secret periodically
- In production, make sure to set proper CORS origins to prevent unauthorized access

## Database Schema Overview

The application uses Prisma with the following main models:

- **User** - User accounts and profiles
- **Post** - User posts/updates 
- **Message** - Direct messages between users
- **EarlyBirdSignup** - Early access registrations

For the complete schema definition, see the `prisma/schema.prisma` file.

## Common Issues and Troubleshooting

### Database Connection Issues
If you're having trouble connecting to the database, check:
1. Your PostgreSQL server is running
2. The DATABASE_URL in the .env file is correct
3. The database specified in the URL exists

### Authentication Issues
If you encounter authentication problems:
1. Ensure you're using the correct JWT token format
2. Check that your JWT_SECRET matches between token creation and verification
3. Verify that tokens haven't expired 