import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vesta_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const body = await request.json();
    const { publisher_name, publisher_address, description, logo_url } = body;

    // Update publisher details in the database
    await pool.query(
      `UPDATE publishers 
       SET publisher_name = ?, publisher_address = ?, description = ?, logo_url = ? 
       WHERE publisher_uuid = ?`,
      [
        publisher_name || null,
        publisher_address || null,
        description || null,
        logo_url || null,
        decoded.publisher_uuid,
      ]
    );

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Publisher update error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}