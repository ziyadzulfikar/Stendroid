# Socket.IO API Documentation

This document provides a comprehensive guide to the real-time WebSocket API implemented using Socket.IO in our application.

## Connection Setup

To connect to the WebSocket server, the client must provide a `userId` as a query parameter:

```javascript
const socket = io("http://localhost:5001", {
  query: { userId: "user-id-here" }
});
```

## Authentication

After connecting, the client should authenticate to verify their identity:

```javascript
socket.emit("authenticate", userId);
```

## Available Events

### User Status Events

#### Emitted by Client

| Event | Description | Parameters |
|-------|-------------|------------|
| `authenticate` | Authenticate the current user | `userId`: string |
| `userOffline` | Notify that user is going offline | `{ userId: string }` |
| `getOnlineUsers` | Request list of online users | None |

#### Emitted by Server

| Event | Description | Parameters |
|-------|-------------|------------|
| `userStatus` | Notifies about a user's status change | `{ userId: string, status: "online" \| "offline" }` |
| `onlineUsers` | Provides list of online users | `{ users: string[] }` |

### Messaging Events

#### Emitted by Client

| Event | Description | Parameters |
|-------|-------------|------------|
| `privateMessage` | Send a message to another user | `{ content: string, receiverId: string, tempId?: string }` |
| `messageRead` | Mark a message as read | `{ messageId: string }` |

#### Emitted by Server

| Event | Description | Parameters |
|-------|-------------|------------|
| `newMessage` | New message received | Message object |
| `messageDelivered` | Confirms message delivery to an online user | `{ messageId: string, tempId?: string }` |
| `messageSent` | Confirms message was saved (receiver offline) | `{ messageId: string, tempId?: string }` |
| `messageRead` | Notifies that a message was read | `{ messageId: string }` |
| `messageError` | Indicates an error with message processing | `{ error: string, tempId?: string }` |

### Typing Status Events

#### Emitted by Client

| Event | Description | Parameters |
|-------|-------------|------------|
| `typing` | Notify that user is typing | `{ receiverId: string }` |
| `stopTyping` | Notify that user stopped typing | `{ receiverId: string }` |

#### Emitted by Server

| Event | Description | Parameters |
|-------|-------------|------------|
| `userTyping` | Notifies that a user is typing | `{ userId: string }` |
| `stopTyping` | Notifies that a user stopped typing | `{ userId: string }` |

### Chat Room Events

#### Emitted by Client

| Event | Description | Parameters |
|-------|-------------|------------|
| `joinChat` | Join a chat room with another user | `{ userId: string, otherUserId: string }` |
| `leaveChat` | Leave a chat room | `{ userId: string, otherUserId: string }` |

#### Emitted by Server

| Event | Description | Parameters |
|-------|-------------|------------|
| `userJoinedChat` | Notifies that a user joined the chat | `{ userId: string }` |
| `userLeftChat` | Notifies that a user left the chat | `{ userId: string }` |

## Object Types

### Message Object

```typescript
interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
  sender?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}
```

## Implementation Examples

### Connecting to the WebSocket Server

```javascript
import { io } from 'socket.io-client';

// Get user data from localStorage or your auth system
const userData = JSON.parse(localStorage.getItem('user'));
const userId = userData?.id;

if (userId) {
  // Initialize connection
  const socket = io('http://localhost:5001', {
    query: { userId }
  });

  // Handle connection events
  socket.on('connect', () => {
    console.log('Connected to socket server');
    
    // Authenticate
    socket.emit('authenticate', userId);
    
    // Get online users
    socket.emit('getOnlineUsers');
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });
}
```

### Sending and Receiving Messages

```javascript
// Send a message
const sendMessage = (content, receiverId) => {
  // Generate temporary ID for optimistic updates
  const tempId = `temp-${Date.now()}`;
  
  // Add optimistic message to UI
  addMessageToUI({
    id: tempId,
    content,
    senderId: userId,
    receiverId,
    createdAt: new Date().toISOString(),
    pending: true
  });
  
  // Send via socket
  socket.emit('privateMessage', {
    content,
    receiverId,
    tempId
  });
};

// Listen for new messages
socket.on('newMessage', (message) => {
  // Add message to UI or update existing temporary message
  updateMessagesInUI(message);
  
  // If this is a message from someone else to us, mark it as read
  if (message.receiverId === userId && message.senderId === activeConversation) {
    socket.emit('messageRead', { messageId: message.id });
  }
});

// Handle delivery confirmations
socket.on('messageDelivered', ({ messageId, tempId }) => {
  // Update UI to show delivered status
  updateMessageStatus(tempId || messageId, { delivered: true, pending: false });
});

// Handle message errors
socket.on('messageError', ({ error, tempId }) => {
  console.error('Message error:', error);
  // Update UI to show error status
  updateMessageStatus(tempId, { error: true, pending: false });
});
```

### Handling Typing Indicators

```javascript
// Send typing indicator
const handleTyping = (receiverId) => {
  // Only send once every few seconds to avoid flooding
  if (!typingDebounce) {
    socket.emit('typing', { receiverId });
    
    // Set debounce flag
    setTypingDebounce(true);
    
    // Clear debounce after delay
    setTimeout(() => {
      setTypingDebounce(false);
      // Send stop typing if user hasn't typed recently
      if (Date.now() - lastTypedTime > 3000) {
        socket.emit('stopTyping', { receiverId });
      }
    }, 3000);
  }
};

// Listen for typing indicators
socket.on('userTyping', ({ userId }) => {
  // Show typing indicator in UI for this user
  setTypingUsers(prev => ({ ...prev, [userId]: true }));
  
  // Auto-clear after timeout
  clearTimeout(typingTimeouts[userId]);
  const timeout = setTimeout(() => {
    setTypingUsers(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, 3000);
  
  setTypingTimeouts(prev => ({ ...prev, [userId]: timeout }));
});

// Listen for stop typing
socket.on('stopTyping', ({ userId }) => {
  // Clear typing indicator in UI for this user
  setTypingUsers(prev => {
    const next = { ...prev };
    delete next[userId];
    return next;
  });
  
  // Clear any existing timeout
  clearTimeout(typingTimeouts[userId]);
});
```

### Managing Chat Rooms

```javascript
// Join a chat room when starting a conversation
const startConversation = (otherUserId) => {
  // Join the chat room
  socket.emit('joinChat', {
    userId: currentUserId,
    otherUserId
  });
  
  // Set active conversation
  setActiveConversation(otherUserId);
};

// Leave a chat room when done
const leaveConversation = (otherUserId) => {
  socket.emit('leaveChat', {
    userId: currentUserId,
    otherUserId
  });
  
  setActiveConversation(null);
};
```

## Best Practices

1. **Always authenticate** after connecting to ensure secure communication
2. **Use temporary IDs** for messages to support optimistic updates
3. **Handle reconnections** gracefully to maintain user experience
4. **Implement proper error handling** for all socket events
5. **Throttle typing events** to avoid flooding the server
6. **Clear typing indicators** automatically if no stop typing event is received
7. **Join and leave chat rooms** properly to optimize message delivery 