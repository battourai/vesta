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

  // Inquiry form states with separate country code and phone number fields
  const [inquiryForm, setInquiryForm] = useState({
    sender_name: '',
    sender_email: '',
    country_code: '+63',
    phone_number: '',
    message: 'Hello, I am interested in this property. Please contact me back.',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    // Sanitize local number by removing spaces, dashes, and any non-digit characters, then combine with country code
    const cleanDigits = inquiryForm.phone_number.replace(/\D/g, '');
    const formattedPhone = cleanDigits ? `${inquiryForm.country_code}${cleanDigits}` : null;

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_uuid: property.listing_uuid || property.id,
          sender_name: inquiryForm.sender_name,
          sender_email: inquiryForm.sender_email,
          sender_phone: formattedPhone,
          message: inquiryForm.message.trim() || 'Hello, I am interested in this property. Please contact me back.',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Inquiry sent successfully! The agent will reach out to you soon.');
        setInquiryForm({
          sender_name: '',
          sender_email: '',
          country_code: '+63',
          phone_number: '',
          message: 'Hello, I am interested in this property. Please contact me back.',
        });
      } else {
        alert(data.error || 'Failed to send inquiry');
      }
    } catch (err) {
      console.error('Inquiry error:', err);
    } finally {
      setSubmitting(false);
    }
  };

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
      
      {/* Top Header Navigation / Back Link Bar */}
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
          
          {/* Left 2 Columns: Photos, Title/Address/Price Card, Specs, Description, Map */}
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

            {/* Title, Operation Badge, Ref ID, Address, and Prominent Price Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2 w-full md:w-3/4">
                  <div className="flex items-center gap-3">
                    <span className="bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1 rounded uppercase">
                      {property.operation || 'For Sale'}
                    </span>
                    <span className="text-neutral-400 text-xs font-medium">Ref ID: #{property.id}</span>
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 leading-snug break-words">
                    {title}
                  </h1>

                  <p className="text-neutral-600 text-xs sm:text-sm flex items-center gap-1.5">
                    📍 {property.location_address || 'Location not specified'}
                  </p>
                </div>

                {/* Price Display */}
                <div className="w-full md:w-auto md:text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                  <span className="text-xs text-neutral-400 block font-medium">Asking Price</span>
                  <div className="text-2xl sm:text-3xl font-black text-neutral-900">
                    PHP {Number(property.price || 0).toLocaleString()}
                  </div>
                </div>
              </div>
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
                    key={property.id}
                    latitude={Number(property.latitude)}
                    longitude={Number(property.longitude)}
                    setCoordinates={() => {}}
                    onAddressReverseGeocode={() => {}}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right 1 Column: Publisher Agency & Contact Inquiry Form */}
          <div className="space-y-6">
            
            {/* Contact & Inquiry Box */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm space-y-4">
              
              {/* Publisher Agency Name Badge */}
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-xs">
                <span className="text-neutral-400 block mb-0.5">Listed By Agency</span>
                <span className="font-bold text-neutral-900 text-sm">
                  {property.publisher_name || 'Independent Publisher'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-neutral-900">Contact Agent / Send Inquiry</h3>

              {successMsg ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-medium text-center">
                  {successMsg}
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-600 font-medium mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={inquiryForm.sender_name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, sender_name: e.target.value })}
                      className="w-full border border-neutral-300 rounded-md p-2 text-neutral-900 placeholder-neutral-400 bg-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={inquiryForm.sender_email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, sender_email: e.target.value })}
                      className="w-full border border-neutral-300 rounded-md p-2 text-neutral-900 placeholder-neutral-400 bg-white"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 font-medium mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={inquiryForm.country_code}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, country_code: e.target.value })}
                        className="border border-neutral-300 rounded-md p-2 text-neutral-900 bg-white text-xs font-medium shrink-0"
                      >
                        <option value="+63">🇵🇭 +63</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+82">🇰🇷 +82</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <input
                        type="text"
                        value={inquiryForm.phone_number}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone_number: e.target.value })}
                        className="w-full border border-neutral-300 rounded-md p-2 text-neutral-900 placeholder-neutral-400 bg-white"
                        placeholder="9171112233"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-600 font-medium mb-1">Message</label>
                    <textarea
                      rows="3"
                      required
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      className="w-full border border-neutral-300 rounded-md p-2 text-neutral-900 placeholder-neutral-400 bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-2.5 rounded-lg font-medium transition text-xs shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Inquiry Message'}
                  </button>
                </form>
              )}
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