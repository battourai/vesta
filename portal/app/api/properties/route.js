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

export async function POST(request) {
  try {
    // 1. Verify the user session cookie and extract publisher_uuid
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

    // 2. Loop through all images from frontend and upload to Cloudinary
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

    // 3. Extract the main cover image and format the rest as a string
    const mainImage = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null;
    const imagesString = uploadedImageUrls.join(',');

    // 4. Insert including publisher_uuid
    const query = `
      INSERT INTO properties (
        publisher_uuid, listing_uuid, reference_id, ad_title, ad_description, operation, property_type, price,
        lot_area, location_address, latitude, longitude, bedrooms, bathrooms, floor_area, 
        contact_phone, contact_email, messenger, main_image, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      publisherUuid, // Tied directly to the logged-in user's publisher profile!
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