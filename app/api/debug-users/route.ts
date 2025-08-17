import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Get all users
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // Get all chats
    const chatsQuery = query(collection(db, 'chats'));
    const chatsSnapshot = await getDocs(chatsQuery);
    
    const chats = chatsSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    return NextResponse.json({ 
      success: true,
      users: users,
      chats: chats,
      userCount: users.length,
      chatCount: chats.length
    });

  } catch (error) {
    console.error('Error debugging users:', error);
    return NextResponse.json(
      { error: 'Failed to debug users', details: error }, 
      { status: 500 }
    );
  }
}
