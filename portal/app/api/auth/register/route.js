import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Your MySQL connection pool

export async function POST(request) {
  try {
    const { email, password, publisherName } = await request.json();

    if (!email || !password || !publisherName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // 1. Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    // 2. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Generate unique UUIDs
    const publisherUuid = randomUUID();
    const userUuid = randomUUID();

    // 4. Insert into your publishers table
    await db.query(
      `INSERT INTO publishers (publisher_uuid, publisher_name) VALUES (?, ?)`,
      [publisherUuid, publisherName]
    );

    // 5. Insert into your users table, linking them via publisher_uuid and assigning 'admin' role
    await db.query(
      `INSERT INTO users (user_uuid, publisher_uuid, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [userUuid, publisherUuid, email, hashedPassword, 'admin']
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Publisher account created successfully!' 
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}