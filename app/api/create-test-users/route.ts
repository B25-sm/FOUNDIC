import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../src/firebase';
import { collection, addDoc, Timestamp, getDocs, query } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // First check if test users already exist
    const usersQuery = query(collection(db, 'users'));
    const existingUsers = await getDocs(usersQuery);
    
    if (existingUsers.docs.length > 5) {
      return NextResponse.json({ 
        success: true,
        message: 'Test users already exist',
        count: existingUsers.docs.length
      });
    }

    // Create multiple test users for chat testing
    const testUsers = [
      {
        displayName: 'Alice Johnson',
        name: 'Alice Johnson',
        email: 'alice@foundic.com',
        role: 'founder',
        bio: 'AI startup founder focused on healthcare solutions',
        location: 'San Francisco, CA',
        company: 'HealthAI Inc',
        position: 'CEO & Founder',
        industry: 'Healthcare Technology',
        skills: ['AI/ML', 'Healthcare', 'Python', 'React'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        displayName: 'Bob Chen',
        name: 'Bob Chen',
        email: 'bob@foundic.com',
        role: 'investor',
        bio: 'Angel investor specializing in early-stage tech startups',
        location: 'New York, NY',
        company: 'Chen Ventures',
        position: 'Managing Partner',
        industry: 'Venture Capital',
        skills: ['Investment', 'Strategy', 'Fintech', 'SaaS'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        displayName: 'Carol Smith',
        name: 'Carol Smith',
        email: 'carol@foundic.com',
        role: 'founder',
        bio: 'Building sustainable fashion marketplace',
        location: 'Austin, TX',
        company: 'EcoWear',
        position: 'Founder',
        industry: 'Fashion & Sustainability',
        skills: ['E-commerce', 'Sustainability', 'Marketing', 'Design'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        displayName: 'David Wilson',
        name: 'David Wilson',
        email: 'david@foundic.com',
        role: 'founder',
        bio: 'EdTech entrepreneur revolutionizing online learning',
        location: 'Seattle, WA',
        company: 'LearnFast',
        position: 'CTO & Co-founder',
        industry: 'Education Technology',
        skills: ['EdTech', 'Full-Stack Development', 'Product Management'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        displayName: 'Emma Rodriguez',
        name: 'Emma Rodriguez',
        email: 'emma@foundic.com',
        role: 'investor',
        bio: 'VC focusing on diverse founders and social impact startups',
        location: 'Los Angeles, CA',
        company: 'Impact Ventures',
        position: 'Principal',
        industry: 'Impact Investing',
        skills: ['Impact Investing', 'Due Diligence', 'Social Impact', 'Diversity'],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    // Add all test users to Firestore
    const promises = testUsers.map(user => 
      addDoc(collection(db, 'users'), user)
    );

    const results = await Promise.all(promises);
    const userIds = results.map(result => result.id);

    return NextResponse.json({ 
      success: true, 
      message: `Created ${testUsers.length} test users successfully`,
      count: testUsers.length,
      userIds: userIds,
      users: testUsers.map((user, index) => ({
        id: userIds[index],
        name: user.displayName,
        email: user.email,
        role: user.role
      }))
    });

  } catch (error) {
    console.error('Error creating test users:', error);
    return NextResponse.json(
      { error: 'Failed to create test users' }, 
      { status: 500 }
    );
  }
}
