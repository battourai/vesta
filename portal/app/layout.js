import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vesta Property Portal",
  description: "Find your dream home or investment property",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* Single Global Header matching your preferred style */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
              Vesta
            </Link>

            {/* Middle Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <Link href="/properties" className="hover:text-gray-900 transition">
                Properties
              </Link>
              <Link href="/agents" className="hover:text-gray-900 transition">
                Agents
              </Link>
              <Link href="/about" className="hover:text-gray-900 transition">
                About
              </Link>
            </nav>

            {/* Right Action Button */}
            <div>
              <Link
                href="/post-property"
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition shadow-sm"
              >
                Post Property
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}