'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const PropertyMap = dynamic(() => import('@/components/PropertyMap'), { ssr: false });

export default function PropertyDetailPage() {
  const params = useParams();
  const { id } = params;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    if (!id) return;

    async function fetchProperty() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        const data = await res.json();

        if (res.ok) {
          setProperty(data);
          setSelectedImage(data.main_image || data.image_url || '');
        } else {
          console.error(data.error);
        }
      } catch (err) {
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-neutral-500 font-medium">Loading property details...</div>;
  }

  if (!property) {
    return (
      <div className="text-center py-20 bg-neutral-100 min-h-screen">
        <h3 className="text-lg font-semibold text-neutral-900">Property not found</h3>
        <Link href="/properties" className="mt-4 inline-block bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-neutral-800">
          Back to Search Results
        </Link>
      </div>
    );
  }

  const galleryImages = property.images ? property.images.split(',').filter(Boolean) : [];
  const title = property.ad_title || property.title;
  const description = property.ad_description || property.description;

  return (
    <main className="min-h-screen bg-neutral-100 pb-16">
      
      {/* Top Header Navigation / Back Link Bar (Simplified now since title moved) */}
      <div className="bg-white border-b border-neutral-200 shadow-sm py-4 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Property Listing View</span>
          <Link href="/properties" className="text-sm font-medium text-neutral-900 hover:underline">
            &larr; Back to Results
          </Link>
        </div>
      </div>

      {/* Main Content Area with Split Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left 2 Columns: Photos, Title/Address/RefID Card, Specs, Description, Map */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Image Gallery Box */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
              <div className="w-full h-[400px] bg-neutral-200 rounded-lg overflow-hidden mb-3">
                <img
                  src={selectedImage || property.main_image}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((imgUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`w-20 h-20 rounded-md overflow-hidden border-2 shrink-0 transition ${
                        selectedImage === imgUrl ? 'border-neutral-900 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title, Operation Badge, Ref ID, and Address Card (Placed Directly Below Photo) */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1 rounded uppercase">
                  {property.operation || 'For Sale'}
                </span>
                <span className="text-neutral-400 text-xs font-medium">Ref ID: #{property.id}</span>
              </div>
              
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 leading-snug">
                {title}
              </h1>

              <p className="text-neutral-600 text-xs sm:text-sm flex items-center gap-1.5">
                📍 {property.location_address || 'Location not specified'}
              </p>
            </div>

            {/* Property Specs Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
              <h2 className="text-base font-bold text-neutral-900 mb-4">Property Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-neutral-600">
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400 block mb-1">Bedrooms</span>
                  <span className="text-sm font-bold text-neutral-900">{property.bedrooms || '—'}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400 block mb-1">Bathrooms</span>
                  <span className="text-sm font-bold text-neutral-900">{property.bathrooms || '—'}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400 block mb-1">Lot Area</span>
                  <span className="text-sm font-bold text-neutral-900">{property.lot_area ? `${property.lot_area} sqm` : '—'}</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="text-neutral-400 block mb-1">Floor Area</span>
                  <span className="text-sm font-bold text-neutral-900">{property.floor_area ? `${property.floor_area} sqm` : '—'}</span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
              <h2 className="text-base font-bold text-neutral-900 mb-3">Description</h2>
              <p className="text-xs text-neutral-600 whitespace-pre-line leading-relaxed">
                {description || 'No description provided for this property.'}
              </p>
            </div>

            {/* Map Location Card */}
            {property.latitude && property.longitude && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
                <h2 className="text-base font-bold text-neutral-900 mb-3">Location Map</h2>
                <div className="h-[300px] rounded-lg overflow-hidden border border-neutral-200">
                  <PropertyMap
                    latitude={Number(property.latitude)}
                    longitude={Number(property.longitude)}
                    setCoordinates={() => {}}
                    onAddressReverseGeocode={() => {}}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right 1 Column: Contact Box & Banners */}
          <div className="space-y-6">
            
            {/* Price & Contact Box */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
              <div>
                <span className="text-xs text-neutral-400 block">Asking Price</span>
                <div className="text-2xl font-extrabold text-neutral-900">
                  PHP {Number(property.price || 0).toLocaleString()}
                </div>
              </div>

              <hr className="border-neutral-100" />

              <h3 className="text-sm font-bold text-neutral-900">Contact Agent / Owner</h3>
              <div className="space-y-2 text-xs text-neutral-600">
                <p><strong>Phone:</strong> {property.contact_phone || 'Not provided'}</p>
                <p><strong>Email:</strong> {property.contact_email || 'Not provided'}</p>
                {property.messenger && <p><strong>Messenger:</strong> {property.messenger}</p>}
              </div>

              <button
                onClick={() => alert(`Inquiry sent to listing contact regarding ID: ${property.id}`)}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded-lg font-medium transition text-xs shadow-sm"
              >
                Send Inquiry
              </button>
            </div>

            {/* Additional Banner 1: Post Property / Sell */}
            <div className="bg-neutral-900 text-white p-6 rounded-xl shadow-sm">
              <h3 className="text-base font-bold mb-2">Looking to sell your property?</h3>
              <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                Reach thousands of active buyers and investors by publishing your inventory on Vesta.
              </p>
              <Link
                href="/post-property"
                className="inline-block bg-white text-neutral-900 font-medium px-4 py-2 rounded-lg text-xs hover:bg-neutral-100 transition"
              >
                Post a Listing Now
              </Link>
            </div>

            {/* Additional Banner 2: Support / Help */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-2">
              <h4 className="text-sm font-bold text-neutral-900">Need Expert Guidance?</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Our support team is available to assist you with property verification, documentation, and scheduling viewings.
              </p>
              <span className="text-xs font-semibold text-neutral-900 block pt-1">
                📞 Support Hotline: 0917-111-2233
              </span>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}