'use client';

import { logoutAction } from "@/actions";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await logoutAction();
      // Server action handles redirect
    } catch (error) { 
      console.error('Error during sign out:', error);
      // Fallback redirect in case of error during the action call
      window.location.href = '/login?signout=error';
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-md text-sm transition-colors"
    >
      Sign Out
    </button>
  );
}
