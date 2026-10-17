import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    // Extract the short suffix from the end of the slug
    const identifier = id && id.includes('_') ? id.split('_').pop() : id;

    if (!identifier) {
      return NextResponse.json({ error: 'Property identifier missing' }, { status: 400 });
    }

    // 1. Your 100% verified working query for the property
    const [rows] = await pool.query(
      'SELECT * FROM properties WHERE listing_uuid LIKE ? OR id = ?',
      [`%${identifier}`, identifier]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    let property = rows[0];

    // 2. Protected publisher lookup: wrapped in its own try/catch so it can NEVER crash the page
    try {
      if (property.publisher_uuid) {
        const [pubRows] = await pool.query(
          'SELECT * FROM publishers WHERE publisher_uuid = ? OR id = ?',
          [property.publisher_uuid, property.publisher_uuid]
        );
        if (pubRows.length > 0) {
          property.publisher_name = pubRows[0].publisher_name || pubRows[0].name || 'Independent Publisher';
          property.publisher_email = pubRows[0].email || null;
          property.publisher_phone = pubRows[0].phone || null;
        } else {
          property.publisher_name = 'Independent Publisher';
        }
      } else {
        property.publisher_name = 'Independent Publisher';
      }
    } catch (pubErr) {
      // If the publishers table has different columns, fallback gracefully instead of throwing a 500 error
      console.warn('Publisher table lookup skipped:', pubErr.message);
      property.publisher_name = 'Independent Publisher';
    }

    return NextResponse.json(property, { status: 200 });

  } catch (error) {
    console.error('Database error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}