import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    // Delete the session cookie by setting maxAge to 0 or clearing it
    cookieStore.set({
      name: 'vesta_session',
      value: '',
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Logged out successfully' }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}