// app/dashboard/page.js
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

function DashboardContent() {
  const { userId, isSignedIn } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  // Fetch transactions for this user
  useEffect(() => {
    if (!isSignedIn || !userId) {
      setLoading(false);
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/transactions?userId=${encodeURIComponent(userId)}`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('Failed to fetch transactions:', data);
          setError('Failed to load transactions');
          setTransactions([]);
          return;
        }

        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [isSignedIn, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !isSignedIn) {
      setError('You must be signed in to add a transaction.');
      return;
    }

    try {
      setError(null);

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,                 // 👈 send userId to backend
          amount,
          type,
          category,
          description,
          date: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to create transaction:', data);
        setError(data.error || 'Failed to create transaction');
        return;
      }

      // Prepend new transaction to list
      setTransactions((prev) => [data, ...prev]);
      setAmount('');
      setCategory('');
      setDescription('');
      setType('EXPENSE');
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('Failed to create transaction');
    }
  };

  if (!isSignedIn) {
    return <p style={{ color: '#FFEDEE' }}>Please sign in to see your dashboard.</p>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>Dashboard</h1>

      {error && (
        <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</p>
      )}

      {/* Add transaction form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}
      >
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>

        <input
          type="text"
          placeholder="Category (e.g. Food, Rent)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">Add Transaction</button>
      </form>

      {/* Transactions list */}
      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions yet. Add your first one!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {transactions.map((tx) => (
            <li
              key={tx.id}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: '#2a1c1a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  {tx.type === 'EXPENSE' ? '-' : '+'}${tx.amount.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {tx.category} {tx.description ? `· ${tx.description}` : ''}
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                {new Date(tx.date).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}