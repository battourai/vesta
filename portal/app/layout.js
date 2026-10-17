import './globals.css';
import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import LogoutButton from '@/components/LogoutButton';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

async function getLoggedInPublisher() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vesta_session')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.publisher_uuid) return null;

    const [rows] = await pool.query(
      'SELECT publisher_name, logo_url FROM publishers WHERE publisher_uuid = ?',
      [decoded.publisher_uuid]
    );

    return rows[0] || { publisher_name: 'My Dashboard', logo_url: null };
  } catch (error) {
    return null;
  }
}

export const metadata = {
  title: 'Vesta.ph - Real Estate Portal',
  description: 'Find your next property in the Philippines',
};

export default async function RootLayout({ children }) {
  const publisher = await getLoggedInPublisher();

  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-100 text-neutral-900 font-sans antialiased">
        
        {/* Global Navigation Header */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            
            {/* Logo / Brand Home */}
            <Link href="/" className="text-xl font-black tracking-tight text-neutral-900">
              Vesta<span className="text-blue-600">.ph</span>
            </Link>

            {/* Dynamic Navigation Action */}
            <div className="flex items-center gap-4">
              {publisher ? (
                // When Logged In: Distinct Logo/Agency Link & Separated Logout Button
                <div className="flex items-center gap-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 group py-1 px-2 rounded-lg hover:bg-neutral-50 transition border border-transparent hover:border-neutral-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-300 overflow-hidden shrink-0 flex items-center justify-center">
                      {publisher.logo_url ? (
                        <img src={publisher.logo_url} alt={publisher.publisher_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-600">
                          {publisher.publisher_name?.[0] || 'V'}
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition truncate max-w-[140px]">
                        {publisher.publisher_name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">Dashboard</span>
                    </div>
                  </Link>

                  <div className="h-5 w-[1px] bg-neutral-200"></div>

                  <LogoutButton />
                </div>
              ) : (
                // When Not Logged In: Show Login Link
                <Link
                  href="/login"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-4 py-2 rounded-md text-xs transition shadow-sm"
                >
                  Login
                </Link>
              )}
            </div>

          </div>
        </header>

        {/* Page Content */}
        {children}

      </body>
    </html>
  );
}