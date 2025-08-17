import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Create a test user for search testing
    const testUser = {
      displayName: 'Sai Mahendra',
      email: 'sai@foundic.com',
      role: 'founder',
      bio: 'Founder of Foundic - Building the future of startup ecosystem',
      location: 'Hyderabad, India',
      company: 'Foundic',
      position: 'CEO & Founder',
      industry: 'Technology',
      skills: ['React', 'Node.js', 'Firebase', 'Startup'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'users'), testUser);

    return NextResponse.json({ 
      success: true, 
      message: 'Test user created successfully',
      userId: docRef.id,
      userData: testUser
    });

  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { error: 'Failed to create test user' }, 
      { status: 500 }
    );
  }
}
