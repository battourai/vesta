'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ImageUploader from '@/components/ImageUploader';

// Dynamically import map to avoid SSR window/DOM mismatch errors in Next.js
const PropertyMap = dynamic(
  () => import('@/components/PropertyMap').then((mod) => mod.default),
  { ssr: false }
);

export default function PostPropertyPage() {
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  
  const [formData, setFormData] = useState({
    reference_id: '',
    operation: 'Sale', // Sale or Rent
    price: '',
    property_type: 'House',
    lot_area: '',
    floor_area: '',
    bedrooms: '',
    bathrooms: '',
    ad_title: '',
    ad_description: '',
    location_address: '',
    latitude: '',
    longitude: '',
    contact_phone: '',
    contact_email: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle typing in the location search bar
  const handleLocationSearchInput = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFormData((prev) => ({ ...prev, location_address: query }));

    if (query.length > 2) {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Geocoding search error:', err);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  // When clicking a suggestion from the dropdown
  const handleSelectLocation = (item) => {
    setSearchQuery(item.display_name);
    setSuggestions([]);
    setFormData((prev) => ({
      ...prev,
      location_address: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  };

  // Set coordinates from map click & auto-fill address (Reverse Geocoding)
  const handleMapCoordinates = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleReverseGeocodeAddress = (addressStr) => {
    setSearchQuery(addressStr);
    setFormData((prev) => ({ ...prev, location_address: addressStr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Auto-generate reference ID if left blank
    let finalRefId = formData.reference_id.trim();
    if (!finalRefId) {
      const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
      finalRefId = `PROP-${Date.now().toString().slice(-6)}-${randomString}`;
    }

    // Grab the base64 string of the first uploaded image to satisfy picture_base64
    const coverImageBase64 = images.length > 0 ? images[0].url : null;

    const submissionData = {
      ...formData,
      reference_id: finalRefId,
      picture_base64: coverImageBase64, // Passes the safe base64 string to the backend
      images: images.map((img, index) => ({
        url: img.url,
        order: index,
        isCover: index === 0 ? 1 : 0,
      })),
    };

    try {
      // Send data to your database API route
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save property to database');
      }

      // Success feedback before redirecting
      alert(`Property successfully published! Ref ID: ${finalRefId}`);

      // Redirect back to the homepage
      router.push('/');
    } catch (err) {
      console.error('Submission error:', err);
      alert(`Database Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg my-10 text-black">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Post a New Property Listing</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Reference ID & 2. Operation (Sale/Rent) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reference ID <span className="text-gray-400 text-xs">(Leave blank to auto-generate)</span>
            </label>
            <input
              type="text"
              name="reference_id"
              value={formData.reference_id}
              onChange={handleChange}
              placeholder="e.g., VESTA-001"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Listing Type (Operation)</label>
            <select
              name="operation"
              value={formData.operation}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
            >
              <option value="Sale">For Sale</option>
              <option value="Rent">For Rent</option>
            </select>
          </div>
        </div>

        {/* 3. Price & 4. Property Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (PHP)</label>
            <input
              type="number"
              name="price"
              required
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g., 5500000"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Property Type</label>
            <select
              name="property_type"
              value={formData.property_type}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
            >
              <option value="House">House</option>
              <option value="Condo">Condo</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Lot">Lot / Land</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
        </div>

        {/* 5. Lot Area, Floor Area, Bedrooms, Bathrooms */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Lot Area (sqm)</label>
            <input
              type="number"
              name="lot_area"
              value={formData.lot_area}
              onChange={handleChange}
              placeholder="e.g., 150"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Floor Area (sqm)</label>
            <input
              type="number"
              name="floor_area"
              value={formData.floor_area}
              onChange={handleChange}
              placeholder="e.g., 120"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              placeholder="e.g., 3"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              placeholder="e.g., 2"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        {/* 6. Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Property Title</label>
          <input
            type="text"
            name="ad_title"
            required
            value={formData.ad_title}
            onChange={handleChange}
            placeholder="e.g., Modern 3BR Townhouse in Parañaque"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* 7. Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="ad_description"
            rows="4"
            value={formData.ad_description}
            onChange={handleChange}
            placeholder="Describe the property features, amenities, neighborhood..."
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          ></textarea>
        </div>

        {/* 8. Location Search Bar + Interactive Map */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Location (Search address or click on the map)</label>
          
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleLocationSearchInput}
              placeholder="Type address or landmark (e.g., Alabang, Muntinlupa)"
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
            
            <ul className={`absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto ${suggestions.length > 0 ? 'block' : 'hidden'}`}>
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectLocation(item)}
                  className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-none text-black"
                >
                  {item.display_name}
                </li>
              ))}
            </ul>
          </div>

          <PropertyMap
            latitude={formData.latitude}
            longitude={formData.longitude}
            setCoordinates={handleMapCoordinates}
            onAddressReverseGeocode={handleReverseGeocodeAddress}
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
            <input
              type="text"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="e.g., +63 917 123 4567"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="e.g., agent@vesta.ph"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        {/* Drag-and-Drop Image Uploader */}
        <ImageUploader images={images} setImages={setImages} />

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition"
        >
          Publish Property Listing
        </button>
      </form>
    </div>
  );
}