import { NextRequest, NextResponse } from 'next/server';
import { admin } from '../../../../src/firebaseAdmin';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  // Firebase Admin SDK does not support verifying passwords directly.
  // In a real-world app, you would:
  // 1. Authenticate on the client with Firebase Auth (get ID token)
  // 2. Send the ID token to this API route
  // 3. Verify the ID token here and set a session/cookie

  // For now, return an error to indicate this limitation
  return NextResponse.json({ message: 'Direct email/password login must be handled on the client. Send an ID token to this endpoint for verification.' }, { status: 400 });
} 