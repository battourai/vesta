import pool from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getProperties() {
  try {
    const [rows] = await pool.query('SELECT * FROM properties ORDER BY id DESC');
    return rows;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return [];
  }
}

export default async function Home() {
  const properties = await getProperties();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Hero Search Section */}
      <section className="bg-white border-b border-neutral-200 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 mb-4">
            Find your place with clarity.
          </h1>
          <p className="text-neutral-600 mb-8">
            Explore curated properties across prime locations with a seamless search experience.
          </p>
          
          <div className="bg-white p-2 rounded-2xl shadow-lg border border-neutral-200 flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              placeholder="Search location, city, or property..." 
              className="flex-1 px-4 py-3 text-sm focus:outline-none bg-transparent"
            />
            <button className="bg-neutral-900 text-white font-medium px-6 py-3 rounded-xl hover:bg-neutral-800 transition-colors text-sm">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Property Listing Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">Featured Listings</h2>
          <span className="text-xs font-medium px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            🟢 Live Custom Schema Connected
          </span>
        </div>
        
        {properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 text-neutral-500">
            <p className="font-medium text-neutral-700 mb-1">Your custom table is empty.</p>
            <p className="text-xs">Once you insert listings with your new fields (`ad_title`, `location_address`, `price`, etc.), they will render here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link 
                key={property.id} 
                href={`/properties/${property.id}`}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow block cursor-pointer group"
              >
                <div className="h-48 bg-neutral-200 flex items-center justify-center text-neutral-400 text-sm font-medium overflow-hidden">
                  {property.main_image ? (
                    <img 
                      src={property.main_image} 
                      alt={property.ad_title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                  ) : (
                    'Property Image'
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-bold text-neutral-900">
                      PHP {Number(property.price).toLocaleString()}
                    </span>
                    <span className="text-xs uppercase font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                      {property.operation}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-neutral-700 mb-2 group-hover:text-blue-600 transition-colors">
                    {property.ad_title}
                  </div>
                  <div className="text-xs text-neutral-500 mb-4">{property.location_address}</div>
                  <div className="flex gap-4 text-xs font-medium text-neutral-600 border-t border-neutral-100 pt-4">
                    <span>🛏️ {property.bedrooms} Beds</span>
                    <span>🛁 {property.bathrooms} Baths</span>
                    <span>📏 {property.floor_area} sqm</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}