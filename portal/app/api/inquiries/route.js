import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { listing_uuid, sender_name, sender_email, sender_phone, message } = body;

    if (!listing_uuid || !sender_name || !sender_email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Find the property and its owner's publisher_uuid
    const [properties] = await pool.query(
      'SELECT publisher_uuid FROM properties WHERE listing_uuid = ? OR id = ?',
      [listing_uuid, listing_uuid]
    );

    if (properties.length === 0) {
      return NextResponse.json({ error: 'Property listing not found' }, { status: 404 });
    }

    const publisherUuid = properties[0].publisher_uuid;
    const inquiryUuid = crypto.randomUUID();

    // 2. Insert the inquiry into the database
    const query = `
      INSERT INTO inquiries (
        inquiry_uuid, listing_uuid, publisher_uuid, sender_name, sender_email, sender_phone, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      inquiryUuid,
      listing_uuid,
      publisherUuid,
      sender_name,
      sender_email,
      sender_phone || null,
      message,
    ]);

    return NextResponse.json({ success: true, message: 'Inquiry submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Failed to submit inquiry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}