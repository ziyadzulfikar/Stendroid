# UI Components

This document provides an overview of the key UI components used in the LinkedIn clone application.

## Core Components

### Navbar
The main navigation component that appears on all authenticated pages.

**Location**: `src/components/Navbar.tsx`

**Props**:
- None

**Features**:
- Navigation links to different sections
- Active page highlighting
- Responsive mobile menu

### PostCard
Component for displaying posts in the feed.

**Location**: `src/components/PostCard.tsx`

**Props**:
- `post`: Post data including content, author, and timestamp
- `onLike`: Function to handle like interactions

### MessageBox
Component for displaying a single message in the chat.

**Location**: `src/components/MessageBox.tsx`

**Props**:
- `message`: Message data object
- `isCurrentUser`: Boolean indicating if message is from current user

## Layout Components

### AuthLayout
Layout for authentication pages (login, signup).

**Location**: `src/app/auth/layout.tsx`

### MainLayout
Primary layout for authenticated pages with navigation.

**Location**: `src/app/layout.tsx`

## Page Components

### FeedPage
The main feed page showing posts.

**Location**: `src/app/feed/page.tsx`

### MessagesPage
Messaging interface for conversations.

**Location**: `src/app/messages/page.tsx`

## Form Components

### LoginForm
Form for user login.

**Location**: `src/components/LoginForm.tsx`

### PostForm
Form for creating new posts.

**Location**: `src/components/PostForm.tsx`

## Adding New Components

When creating new components:

1. Follow the existing naming conventions
2. Place components in the appropriate directory
3. Use TypeScript interfaces for props
4. Add appropriate documentation comments
5. Consider reusability and component composition 