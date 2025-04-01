'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LogoutButton from '@/components/LogoutButton';

interface PromoCode {
  id: number;
  code: string;
  description: string;
  discount_percentage?: number;
  max_uses?: number;
  current_uses?: number;
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
  const [newPromoCode, setNewPromoCode] = useState({ code: '', description: '' });
  const [isCreatingPromoCode, setIsCreatingPromoCode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Redirect to login page if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Use window.location for a hard redirect
      window.location.href = '/login';
    }
  }, [status]);

  // Fetch promo codes and tokens on page load
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
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

  // Function to create a new promo code
  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    
    if (!newPromoCode.code || !newPromoCode.description) {
      setCreateError('Code and description are required');
      return;
    }
    
    setIsCreatingPromoCode(true);
    
    try {
      const response = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPromoCode),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCreateSuccess('Promo code created successfully!');
        setNewPromoCode({ code: '', description: '' });
        fetchData(); // Refresh the promo codes list
        setTimeout(() => setShowAddForm(false), 2000); // Hide form after success
      } else {
        setCreateError(data.message || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      setCreateError('An error occurred while creating the promo code');
    } finally {
      setIsCreatingPromoCode(false);
    }
  };

  // Function to delete a promo code
  const handleDeletePromoCode = async (id: number) => {
    setDeleteError('');
    
    if (confirm('Are you sure you want to delete this promo code? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/promo-codes?id=${id}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          fetchData(); // Refresh the promo codes list
        } else {
          setDeleteError(data.message || 'Failed to delete promo code');
          setTimeout(() => setDeleteError(''), 3000);
        }
      } catch (error) {
        console.error('Error deleting promo code:', error);
        setDeleteError('An error occurred while deleting the promo code');
        setTimeout(() => setDeleteError(''), 3000);
      }
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Promo Codes</h2>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {showAddForm ? 'Cancel' : 'Add New Code'}
                  </button>
                </div>

                {/* Add Promo Code Form */}
                {showAddForm && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Add New Promo Code</h3>
                    <form onSubmit={handleCreatePromoCode}>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Code
                          </label>
                          <input
                            type="text"
                            id="code"
                            value={newPromoCode.code}
                            onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g. 9999"
                          />
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                          </label>
                          <input
                            type="text"
                            id="description"
                            value={newPromoCode.description}
                            onChange={(e) => setNewPromoCode({ ...newPromoCode, description: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g. Etsy seller $100 free credit"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          type="submit"
                          disabled={isCreatingPromoCode}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {isCreatingPromoCode ? 'Creating...' : 'Create Promo Code'}
                        </button>
                      </div>
                      
                      {createError && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md text-sm text-red-600 dark:text-red-400">
                          {createError}
                        </div>
                      )}
                      
                      {createSuccess && (
                        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-md text-sm text-green-600 dark:text-green-400">
                          {createSuccess}
                        </div>
                      )}
                    </form>
                  </div>
                )}

                {deleteError && (
                  <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md text-sm text-red-600 dark:text-red-400">
                    {deleteError}
                  </div>
                )}

                <div className="mt-4">
                  {loading ? (
                    <p className="text-gray-500 dark:text-gray-400">Loading promo codes...</p>
                  ) : promoCodes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {promoCodes.map((promoCode) => (
                            <tr key={promoCode.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{promoCode.code}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{promoCode.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <button
                                  onClick={() => handleDeletePromoCode(promoCode.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Delete
                                </button>
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
                          {promoCode.code} ({promoCode.description})
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
