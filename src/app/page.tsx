'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LogoutButton from '@/components/LogoutButton';

interface PromoCode {
  id: number;
  code: string;
  discount_percentage: number;
  max_uses: number;
  current_uses: number;
}

interface Token {
  id: number;
  token: string;
  promo_code_id: number;
  used: boolean;
  created_at: string;
}

interface GeneratedToken {
  token: string;
  promo_code_id: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedPromoCode, setSelectedPromoCode] = useState<string>('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<GeneratedToken | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Redirect to login page if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Use window.location for a hard redirect
      window.location.href = '/login';
    }
  }, [status]);

  // Fetch promo codes and tokens on page load
  useEffect(() => {
    async function fetchData() {
      try {
        const [promoCodesResponse, tokensResponse] = await Promise.all([
          fetch('/api/promo-codes'),
          fetch('/api/tokens')
        ]);
        
        if (promoCodesResponse.ok && tokensResponse.ok) {
          const promoCodesData = await promoCodesResponse.json();
          const tokensData = await tokensResponse.json();
          
          setPromoCodes(promoCodesData.promoCodes || []);
          setTokens(tokensData.tokens || []);
        } else {
          console.error('Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Function to generate a new token for a promo code
  const handleGenerateToken = async () => {
    if (!selectedPromoCode) return;
    
    setIsGeneratingToken(true);
    setGeneratedToken(null);
    
    try {
      const response = await fetch('/api/tokens/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promoCodeId: parseInt(selectedPromoCode) }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGeneratedToken({
            token: data.token,
            promo_code_id: parseInt(selectedPromoCode)
          });
          
          // Refresh tokens list
          const tokensResponse = await fetch('/api/tokens');
          if (tokensResponse.ok) {
            const tokensData = await tokensResponse.json();
            setTokens(tokensData.tokens || []);
          }
        } else {
          console.error('Failed to generate token:', data.message);
        }
      } else {
        console.error('Failed to generate token');
      }
    } catch (error) {
      console.error('Error generating token:', error);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  // If still loading or unauthenticated, show loading state
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            {status === 'loading' ? 'Loading...' : 'Redirecting to login...'}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Etsy Promo Code Admin</h1>
          <div className="flex items-center space-x-4">
            {session?.user?.name && (
              <span className="text-gray-600 dark:text-gray-400">
                Welcome, {session.user.name}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promo Codes Section */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Promo Codes</h2>
                <div className="mt-4">
                  {loading ? (
                    <p className="text-gray-500 dark:text-gray-400">Loading promo codes...</p>
                  ) : promoCodes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Discount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uses</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {promoCodes.map((promoCode) => (
                            <tr key={promoCode.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{promoCode.code}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{promoCode.discount_percentage}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {promoCode.current_uses} / {promoCode.max_uses}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No promo codes found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Token Generation Section */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Generate Token</h2>
                <div className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Promo Code
                    </label>
                    <select
                      id="promoCode"
                      value={selectedPromoCode}
                      onChange={(e) => setSelectedPromoCode(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">Select a promo code</option>
                      {promoCodes.map((promoCode) => (
                        <option key={promoCode.id} value={promoCode.id}>
                          {promoCode.code} ({promoCode.discount_percentage}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleGenerateToken}
                    disabled={!selectedPromoCode || isGeneratingToken}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isGeneratingToken ? 'Generating...' : 'Generate Token'}
                  </button>

                  {generatedToken && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md">
                      <p className="text-green-700 dark:text-green-400 font-medium">Token Generated!</p>
                      <p className="mt-1 text-sm text-green-600 dark:text-green-500 break-all">{generatedToken.token}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tokens List Section */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg md:col-span-2">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Tokens</h2>
                <div className="mt-4">
                  {loading ? (
                    <p className="text-gray-500 dark:text-gray-400">Loading tokens...</p>
                  ) : tokens.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Token</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Promo Code ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created At</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {tokens.map((token) => (
                            <tr key={token.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{token.token}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{token.promo_code_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${token.used ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'}`}>
                                  {token.used ? 'Used' : 'Available'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(token.created_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No tokens found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
