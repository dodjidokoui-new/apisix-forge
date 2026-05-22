'use client';

import { useState, useEffect } from 'react';

interface Consumer {
  username: string;
  plugins?: Record<string, unknown>;
  create_time?: number;
}

export default function ConsumersPage() {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [authType, setAuthType] = useState<'key-auth' | 'jwt-auth'>('key-auth');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function fetchConsumers() {
    try {
      const res = await fetch('/api/consumers');
      const data = await res.json();
      setConsumers(data.list?.map((c: { value: Consumer }) => c.value) ?? []);
    } catch {
      setConsumers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!username) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/consumers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authType }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to create consumer');
        return;
      }
      setUsername('');
      setShowForm(false);
      fetchConsumers();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(username: string) {
    await fetch(`/api/consumers/${username}`, { method: 'DELETE' });
    fetchConsumers();
  }

  useEffect(() => { fetchConsumers(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Consumers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-zinc-900 text-sm px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors"
        >
          + Nouveau consumer
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium mb-4">Create a consumer</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Username (letters, numbers, underscores only)</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="my_service"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Auth type</label>
              <select
                value={authType}
                onChange={e => setAuthType(e.target.value as 'key-auth' | 'jwt-auth')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
              >
                <option value="key-auth">key-auth</option>
                <option value="jwt-auth">jwt-auth</option>
              </select>
            </div>
            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="bg-white text-zinc-900 text-sm px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => { setShowForm(false); setError(''); }}
                className="text-zinc-400 text-sm px-4 py-2 rounded-md hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : consumers.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400">No consumers configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consumers.map(consumer => (
            <div key={consumer.username} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm">{consumer.username}</p>
                <div className="flex items-center gap-3 mt-1">
                  {consumer.plugins && Object.keys(consumer.plugins).map(plugin => (
                    <span key={plugin} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                      {plugin}
                    </span>
                  ))}
                  {consumer.create_time && (
                    <p className="text-zinc-500 text-xs">
                      Created {new Date(consumer.create_time * 1000).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(consumer.username)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
