import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Create a test message notification
    const notification = {
      userId,
      type: 'message',
      title: 'New message',
      message: 'Test User: "This is a test message notification!"',
      read: false,
      createdAt: Timestamp.now(),
      actionUserId: 'test-user-id',
      actionUserName: 'Test User',
      actionUserAvatar: 'T',
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);

    return NextResponse.json({ 
      success: true, 
      message: 'Test notification created successfully',
      notificationId: docRef.id,
      notification: notification
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification' }, 
      { status: 500 }
    );
  }
}
