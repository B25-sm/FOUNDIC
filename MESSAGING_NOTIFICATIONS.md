# Real-time Messaging & Notifications System

## Overview

This system provides Instagram-like real-time messaging notifications with visual indicators, toast notifications, and sound alerts.

## Features

### 1. Real-time Message Count Updates
- **Message Icon Badge**: Shows unread message count in real-time
- **Persistent Storage**: Uses localStorage to remember last seen message time
- **Smart Counting**: Only counts messages as unread if they're newer than last seen time

### 2. Toast Notifications (Instagram-style)
- **Instant Alerts**: Shows toast notifications for new messages, likes, comments, follows, etc.
- **Visual Design**: Gradient backgrounds with smooth animations
- **Auto-dismiss**: Automatically disappears after 5 seconds
- **Click to Navigate**: Clicking toast navigates to relevant page
- **Progress Bar**: Visual countdown showing time remaining

### 3. Sound Notifications
- **Different Sounds**: Unique audio alerts for different notification types
- **Web Audio API**: Uses modern audio synthesis for pleasant notification sounds
- **Volume Control**: Automatically set to comfortable levels

### 4. Message Dropdown
- **Recent Chats**: Shows recent conversations with unread indicators
- **Real-time Updates**: Updates immediately when new messages arrive
- **Visual Indicators**: Blue dots and highlighting for new messages
- **Quick Navigation**: Direct links to chat page

## How It Works

### Message Count Logic
```typescript
// Messages are considered unread if:
1. Message timestamp > lastSeenMessageTime (from localStorage)
2. Message sender ≠ current user
3. Fallback: Message within last 24 hours
```

### Toast Notification Flow
```typescript
1. New notification created in Firestore
2. ToastNotificationSystem detects change via onSnapshot
3. Checks if notification is recent (within 5 seconds)
4. Shows toast with appropriate styling
5. Plays notification sound
6. Auto-dismisses after 5 seconds
```

### Real-time Updates
- **Firebase Listeners**: All components use `onSnapshot` for real-time updates
- **Optimistic UI**: Updates happen instantly without waiting for server
- **Error Handling**: Graceful fallbacks for offline scenarios

## Components

### ToastNotificationSystem
- **Location**: `client/app/components/ToastNotification.tsx`
- **Purpose**: Shows Instagram-style toast notifications
- **Features**: Animations, sound, click handling, auto-dismiss

### Navbar (Enhanced)
- **Location**: `client/app/components/Navbar.tsx`
- **Enhancements**: Real-time message count, improved dropdown
- **Features**: Persistent unread tracking, visual indicators

### NotificationSound
- **Location**: `client/app/utils/sound.ts`
- **Purpose**: Web Audio API-based notification sounds
- **Features**: Different sounds per type, volume control

### useMessageCount Hook
- **Location**: `client/app/hooks/useMessageCount.ts`
- **Purpose**: Manages persistent message count state
- **Features**: localStorage integration, real-time updates

## Usage

### Creating Notifications
```typescript
import { createMessageNotification } from '../utils/notifications';

// This automatically triggers toast notifications
await createMessageNotification(recipientId, senderId, messageText);
```

### Checking Message Status
```typescript
// The system automatically:
1. Updates unread count when new messages arrive
2. Shows toast notifications for new messages
3. Plays notification sounds
4. Persists last seen time across sessions
```

## User Experience

### Before (Issues)
- ❌ Message count didn't update until page refresh
- ❌ No visual feedback for new messages
- ❌ No sound notifications
- ❌ Had to manually check for new messages

### After (Improvements)
- ✅ Real-time message count updates
- ✅ Instagram-style toast notifications
- ✅ Pleasant notification sounds
- ✅ Visual indicators in message dropdown
- ✅ Persistent unread tracking
- ✅ Smooth animations and transitions

## Technical Details

### Performance Optimizations
- **Debounced Updates**: Prevents excessive re-renders
- **Lazy Loading**: Audio context created only when needed
- **Memory Management**: Proper cleanup of listeners and timeouts
- **Efficient Queries**: Limited result sets with proper indexing

### Browser Compatibility
- **Modern Browsers**: Full feature support
- **Fallbacks**: Graceful degradation for older browsers
- **Mobile Support**: Touch-friendly interactions

### Security
- **User Permissions**: Respects browser notification settings
- **Data Privacy**: No sensitive data in notifications
- **XSS Protection**: Sanitized user input in notifications

## Testing

To test the system:
1. Open two browser windows with different users
2. Send a message from one user to another
3. Observe real-time updates in recipient's window:
   - Toast notification appears
   - Message count updates
   - Sound plays
   - Visual indicators show

## Future Enhancements

- [ ] Push notifications for offline users
- [ ] Notification preferences/settings
- [ ] Rich media in notifications
- [ ] Notification history
- [ ] Group chat notifications
- [ ] Do not disturb mode
