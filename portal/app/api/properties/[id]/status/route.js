import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

export async function PATCH(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vesta_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    const body = await request.json();
    const { action } = body; // 'toggle_publish' or 'soft_delete'

    // Check ownership
    const [rows] = await pool.query('SELECT * FROM properties WHERE id = ? OR listing_uuid = ?', [id, id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const property = rows[0];
    if (decoded.role !== 'admin' && property.publisher_uuid !== decoded.publisher_uuid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'toggle_publish') {
      const newStatus = property.is_published ? 0 : 1;
      await pool.query('UPDATE properties SET is_published = ? WHERE id = ?', [newStatus, property.id]);
      return NextResponse.json({ success: true, is_published: newStatus }, { status: 200 });
    }

    if (action === 'soft_delete') {
      await pool.query(
        'UPDATE properties SET deleted = 1, deleted_at = NOW(), is_published = 0 WHERE id = ?', 
        [property.id]
      );
      return NextResponse.json({ success: true, message: 'Property moved to trash' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Status update error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}