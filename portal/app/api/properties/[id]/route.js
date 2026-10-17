import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Extract the short suffix from the end of the slug
    const identifier = id && id.includes('_') ? id.split('_').pop() : id;

    if (!identifier) {
      return NextResponse.json({ error: 'Property identifier missing' }, { status: 400 });
    }

    // Use LIKE '%identifier' to match the tail-end of the UUID, or match the exact numeric ID
    const [rows] = await pool.query(
      'SELECT * FROM properties WHERE listing_uuid LIKE ? OR id = ?',
      [`%${identifier}`, identifier]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Database error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}