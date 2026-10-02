import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import db from '@/lib/db'; // Adjust to your MySQL connection utility

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Find user by email in MySQL
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = rows[0];

    // 2. Verify the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 3. Create a secure session payload using your database fields
    const sessionPayload = {
      user_uuid: user.user_uuid,
      publisher_uuid: user.publisher_uuid,
      email: user.email,
      role: user.role, // Using your role column!
    };

    // 4. Sign a JWT token (expires in 7 days)
    const token = jwt.sign(sessionPayload, JWT_SECRET, { expiresIn: '7d' });

    // 5. Save the token in a secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'vesta_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return Response.json({ 
      success: true, 
      message: 'Logged in successfully',
      user: {
        email: user.email,
        role: user.role,
        publisher_uuid: user.publisher_uuid
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}