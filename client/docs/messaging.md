# Messaging Integration Guide

This guide explains how to integrate the real-time messaging system into client components.

## Architecture Overview

The messaging system uses:
- **REST API** for data retrieval and message history
- **WebSocket** (Socket.IO) for real-time communication
- **React Context** for state management across components

## Prerequisites

- User authentication is properly set up
- Access to user's authentication token
- WebSocket server is running

## Using the Messaging Context

### Setting Up the Provider

The application provides a `MessagingProvider` context that handles WebSocket connections and message state:

```tsx
// In your app layout or page component
import { MessagingProvider } from '../contexts/MessagingContext';

export default function AppLayout({ children }) {
  return (
    <MessagingProvider>
      {children}
    </MessagingProvider>
  );
}
```

### Consuming the Context

```tsx
import { useMessaging } from '../contexts/MessagingContext';

export default function ChatComponent() {
  const { 
    messages,
    sendMessage,
    typingUsers,
    onlineUsers,
    setActiveConversation,
    activeConversation,
    notifyTyping,
    loadingMessages,
    connectionStatus,
    markAsRead
  } = useMessaging();
  
  // Your component logic here
}
```

## Common Tasks

### Starting a Conversation

```tsx
// Set the active conversation to load messages
setActiveConversation(otherUserId);
```

This will:
1. Load the conversation history via REST API
2. Join the WebSocket room for real-time updates
3. Mark received messages as read

### Sending a Message

```tsx
// Send a message to the active conversation
const handleSendMessage = () => {
  if (messageText.trim() && activeConversation) {
    sendMessage(messageText, activeConversation);
    setMessageText(''); // Clear input
  }
};
```

### Displaying Typing Indicators

```tsx
// When input changes
const handleInputChange = (e) => {
  setMessageText(e.target.value);
  
  // Notify the other user that you're typing
  if (activeConversation) {
    notifyTyping(activeConversation);
  }
};

// Display typing indicators
{typingUsers[otherUserId] && (
  <div className="typing-indicator">
    {otherUser.name} is typing...
  </div>
)}
```

### Showing Online Status

```tsx
const isUserOnline = onlineUsers.has(userId);

return (
  <div className={`user-avatar ${isUserOnline ? 'online' : 'offline'}`}>
    <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
    {isUserOnline && <span className="online-indicator" />}
  </div>
);
```

### Marking Messages as Read

```tsx
// Messages are automatically marked as read when loading a conversation
// You can also do it manually:
const handleViewMessage = (messageId) => {
  markAsRead(messageId);
};
```

## Connection Status

Monitor the connection status to provide user feedback:

```tsx
// Show connection status
const getStatusText = () => {
  switch (connectionStatus) {
    case 'connected': return 'Connected';
    case 'connecting': return 'Connecting...';
    case 'reconnecting': return 'Reconnecting...';
    case 'disconnected': return 'Disconnected';
    case 'error': return 'Connection Error';
    default: return '';
  }
};
```

## Handling Conversations

To display and navigate between conversations:

```tsx
// Fetch conversations
const fetchConversations = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    setConversations(data);
  }
};

// Render conversation list
return (
  <div className="conversation-list">
    {conversations.map(conversation => (
      <div 
        key={conversation.id}
        className={`conversation ${activeConversation === conversation.userId ? 'active' : ''}`}
        onClick={() => setActiveConversation(conversation.userId)}
      >
        <div className="avatar">
          <img src={conversation.userAvatar || '/default-avatar.png'} alt={conversation.userName} />
          {onlineUsers.has(conversation.userId) && <span className="online-indicator" />}
        </div>
        <div className="details">
          <h3>{conversation.userName}</h3>
          <p>{conversation.lastMessage}</p>
          <time>{formatTimestamp(conversation.timestamp)}</time>
        </div>
      </div>
    ))}
  </div>
);
```

## Error Handling

```tsx
// Message retry mechanism
const handleRetry = (messageId) => {
  const failedMessage = messages.find(m => m.id === messageId && m.error);
  if (failedMessage) {
    sendMessage(failedMessage.content, failedMessage.receiverId);
  }
};
```

## API Reference

For the complete Socket.IO API reference, see the [Socket API Documentation](../../server/src/docs/socketAPI.md). 