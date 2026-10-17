'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ListingForm({ initialData = null }) {
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    reference_id: initialData?.reference_id || '',
    ad_title: initialData?.ad_title || '',
    operation: initialData?.operation || 'For Sale',
    property_type: initialData?.property_type || 'House',
    price: initialData?.price || '',
    lot_area: initialData?.lot_area || '',
    floor_area: initialData?.floor_area || '',
    bedrooms: initialData?.bedrooms || '',
    bathrooms: initialData?.bathrooms || '',
    location_address: initialData?.location_address || '',
    ad_description: initialData?.ad_description || '',
    contact_phone: initialData?.contact_phone || '',
    contact_email: initialData?.contact_email || '',
    images: initialData?.images ? initialData.images.split(',').map(url => ({ url })) : [],
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['price', 'lot_area', 'floor_area', 'bedrooms', 'bathrooms'];
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) && value !== '' ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setErrorMsg('');

    try {
      const newImages = [...formData.images];
      for (const file of files) {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', 'vesta_unsigned');

        const res = await fetch('https://api.cloudinary.com/v1_1/qq1axqlm/image/upload', {
          method: 'POST',
          body: data,
        });
        const fileData = await res.json();
        if (!res.ok) throw new Error(fileData.error?.message || 'Upload failed');
        newImages.push({ url: fileData.secure_url });
      }
      setFormData(prev => ({ ...prev, images: newImages }));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const endpoint = isEditing ? `/api/properties/${initialData.id || initialData.listing_uuid}` : '/api/properties';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save listing');

      router.push('/dashboard?tab=listings');
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 text-black">
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Ad Title *</label>
            <input
              type="text"
              name="ad_title"
              required
              value={formData.ad_title}
              onChange={handleChange}
              placeholder="e.g. Modern 3-Bedroom House in BGC"
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Reference ID</label>
            <input
              type="text"
              name="reference_id"
              value={formData.reference_id}
              onChange={handleChange}
              placeholder="e.g. REF-00123"
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Operation *</label>
            <select
              name="operation"
              value={formData.operation}
              onChange={handleChange}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-neutral-900 outline-none"
            >
              <option value="For Sale">For Sale</option>
              <option value="For Rent">For Rent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Property Type *</label>
            <select
              name="property_type"
              value={formData.property_type}
              onChange={handleChange}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-neutral-900 outline-none"
            >
              <option value="House">House</option>
              <option value="Condo">Condo</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Land">Land</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Asking Price (PHP) *</label>
            <input
              type="number"
              name="price"
              required
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g. 12500000"
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Bedrooms</label>
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Bathrooms</label>
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Lot Area (sqm)</label>
            <input
              type="number"
              name="lot_area"
              value={formData.lot_area}
              onChange={handleChange}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Floor Area (sqm)</label>
            <input
              type="number"
              name="floor_area"
              value={formData.floor_area}
              onChange={handleChange}
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Location Address *</label>
          <input
            type="text"
            name="location_address"
            required
            value={formData.location_address}
            onChange={handleChange}
            placeholder="e.g. Bonifacio Global City, Taguig"
            className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Property Description</label>
          <textarea
            name="ad_description"
            rows="5"
            value={formData.ad_description}
            onChange={handleChange}
            placeholder="Describe features, amenities, and highlights..."
            className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Contact Phone</label>
            <input
              type="text"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="e.g. 09171112233"
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Contact Email</label>
            <input
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="e.g. agent@example.com"
              className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">Property Photos</label>
          <div className="flex flex-wrap gap-3 mt-2 mb-3">
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-300 group">
                <img src={img.url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer"
          />
          {uploading && <p className="text-[10px] text-blue-600 mt-1">Uploading images to Cloudinary...</p>}
        </div>

        <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard?tab=listings')}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold px-5 py-2.5 rounded-lg text-xs transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition disabled:opacity-50"
          >
            {submitting ? 'Saving Listing...' : isEditing ? 'Update Listing' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}