'use client';

import { useEffect } from 'react';
import { signOut } from '@/auth';

export default function SignOutPage() {
  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Error during sign out:', error);
      } finally {
        // Always redirect to login page
        window.location.href = '/login';
      }
    };

    performSignOut();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Signing out...
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please wait while we sign you out.
          </p>
        </div>
      </div>
    </div>
  );
}
