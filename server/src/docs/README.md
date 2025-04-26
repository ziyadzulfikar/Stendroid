# Server Documentation

This directory contains comprehensive documentation for the server API and implementation details.

## Available Documentation

- [REST API](./api.md) - Complete reference for all REST API endpoints
- [Socket.IO API](./socketAPI.md) - Documentation for WebSocket events and real-time communication
- [Authentication](./auth.md) - Details about the authentication system (Coming soon)

## Getting Started

For new developers, we recommend:

1. Start with the REST API documentation to understand the available endpoints
2. Review the Socket.IO API documentation if you need to work with real-time features
3. Refer to specific implementation documentation as needed

## API Structure

The server provides two main types of APIs:

1. **REST API** (HTTP-based)
   - User management
   - Authentication
   - Posts and content
   - Message history

2. **WebSocket API** (Socket.IO)
   - Real-time messaging
   - Typing indicators
   - User online status
   - Message read receipts

## Implementation Notes

- Server uses Express.js for HTTP endpoints
- Socket.IO for WebSocket functionality
- Prisma as the database ORM
- JWT for authentication
- Winston for logging

## Client Integration

For details on how to integrate with these APIs from the client side, refer to:

- [Client Messaging Documentation](../../client/docs/messaging.md)
- [Client Authentication Documentation](../../client/docs/auth.md)

## Documentation Best Practices

When adding new features:

1. Update the relevant documentation
2. Include JSDoc comments for all functions and events
3. Provide usage examples where applicable
4. Document any breaking changes clearly 