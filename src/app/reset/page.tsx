'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPromoCodes() {
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all promo codes? This will replace all existing codes with the new Etsy seller credit codes.')) {
      setIsResetting(true);
      try {
        const response = await fetch('/api/reset-promo-codes', {
          method: 'POST',
        });
        
        const data = await response.json();
        setResult(data);
        
        if (data.success) {
          alert('Promo codes reset successfully!');
          // Refresh the page cache
          router.refresh();
        } else {
          alert('Failed to reset promo codes: ' + data.message);
        }
      } catch (error) {
        console.error('Error resetting promo codes:', error);
        alert('An error occurred while resetting promo codes');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reset Promo Codes</h1>
      <p className="mb-4">
        This will delete all existing promo codes and replace them with the new Etsy seller credit codes.
      </p>
      <button
        onClick={handleReset}
        disabled={isResetting}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {isResetting ? 'Resetting...' : 'Reset Promo Codes'}
      </button>

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
