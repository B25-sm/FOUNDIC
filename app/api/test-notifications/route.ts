import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Create sample notifications of all types
    const notifications = [
      {
        userId,
        type: 'like',
        title: 'New like on your post',
        message: 'John Doe liked your post about startup funding',
        read: false,
        createdAt: Timestamp.now(),
        actionUserId: 'sample-user-1',
        actionUserName: 'John Doe',
        actionUserAvatar: 'J',
        postId: 'sample-post-1',
      },
      {
        userId,
        type: 'comment',
        title: 'New comment on your post',
        message: 'Sarah Smith commented: "Great insights! This really helped me understand..."',
        read: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)), // 5 minutes ago
        actionUserId: 'sample-user-2',
        actionUserName: 'Sarah Smith',
        actionUserAvatar: 'S',
        postId: 'sample-post-1',
      },
      {
        userId,
        type: 'follow',
        title: 'New follower',
        message: 'Alex Johnson started following you',
        read: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000)), // 15 minutes ago
        actionUserId: 'sample-user-3',
        actionUserName: 'Alex Johnson',
        actionUserAvatar: 'A',
      },
      {
        userId,
        type: 'pod_interest',
        title: 'Pod interest',
        message: 'Emma Wilson is interested in your pod "Mobile App Development"',
        read: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)), // 30 minutes ago
        actionUserId: 'sample-user-4',
        actionUserName: 'Emma Wilson',
        actionUserAvatar: 'E',
        podId: 'sample-pod-1',
      },
      {
        userId,
        type: 'message',
        title: 'New message',
        message: 'Mike Chen sent you a message: "Hey, I saw your post about the startup incubator..."',
        read: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)), // 1 hour ago
        actionUserId: 'sample-user-5',
        actionUserName: 'Mike Chen',
        actionUserAvatar: 'M',
      },
    ];

    // Add all notifications to Firestore
    const promises = notifications.map(notification => 
      addDoc(collection(db, 'notifications'), notification)
    );

    await Promise.all(promises);

    return NextResponse.json({ 
      success: true, 
      message: `Created ${notifications.length} test notifications`,
      count: notifications.length 
    });

  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json(
      { error: 'Failed to create test notifications' }, 
      { status: 500 }
    );
  }
}
