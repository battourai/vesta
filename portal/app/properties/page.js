import Link from 'next/link';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getSearchProperties(searchParams) {
  try {
    const keyword = searchParams?.keyword || '';
    const type = searchParams?.type || '';
    const operation = searchParams?.operation || '';
    const sort = searchParams?.sort || 'latest';

    // JOIN properties with publishers so we can pull publisher_name
    let query = `
      SELECT p.*, pub.publisher_name 
      FROM properties p 
      LEFT JOIN publishers pub ON p.publisher_uuid = pub.publisher_uuid 
      WHERE 1=1
    `;
    let queryParams = [];

    if (keyword) {
      query += ' AND (p.ad_title LIKE ? OR p.ad_description LIKE ? OR p.location_address LIKE ?)';
      queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (type) {
      query += ' AND p.property_type = ?';
      queryParams.push(type);
    }

    if (operation) {
      query += ' AND p.operation = ?';
      queryParams.push(operation);
    }

    if (sort === 'price_asc') {
      query += ' ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY p.price DESC';
    } else {
      query += ' ORDER BY p.id DESC';
    }

    const [rows] = await pool.query(query, queryParams);
    return rows;
  } catch (error) {
    console.error('Failed to fetch search results:', error);
    return [];
  }
}

export default async function PropertiesSearchPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const properties = await getSearchProperties(resolvedParams);

  return (
    <main className="min-h-screen bg-neutral-100 pb-16">
      {/* Top Search Filter Bar Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm py-5 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <form method="GET" action="/properties" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              name="keyword"
              defaultValue={resolvedParams?.keyword || ''}
              placeholder="Search location, title..."
              className="px-3.5 py-2.5 border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            />
            
            <select
              name="operation"
              defaultValue={resolvedParams?.operation || ''}
              className="px-3.5 py-2.5 border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            >
              <option value="">For Sale / Rent</option>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>

            <select
              name="type"
              defaultValue={resolvedParams?.type || ''}
              className="px-3.5 py-2.5 border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            >
              <option value="">All Property Types</option>
              <option value="Condominium">Condominium</option>
              <option value="House">House</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Land">Land</option>
            </select>

            <select
              name="sort"
              defaultValue={resolvedParams?.sort || 'latest'}
              className="px-3.5 py-2.5 border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
            >
              <option value="latest">Sort by: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            <button
              type="submit"
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 px-4 rounded-md text-sm transition flex items-center justify-center gap-1 shadow-sm"
            >
              Search Properties
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area with Split Layout (Listings on left, Banners/Sidebar on right) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Search Results <span className="text-sm font-normal text-neutral-600">({properties.length} properties found)</span>
          </h1>
          <Link href="/" className="text-sm font-medium text-neutral-900 hover:underline">
            &larr; Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Columns: Property Result Rows */}
          <div className="lg:col-span-2 space-y-4">
            {properties.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900">No properties found</h3>
                <p className="text-neutral-600 text-sm mt-1">Try adjusting your filters to find what you are looking for.</p>
                <Link href="/properties" className="mt-4 inline-block bg-neutral-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-neutral-800">
                  Reset Filters
                </Link>
              </div>
            ) : (
              properties.map((property) => {
                const imageUrl = property.image_url || property.main_image;
                const title = property.ad_title || property.title;
                const description = property.ad_description || property.description;

                return (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col sm:flex-row hover:border-neutral-400 hover:shadow-md transition group"
                  >
                    {/* Fixed Height Thumbnail Image Container */}
                    <div className="relative sm:w-64 h-48 bg-neutral-200 flex-shrink-0 overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={title || 'Property image'}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs font-medium">
                          No Image Available
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-neutral-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded">
                        {property.operation || 'For Sale'}
                      </span>
                    </div>

                    {/* Right side: Detailed Information */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 mb-1">
                          <h3 className="text-base font-bold text-neutral-900 group-hover:text-blue-600 transition line-clamp-1">
                            {title}
                          </h3>
                          <div className="text-lg font-extrabold text-neutral-900">
                            PHP {Number(property.price || 0).toLocaleString()}
                          </div>
                        </div>
                        
                        <p className="text-xs text-neutral-500 mb-2">{property.location_address}</p>
                        
                        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-4">
                          {description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Footer / Specs Metadata Row */}
                      <div className="pt-3 border-t border-neutral-100 flex flex-wrap justify-between items-center gap-2 text-xs text-neutral-600 font-medium">
                        <div className="flex items-center gap-3">
                          <span className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded">
                            {property.property_type || 'Property'}
                          </span>
                          <span>🛏️ {property.bedrooms || 0} Beds</span>
                          <span>🛁 {property.bathrooms || 0} Baths</span>
                          <span>📏 {property.floor_area || 0} sqm</span>
                        </div>
                        {/* Display Publisher Name instead of ID */}
                        <span className="text-neutral-500 font-semibold truncate max-w-[150px]">
                          {property.publisher_name || 'Vesta Verified'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Right 1 Column: Sidebar for Related Links & Banners */}
          <div className="space-y-6">
            {/* Promotional Banner Box */}
            <div className="bg-neutral-900 text-white p-6 rounded-xl shadow-sm">
              <h3 className="text-base font-bold mb-2">Looking to sell your property?</h3>
              <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                Reach thousands of active buyers and investors across Southeast Asia by publishing your inventory with Vesta.
              </p>
              <Link
                href="/post-property"
                className="inline-block bg-white text-neutral-900 font-medium px-4 py-2 rounded-lg text-xs hover:bg-neutral-100 transition"
              >
                Post a Listing Now
              </Link>
            </div>

            {/* Related Quick Links / Categories Box */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
              <h4 className="text-sm font-bold text-neutral-900 mb-3">Popular Property Searches</h4>
              <ul className="space-y-2 text-xs text-neutral-600">
                <li>
                  <Link href="/properties?type=Condominium" className="hover:text-neutral-900 hover:underline flex items-center justify-between">
                    <span>Condominiums for Sale</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/properties?type=House" className="hover:text-neutral-900 hover:underline flex items-center justify-between">
                    <span>Houses & Lots</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
                <li>
                  <Link href="/properties?operation=rent" className="hover:text-neutral-900 hover:underline flex items-center justify-between">
                    <span>Properties for Rent</span>
                    <span>&rarr;</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}