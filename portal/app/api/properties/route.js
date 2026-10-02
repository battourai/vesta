import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const data = await request.json();
    const listingUuid = crypto.randomUUID();

    const uploadedImageUrls = [];

    // 1. Loop through all images from frontend and upload to Cloudinary
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

    // 2. Extract the main cover image (first item) and format the rest as comma-separated string
    const mainImage = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null;
    const imagesString = uploadedImageUrls.join(',');

    const query = `
      INSERT INTO properties (
        listing_uuid, reference_id, ad_title, ad_description, operation, property_type, price,
        lot_area, location_address, latitude, longitude, bedrooms, bathrooms, floor_area, 
        contact_phone, contact_email, messenger, main_image, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
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
      mainImage,     // Maps to 'main_image' column
      imagesString,  // Maps to 'images' column (comma-separated URLs)
    ];

    await pool.query(query, values);

    return NextResponse.json({ success: true, listing_uuid: listingUuid }, { status: 201 });
  } catch (error) {
    console.error('Failed to create property:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("CHECKING KEYS:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secretLength: process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.length : 0
});