import './globals.css';
import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import LogoutButton from '@/components/LogoutButton'; // Import the client button

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

async function getLoggedInPublisher() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('vesta_session')?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.publisher_uuid) return null;

    const [rows] = await pool.query(
      'SELECT publisher_name FROM publishers WHERE publisher_uuid = ?',
      [decoded.publisher_uuid]
    );

    return rows[0] || { publisher_name: 'My Dashboard' };
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
            
            {/* Logo */}
            <Link href="/" className="text-xl font-black tracking-tight text-neutral-900">
              Vesta<span className="text-blue-600">.ph</span>
            </Link>

            {/* Dynamic Navigation Action */}
            <div className="flex items-center gap-3">
              {publisher ? (
                // When Logged In: Show Agency Name Badge + Logout Button
                <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg shadow-sm">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-xs font-semibold text-neutral-800 hover:text-blue-600 transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {publisher.publisher_name}
                  </Link>
                  <span className="text-neutral-300">|</span>
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