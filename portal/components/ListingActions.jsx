'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ListingActions({ property }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleTogglePublish = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${property.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_publish' }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this listing from your dashboard?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${property.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'soft_delete' }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to remove listing');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const slugUrl = property.ad_title
    ? property.ad_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') +
      '_' +
      (property.listing_uuid ? property.listing_uuid.slice(-6) : property.id)
    : property.listing_uuid || property.id;

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      <Link
        href={`/dashboard?tab=edit&id=${property.id}`}
        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold px-2.5 py-1.5 rounded-md transition text-xs border border-neutral-300"
      >
        ✏️ Edit
      </Link>
      
      <Link
        href={`/properties/${slugUrl}`}
        className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-2.5 py-1.5 rounded-md transition text-xs"
      >
        View
      </Link>

      <button
        type="button"
        disabled={loading}
        onClick={handleTogglePublish}
        className={`font-semibold px-2.5 py-1.5 rounded-md transition text-xs border ${
          property.is_published 
            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300' 
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
        }`}
      >
        {property.is_published ? '🔒 Unpublish' : '📢 Publish'}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-2.5 py-1.5 rounded-md transition text-xs border border-red-200"
      >
        🗑️ Delete
      </button>
    </div>
  );
}