'use client';

import './dashboard.css';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

function formatCurrency(value) {
  if (isNaN(value)) return '$0.00';
  return `$${value.toFixed(2)}`;
}

function getMonthYear(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const { userId, isSignedIn } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');

  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txError, setTxError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catError, setCatError] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [mode, setMode] = useState('EXPENSE'); // EXPENSE | INCOME
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  // Fetch transactions (from Python backend)
  useEffect(() => {
    if (!isSignedIn || !userId) {
      setLoadingTx(false);
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoadingTx(true);
        setTxError(null);

        const res = await fetch(
          `${API_BASE}/transactions?userId=${encodeURIComponent(userId)}`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('Failed to load transactions:', data);
          setTxError('Failed to load transactions');
          setTransactions([]);
          return;
        }

        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error('Error loading transactions:', err);
        setTxError('Failed to load transactions');
      } finally {
        setLoadingTx(false);
      }
    };

    fetchTransactions();
  }, [isSignedIn, userId]);

  // Fetch categories (from Python backend)
  useEffect(() => {
    if (!isSignedIn || !userId) {
      setLoadingCats(false);
      setCategories([]);
      return;
    }

    const fetchCategories = async () => {
      try {
        setLoadingCats(true);
        setCatError(null);

        const res = await fetch(
          `${API_BASE}/categories?userId=${encodeURIComponent(userId)}`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('Failed to load categories:', data);
          setCatError('Failed to load categories');
          setCategories([]);
          return;
        }

        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
        setCatError('Failed to load categories');
      } finally {
        setLoadingCats(false);
      }
    };

    fetchCategories();
  }, [isSignedIn, userId]);

  // Derived stats
  const totals = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'INCOME') {
        acc.income += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        acc.expense += tx.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const netBalance = totals.income - totals.expense;

  const currentMonthLabel =
    transactions[0]?.date ? getMonthYear(transactions[0].date) : getMonthYear();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSignedIn || !userId) {
      setTxError('You must be signed in to add a transaction.');
      return;
    }
    if (!amount || !category) {
      setTxError('Amount and category are required.');
      return;
    }

    try {
      setTxError(null);

      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          type: mode,
          category,
          description: description || null,
          date,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to create transaction:', data);
        setTxError(data.detail || data.error || 'Failed to create transaction');
        return;
      }

      // Add new transaction at top
      setTransactions((prev) => [data, ...prev]);

      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setMode('EXPENSE');
      setDate(new Date().toISOString().slice(0, 10));
    } catch (err) {
      console.error('Error creating transaction:', err);
      setTxError('Failed to create transaction');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!isSignedIn || !userId) return;
    if (!newCategoryName.trim()) {
      setCatError('Category name cannot be empty.');
      return;
    }

    try {
      setCatError(null);

      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: newCategoryName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to create category:', data);
        setCatError(data.detail || data.error || 'Failed to create category');
        return;
      }

      setCategories((prev) => [...prev, data]);
      setNewCategoryName('');
    } catch (err) {
      console.error('Error creating category:', err);
      setCatError('Failed to create category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!isSignedIn || !userId) return;

    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Failed to delete category:', data);
        setCatError(data.detail || data.error || 'Failed to delete category');
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));

      // If current transaction form is using this category, clear it
      setCategory((current) => {
        const exists = categories.some((c) => c.id === id && c.name === current);
        return exists ? '' : current;
      });
    } catch (err) {
      console.error('Error deleting category:', err);
      setCatError('Failed to delete category');
    }
  };

  if (!isSignedIn) {
    return (
      <main className="dash-shell">
        <div className="dash-card dash-card-center">
          <h1 className="dash-title">Welcome to MoneyTracker ✨</h1>
          <p className="dash-subtitle">
            Please sign in to see your dashboard and track your beautiful little
            budget.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="dash-shell">
      {/* Hero */}
      <section className="dash-hero">
        <div>
          <p className="dash-eyebrow">Welcome back, bestie 💌</p>
          <h1 className="dash-title">Let&apos;s romanticize your finances</h1>
          <p className="dash-subtitle">
            Track expenses, celebrate your wins, and keep future-you stress
            free.
          </p>
        </div>
        <div className="dash-hero-pill">
          <span>Month</span>
          <strong>{currentMonthLabel}</strong>
        </div>
      </section>

      {/* Top summary */}
      <section className="dash-top-summary">
        <div className="summary-chip income">
          Income: <span>{formatCurrency(totals.income)}</span>
        </div>
        <div className="summary-chip expense">
          Expenses: <span>{formatCurrency(totals.expense)}</span>
        </div>
        <div className="summary-chip balance">
          Balance: <span>{formatCurrency(netBalance)}</span>
        </div>
      </section>

      {/* Tabs (Budgets removed) */}
      <nav className="dash-tabs">
        {['overview', 'transactions', 'categories'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`dash-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'transactions' && 'Transactions'}
            {tab === 'categories' && 'Categories'}
          </button>
        ))}
      </nav>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <section className="dash-grid">
          <div className="dash-card">
            <h2 className="card-title">Monthly Summary</h2>
            <p className="card-caption">{currentMonthLabel}</p>
            <div className="summary-grid">
              <div className="summary-card income">
                <span className="summary-label">Total Income</span>
                <span className="summary-value">
                  {formatCurrency(totals.income)}
                </span>
              </div>
              <div className="summary-card expense">
                <span className="summary-label">Total Expenses</span>
                <span className="summary-value">
                  {formatCurrency(totals.expense)}
                </span>
              </div>
              <div className="summary-card balance">
                <span className="summary-label">Net Balance</span>
                <span className="summary-value">
                  {formatCurrency(netBalance)}
                </span>
              </div>
              <div className="summary-card transactions">
                <span className="summary-label">Transactions</span>
                <span className="summary-value">{transactions.length}</span>
              </div>
            </div>
          </div>

          <div className="dash-card">
            <h2 className="card-title">Recent Transactions</h2>
            {loadingTx ? (
              <p className="card-empty">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="card-empty">
                No transactions yet. Add your first one to get started ✨
              </p>
            ) : (
              <ul className="tx-list">
                {transactions.slice(0, 5).map((tx) => (
                  <li key={tx.id} className="tx-item">
                    <div className="tx-main">
                      <span className="tx-category">{tx.category}</span>
                      {tx.description && (
                        <span className="tx-description">
                          {tx.description}
                        </span>
                      )}
                    </div>
                    <div className="tx-meta">
                      <span
                        className={`tx-amount ${
                          tx.type === 'INCOME' ? 'income' : 'expense'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {tx.amount.toFixed(2)}
                      </span>
                      <span className="tx-date">
                        {new Date(tx.date).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <section className="dash-grid">
          {/* Add transaction */}
          <div className="dash-card">
            <h2 className="card-title">Add Transaction</h2>
            <p className="card-caption">
              Little habits, big glow-up. Log it and move on 💅
            </p>

            {txError && <p className="card-error">{txError}</p>}

            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-pill ${
                  mode === 'EXPENSE' ? 'active-expense' : ''
                }`}
                onClick={() => setMode('EXPENSE')}
              >
                💸 Expense
              </button>
              <button
                type="button"
                className={`mode-pill ${
                  mode === 'INCOME' ? 'active-income' : ''
                }`}
                onClick={() => setMode('INCOME')}
              >
                ✨ Income
              </button>
            </div>

            <form className="tx-form" onSubmit={handleSubmit}>
              <label>
                <span>Amount ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>

              <label>
                <span>Description</span>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Matcha latte, gas, rent..."
                />
              </label>

              <label>
                <span>Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">
                    {categories.length === 0
                      ? 'Create a category in the Categories tab first'
                      : 'Select a category'}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className={`primary-btn ${
                  mode === 'EXPENSE' ? 'expense' : 'income'
                }`}
              >
                {mode === 'EXPENSE' ? 'Add Expense' : 'Add Income'}
              </button>
            </form>
          </div>

          {/* All transactions */}
          <div className="dash-card">
            <h2 className="card-title">All Transactions</h2>
            {loadingTx ? (
              <p className="card-empty">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="card-empty">
                No transactions yet. Add your first one to get started ✨
              </p>
            ) : (
              <ul className="tx-list tall">
                {transactions.map((tx) => (
                  <li key={tx.id} className="tx-item">
                    <div className="tx-main">
                      <span className="tx-category">{tx.category}</span>
                      {tx.description && (
                        <span className="tx-description">
                          {tx.description}
                        </span>
                      )}
                    </div>
                    <div className="tx-meta">
                      <span
                        className={`tx-amount ${
                          tx.type === 'INCOME' ? 'income' : 'expense'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {tx.amount.toFixed(2)}
                      </span>
                      <span className="tx-date">
                        {new Date(tx.date).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      {activeTab === 'categories' && (
        <section className="dash-card full-width">
          <h2 className="card-title">Your Categories</h2>
          <p className="card-caption">
            Name things the way your brain actually thinks. Cozy little
            buckets for your money.
          </p>

          {catError && <p className="card-error">{catError}</p>}

          <form className="category-form" onSubmit={handleCreateCategory}>
            <input
              type="text"
              placeholder="e.g. Coffee, Travel Fund, Night Out..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button type="submit" className="primary-btn expense">
              Add Category
            </button>
          </form>

          {loadingCats ? (
            <p className="card-empty" style={{ marginTop: '0.75rem' }}>
              Loading categories...
            </p>
          ) : categories.length === 0 ? (
            <p className="card-empty" style={{ marginTop: '0.75rem' }}>
              No categories yet. Add your first one above ✨
            </p>
          ) : (
            <div className="chip-grid user-cats">
              {categories.map((c) => (
                <div key={c.id} className="cat-pill">
                  <span>{c.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)}
                    aria-label="Delete category"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="card-note">
            These categories will show up in your transaction form. Delete
            them here if you change your mind later.
          </p>
        </section>
      )}
    </main>
  );
}