'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileForm({ publisher }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    publisher_name: publisher?.publisher_name || '',
    publisher_address: publisher?.publisher_address || '',
    description: publisher?.description || '',
    logo_url: publisher?.logo_url || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle logo file upload directly to Cloudinary
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', 'vesta_unsigned'); // Your Cloudinary unsigned preset

      const res = await fetch(`https://api.cloudinary.com/v1_1/qq1axqlm/image/upload`, {
        method: 'POST',
        body: data,
      });

      const fileData = await res.json();
      if (!res.ok) {
        throw new Error(fileData.error?.message || 'Failed to upload logo image');
      }

      setFormData((prev) => ({ ...prev, logo_url: fileData.secure_url }));
    } catch (err) {
      console.error('Logo upload error:', err);
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/publisher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccessMsg('Profile updated successfully!');
      router.refresh();
    } catch (err) {
      console.error('Update error:', err);
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 text-black">
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-xs">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-md text-xs">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
            Display Name (Agency / Publisher Name)
          </label>
          <input
            type="text"
            name="publisher_name"
            required
            value={formData.publisher_name}
            onChange={handleChange}
            placeholder="e.g. Vesta Real Estate Elite"
            className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
            Business Address
          </label>
          <input
            type="text"
            name="publisher_address"
            value={formData.publisher_address}
            onChange={handleChange}
            placeholder="e.g. Bonifacio Global City, Taguig, Metro Manila"
            className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
            Agency Bio / Description
          </label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Introduce your agency, experience, and specialization..."
            className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-neutral-900 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1">
            Publisher Logo / Profile Image
          </label>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-300 overflow-hidden shrink-0 flex items-center justify-center">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-neutral-400 font-medium">No Logo</span>
              )}
            </div>
            <div className="space-y-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer"
              />
              {uploading && <p className="text-[10px] text-blue-600">Uploading logo to Cloudinary...</p>}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 flex justify-end">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}