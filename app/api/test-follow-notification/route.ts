import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/firebase';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, followerId } = await request.json();

    if (!userId || !followerId) {
      return NextResponse.json({ error: 'userId and followerId are required' }, { status: 400 });
    }

    // Get follower details
    let followerName = 'Someone';
    try {
      const followerDoc = await getDoc(doc(db, 'users', followerId));
      if (followerDoc.exists()) {
        const userData = followerDoc.data();
        followerName = userData.displayName || userData.name || userData.email?.split('@')[0] || 'Someone';
      }
    } catch (error) {
      console.error('Error getting follower details:', error);
    }

    // Create a test follow notification
    const notification = {
      userId,
      type: 'follow',
      title: 'New follower',
      message: `${followerName} started following you`,
      read: false,
      createdAt: Timestamp.now(),
      actionUserId: followerId,
      actionUserName: followerName,
      actionUserAvatar: followerName[0]?.toUpperCase() || 'U',
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);

    return NextResponse.json({ 
      success: true, 
      message: 'Test follow notification created successfully',
      notificationId: docRef.id,
      notification: notification
    });

  } catch (error) {
    console.error('Error creating test follow notification:', error);
    return NextResponse.json(
      { error: 'Failed to create test follow notification' }, 
      { status: 500 }
    );
  }
}
