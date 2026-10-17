import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

async function getDashboardData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vesta_session')?.value;

    if (!token) return { user: null, publisher: null, properties: [], inquiries: [] };

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch publisher details, properties, and received inquiries/leads
    const [publisherRows] = await pool.query(
      'SELECT * FROM publishers WHERE publisher_uuid = ?',
      [decoded.publisher_uuid]
    );

    const [propertyRows] = await pool.query(
      'SELECT * FROM properties WHERE publisher_uuid = ? ORDER BY id DESC',
      [decoded.publisher_uuid]
    );

    // Fetch inquiries associated with this publisher's listings
    let inquiryRows = [];
    if (propertyRows.length > 0) {
      const listingUuids = propertyRows.map(p => p.listing_uuid).filter(Boolean);
      if (listingUuids.length > 0) {
        const placeholders = listingUuids.map(() => '?').join(',');
        const [inqs] = await pool.query(
          `SELECT i.*, p.ad_title FROM inquiries i 
           LEFT JOIN properties p ON i.listing_uuid = p.listing_uuid 
           WHERE i.listing_uuid IN (${placeholders}) 
           ORDER BY i.created_at DESC`,
          listingUuids
        );
        inquiryRows = inqs;
      }
    }

    return {
      user: decoded,
      publisher: publisherRows[0] || null,
      properties: propertyRows,
      inquiries: inquiryRows,
    };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    return { user: null, publisher: null, properties: [], inquiries: [] };
  }
}

export default async function DashboardPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams?.tab || 'listings';

  const { user, publisher, properties, inquiries } = await getDashboardData();

  if (!user) {
    return (
      <main className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-neutral-200 text-center max-w-md w-full">
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Unauthorized Access</h1>
          <p className="text-xs text-neutral-600 mb-6">Please sign in to access your publisher dashboard.</p>
          <Link
            href="/login"
            className="inline-block bg-neutral-900 text-white font-medium px-5 py-2.5 rounded-md text-xs hover:bg-neutral-800 transition"
          >
            Sign In Now
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 pb-16">
      {/* Top Header Banner */}
      <div className="bg-white border-b border-neutral-200 py-6 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md">
              Publisher Control Panel
            </span>
            <h1 className="text-2xl font-black text-neutral-900 mt-2">
              {publisher?.publisher_name || 'My Agency Dashboard'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Logged in as <span className="font-medium text-neutral-700">{user.email}</span> ({user.role})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/post-property"
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-4 py-2.5 rounded-md text-xs transition shadow-sm"
            >
              + Post New Listing
            </Link>
            <Link
              href="/"
              className="bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 font-medium px-4 py-2.5 rounded-md text-xs transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left Sidebar Menu */}
          <aside className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-1 lg:sticky lg:top-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-3 pb-2 block">
              Menu Navigation
            </span>
            
            <Link
              href="/dashboard?tab=listings"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'listings'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <span>🏠 My Listings</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'listings' ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                {properties.length}
              </span>
            </Link>

            <Link
              href="/dashboard?tab=inquiries"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'inquiries'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <span>💬 Client Inquiries</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'inquiries' ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                {inquiries.length}
              </span>
            </Link>

            <div className="pt-4 mt-4 border-t border-neutral-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-3 pb-2 block">
                Publisher Info
              </span>
              <div className="px-3 py-2 text-xs text-neutral-600 space-y-1">
                <p className="font-medium text-neutral-900 truncate">{publisher?.publisher_name || 'Independent'}</p>
                <p className="truncate text-neutral-500">{publisher?.email || user.email}</p>
                <p className="text-neutral-500">{publisher?.phone || 'No phone registered'}</p>
              </div>
            </div>
          </aside>

          {/* Right Main Panel */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* TAB 1: LISTINGS IN TABLE LIST VIEW */}
            {activeTab === 'listings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-neutral-900">
                    Active Property Inventory <span className="text-sm font-normal text-neutral-500">({properties.length})</span>
                  </h2>
                </div>

                {properties.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-neutral-200">
                    <h3 className="text-base font-semibold text-neutral-900">No properties posted yet</h3>
                    <p className="text-neutral-500 text-xs mt-1 mb-4">Start showcasing your real estate inventory to potential buyers.</p>
                    <Link
                      href="/post-property"
                      className="inline-block bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-md hover:bg-neutral-800 transition"
                    >
                      Create First Listing
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                            <th className="py-3 px-4">Property</th>
                            <th className="py-3 px-4">Type / Specs</th>
                            <th className="py-3 px-4">Price</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-xs">
                          {properties.map((property) => (
                            <tr key={property.id} className="hover:bg-neutral-50/80 transition">
                              
                              {/* Thumbnail, Title, Location */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-14 bg-neutral-200 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                                    {property.main_image ? (
                                      <img
                                        src={property.main_image}
                                        alt={property.ad_title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[10px]">
                                        No Image
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-neutral-900 block truncate max-w-[220px] sm:max-w-xs">
                                      {property.ad_title}
                                    </span>
                                    <span className="text-neutral-500 text-[11px] block truncate max-w-[220px] sm:max-w-xs">
                                      📍 {property.location_address || 'Unspecified location'}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 font-medium">Ref ID: {property.reference_id || `#${property.id}`}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Specs & Operation */}
                              <td className="py-3.5 px-4 align-middle">
                                <span className="inline-block bg-neutral-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase mb-1">
                                  {property.operation || 'For Sale'}
                                </span>
                                <div className="text-neutral-600 text-[11px] space-x-2">
                                  <span>🛏️ {property.bedrooms || 0}</span>
                                  <span>🛁 {property.bathrooms || 0}</span>
                                  <span>📏 {property.floor_area || 0} sqm</span>
                                </div>
                              </td>

                              {/* Price */}
                              <td className="py-3.5 px-4 align-middle">
                                <span className="font-extrabold text-neutral-900 text-sm block">
                                  ₱{Number(property.price || 0).toLocaleString()}
                                </span>
                              </td>

                              {/* Action Buttons: Edit & View */}
                              <td className="py-3.5 px-4 align-middle text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link
                                    href={`/edit-property/${property.id}`}
                                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold px-3 py-1.5 rounded-md transition text-xs border border-neutral-300"
                                  >
                                    ✏️ Edit
                                  </Link>
                                  <Link
                                    href={`/properties/${property.id}`}
                                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold px-3 py-1.5 rounded-md transition text-xs"
                                  >
                                    View
                                  </Link>
                                </div>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: INQUIRIES / LEADS */}
            {activeTab === 'inquiries' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-neutral-900">
                    Client Inquiries & Leads <span className="text-sm font-normal text-neutral-500">({inquiries.length})</span>
                  </h2>
                </div>

                {inquiries.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-neutral-200">
                    <h3 className="text-base font-semibold text-neutral-900">No inquiries received yet</h3>
                    <p className="text-neutral-500 text-xs mt-1">When buyers fill out the contact form on your listings, they will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div key={inquiry.id} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block">{inquiry.sender_name}</span>
                            <span className="text-xs text-neutral-500">
                              Interested in: <span className="font-medium text-neutral-800">{inquiry.ad_title || 'Property Listing'}</span>
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-400">
                            {new Date(inquiry.created_at).toLocaleDateString()} at {new Date(inquiry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-100 leading-relaxed">
                          "{inquiry.message}"
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                          <a href={`mailto:${inquiry.sender_email}`} className="text-neutral-900 font-semibold hover:underline flex items-center gap-1">
                            ✉️ {inquiry.sender_email}
                          </a>
                          {inquiry.sender_phone && (
                            <a href={`tel:${inquiry.sender_phone}`} className="text-neutral-900 font-semibold hover:underline flex items-center gap-1">
                              📞 {inquiry.sender_phone}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}