'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ImageUploader from '@/components/ImageUploader';

const PropertyMap = dynamic(
  () => import('@/components/PropertyMap').then((mod) => mod.default),
  { ssr: false }
);

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [images, setImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const [formData, setFormData] = useState({
    reference_id: '',
    operation: 'Sale',
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

  useEffect(() => {
    if (!id) return;

    async function fetchProperty() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        const data = await res.json();

        if (res.ok) {
          setFormData({
            reference_id: data.reference_id || '',
            operation: data.operation || 'Sale',
            price: data.price || '',
            property_type: data.property_type || 'House',
            lot_area: data.lot_area || '',
            floor_area: data.floor_area || '',
            bedrooms: data.bedrooms || '',
            bathrooms: data.bathrooms || '',
            ad_title: data.ad_title || data.title || '',
            ad_description: data.ad_description || data.description || '',
            location_address: data.location_address || '',
            latitude: data.latitude || '',
            longitude: data.longitude || '',
            contact_phone: data.contact_phone || '',
            contact_email: data.contact_email || '',
          });
          setSearchQuery(data.location_address || '');

          // Map existing images with unique IDs so drag-and-drop reordering functions correctly
          if (data.images) {
            const imgList = typeof data.images === 'string' 
              ? data.images.split(',').filter(Boolean)
              : data.images;
            
            setImages(imgList.map((url, index) => ({
              id: `existing-${index}-${Date.now()}`,
              url: typeof url === 'string' ? url : url.url,
              file: null,
            })));
          } else if (data.main_image || data.image_url) {
            setImages([{
              id: `existing-cover-${Date.now()}`,
              url: data.main_image || data.image_url,
              file: null,
            }]);
          }
        } else {
          setErrorMsg(data.error || 'Failed to load property');
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setErrorMsg('Error connecting to server');
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Location search autocomplete
  const handleLocationSearchInput = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setFormData((prev) => ({ ...prev, location_address: query }));

    if (query.length > 2) {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Geocoding error:', err);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

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

  const handleMapCoordinates = (lat, lng) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleReverseGeocodeAddress = (addressStr) => {
    setSearchQuery(addressStr);
    setFormData((prev) => ({ ...prev, location_address: addressStr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      // Upload new images to Cloudinary if they are raw files
      const uploadedImages = [];
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        
        if (img.file) {
          const data = new FormData();
          data.append('file', img.file);
          data.append('upload_preset', 'vesta_unsigned');

          const cloudinaryRes = await fetch(
            `https://api.cloudinary.com/v1_1/qq1axqlm/image/upload`,
            { method: 'POST', body: data }
          );

          const fileData = await cloudinaryRes.json();
          if (!cloudinaryRes.ok) {
            throw new Error(fileData.error?.message || 'Failed to upload image to Cloudinary');
          }

          uploadedImages.push({
            url: fileData.secure_url,
            order: i,
            isCover: i === 0 ? 1 : 0,
          });
        } else {
          uploadedImages.push({
            url: img.url,
            order: i,
            isCover: i === 0 ? 1 : 0,
          });
        }
      }

      const coverImageBase64 = uploadedImages.length > 0 ? uploadedImages[0].url : null;

      const submissionData = {
        ...formData,
        picture_base64: coverImageBase64,
        images: uploadedImages,
      };

      const res = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update property');
      }

      alert('Property updated successfully!');
      router.push('/dashboard?tab=listings');
    } catch (err) {
      console.error('Update error:', err);
      setErrorMsg(err.message || 'An error occurred while saving changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-neutral-500 font-medium">Loading property details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg my-10 text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Property Listing #{id}</h1>
        <Link href="/dashboard?tab=listings" className="text-xs font-semibold text-neutral-600 hover:text-neutral-900">
          &larr; Back to Dashboard
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Reference ID & Operation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference ID</label>
            <input
              type="text"
              name="reference_id"
              value={formData.reference_id}
              onChange={handleChange}
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

        {/* Price & Property Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price (PHP)</label>
            <input
              type="number"
              name="price"
              required
              value={formData.price}
              onChange={handleChange}
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

        {/* Lot Area, Floor Area, Bedrooms, Bathrooms */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Lot Area (sqm)</label>
            <input
              type="number"
              name="lot_area"
              value={formData.lot_area}
              onChange={handleChange}
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
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Property Title</label>
          <input
            type="text"
            name="ad_title"
            required
            value={formData.ad_title}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="ad_description"
            rows="4"
            value={formData.ad_description}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          ></textarea>
        </div>

        {/* Location Search Bar + Map */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleLocationSearchInput}
              placeholder="Type address or landmark"
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
            <ul className={`absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto ${suggestions.length > 0 ? 'block' : 'hidden'}`}>
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectLocation(item)}
                  className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 text-black"
                >
                  {item.display_name}
                </li>
              ))}
            </ul>
          </div>

          <PropertyMap
            latitude={formData.latitude ? Number(formData.latitude) : 14.5995}
            longitude={formData.longitude ? Number(formData.longitude) : 120.9842}
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
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        {/* Image Uploader */}
        <ImageUploader images={images} setImages={setImages} />

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/dashboard?tab=listings"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2.5 rounded-md transition text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-md transition disabled:opacity-50 text-sm"
          >
            {saving ? 'Saving Changes...' : 'Save Property Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}