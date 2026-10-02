import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  try {
    // Await params for Next.js dynamic routing
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const [rows] = await pool.query(
      'SELECT * FROM properties WHERE id = ? OR listing_uuid = ?',
      [id, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Failed to fetch property details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}