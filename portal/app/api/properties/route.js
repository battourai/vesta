import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: Fetch all public properties (automatically filters out soft-deleted and unpublished inventory)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const propertyType = searchParams.get('property_type');

    let query = `
      SELECT p.*, pub.logo_url as publisher_logo, pub.publisher_name 
      FROM properties p
      LEFT JOIN publishers pub ON p.publisher_uuid = pub.publisher_uuid
      WHERE (p.deleted = 0 OR p.deleted IS NULL) 
        AND p.is_published = 1
    `;
    const queryParams = [];

    if (operation) {
      query += ` AND p.operation = ?`;
      queryParams.push(operation);
    }

    if (propertyType) {
      query += ` AND p.property_type = ?`;
      queryParams.push(propertyType);
    }

    query += ` ORDER BY p.id DESC`;

    const [rows] = await pool.query(query, queryParams);
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch public properties:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new property listing (tied to logged-in publisher)
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vesta_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Please log in first' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const publisherUuid = decoded.publisher_uuid;

    if (!publisherUuid) {
      return NextResponse.json({ error: 'Unauthorized: Missing publisher identity' }, { status: 401 });
    }

    const data = await request.json();
    const listingUuid = crypto.randomUUID();

    const uploadedImageUrls = [];

    if (Array.isArray(data.images) && data.images.length > 0) {
      for (const img of data.images) {
        if (img.url && img.url.startsWith('data:image')) {
          const uploadResponse = await cloudinary.uploader.upload(img.url, {
            folder: 'vesta_listings',
          });
          uploadedImageUrls.push(uploadResponse.secure_url);
        } else if (img.url) {
          uploadedImageUrls.push(img.url);
        }
      }
    }

    const mainImage = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null;
    const imagesString = uploadedImageUrls.join(',');

    const query = `
      INSERT INTO properties (
        publisher_uuid, listing_uuid, reference_id, ad_title, ad_description, operation, property_type, price,
        lot_area, location_address, latitude, longitude, bedrooms, bathrooms, floor_area, 
        contact_phone, contact_email, messenger, main_image, images, is_published, deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    `;

    const values = [
      publisherUuid,
      listingUuid,
      data.reference_id || null,
      data.ad_title,
      data.ad_description || null,
      data.operation,
      data.property_type,
      data.price,
      data.lot_area || null,
      data.location_address,
      data.latitude || null,
      data.longitude || null,
      data.bedrooms || 0,
      data.bathrooms || 0,
      data.floor_area || null,
      data.contact_phone || null,
      data.contact_email || null,
      data.messenger || null,
      mainImage,
      imagesString,
    ];

    await pool.query(query, values);

    return NextResponse.json({ success: true, listing_uuid: listingUuid }, { status: 201 });
  } catch (error) {
    console.error('Failed to create property:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}