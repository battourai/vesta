import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Fetch property joined with publisher info using listing_uuid (or id depending on your route setup)
    const [rows] = await pool.query(
      `SELECT p.*, pub.publisher_name 
       FROM properties p 
       LEFT JOIN publishers pub ON p.publisher_uuid = pub.publisher_uuid 
       WHERE p.id = ? OR p.listing_uuid = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching property detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}