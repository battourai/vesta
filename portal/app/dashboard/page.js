import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

async function getPublisherProperties() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vesta_session')?.value;

    if (!token) return { user: null, properties: [] };

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch publisher details and their specific properties
    const [publisherRows] = await pool.query(
      'SELECT * FROM publishers WHERE publisher_uuid = ?',
      [decoded.publisher_uuid]
    );

    const [propertyRows] = await pool.query(
      'SELECT * FROM properties WHERE publisher_uuid = ? ORDER BY id DESC',
      [decoded.publisher_uuid]
    );

    return {
      user: decoded,
      publisher: publisherRows[0] || null,
      properties: propertyRows,
    };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    return { user: null, publisher: null, properties: [] };
  }
}

export default async function DashboardPage() {
  const { user, publisher, properties } = await getPublisherProperties();

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
      <div className="bg-white border-b border-neutral-200 py-8 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Publisher Dashboard
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

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-neutral-900">
            Your Active Listings <span className="text-sm font-normal text-neutral-500">({properties.length})</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col justify-between group hover:shadow-md transition"
              >
                <div>
                  <div className="relative h-48 bg-neutral-200 overflow-hidden">
                    {property.main_image ? (
                      <img
                        src={property.main_image}
                        alt={property.ad_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                        No Image Available
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-neutral-900/80 text-white text-xs font-semibold px-2 py-0.5 rounded">
                      {property.operation || 'For Sale'}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="text-sm font-bold text-neutral-900 line-clamp-1">
                        {property.ad_title}
                      </h3>
                      <span className="text-sm font-extrabold text-neutral-900 whitespace-nowrap">
                        ₱{Number(property.price || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-3 truncate">{property.location_address}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-600 pt-2 border-t border-neutral-100">
                      <span>🛏️ {property.bedrooms || 0} Beds</span>
                      <span>🛁 {property.bathrooms || 0} Baths</span>
                      <span>📏 {property.floor_area || 0} sqm</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Ref: {property.reference_id}</span>
                  <Link
                    href={`/properties/${property.id}`}
                    className="font-semibold text-neutral-900 hover:underline"
                  >
                    View Listing &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}