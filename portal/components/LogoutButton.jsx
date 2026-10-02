'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-semibold text-neutral-500 hover:text-red-600 transition px-2 py-1"
      title="Log out of account"
    >
      Logout
    </button>
  );
}