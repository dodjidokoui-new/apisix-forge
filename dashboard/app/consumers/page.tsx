'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Consumer } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConsumerFormProps {
  onSubmit: (data: { username: string; authType: string; options: Record<string, unknown> }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AUTH_TYPES = [
  {
    id: 'key-auth',
    label: 'Key Auth',
    description: 'API key passed via header or query param',
    options: [
      { key: 'header', label: 'Header name', type: 'text', default: 'apikey' },
    ],
  },
  {
    id: 'jwt-auth',
    label: 'JWT Auth',
    description: 'JSON Web Token signed with HMAC-SHA256',
    options: [
      { key: 'header', label: 'Header name', type: 'text', default: 'Authorization' },
      {
        key: 'algorithm',
        label: 'Algorithm',
        type: 'select',
        choices: ['HS256', 'HS512', 'RS256'],
        default: 'HS256',
      },
      { key: 'exp', label: 'Expiry (seconds)', type: 'number', default: 86400 },
    ],
  },
];

// ─── Consumer form ────────────────────────────────────────────────────────────

function ConsumerForm({ onSubmit, onCancel, submitting, error }: ConsumerFormProps) {
  const [username, setUsername] = useState('');
  const [authType, setAuthType] = useState('key-auth');
  const [options, setOptions] = useState<Record<string, unknown>>({ header: 'apikey' });

  function handleAuthTypeChange(id: string) {
    setAuthType(id);
    const type = AUTH_TYPES.find(t => t.id === id);
    if (type) {
      setOptions(Object.fromEntries(type.options.map(o => [o.key, o.default])));
    }
  }

  function updateOption(key: string, value: unknown) {
    setOptions(prev => ({ ...prev, [key]: value }));
  }

  const selectedType = AUTH_TYPES.find(t => t.id === authType);

  return (
    <div className="space-y-5">

      {/* Username */}
      <div>
        <label className="text-xs text-zinc-400 block mb-1">
          Username <span className="text-zinc-600">(letters, numbers, underscores only)</span>
        </label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="my_service"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Auth type selector */}
      <div>
        <label className="text-xs text-zinc-400 block mb-2">Auth type</label>
        <div className="grid grid-cols-2 gap-3">
          {AUTH_TYPES.map(type => (
            <div
              key={type.id}
              role="radio"
              aria-checked={authType === type.id}
              tabIndex={0}
              onClick={() => handleAuthTypeChange(type.id)}
              onKeyDown={e => e.key === 'Enter' && handleAuthTypeChange(type.id)}
              className={`cursor-pointer rounded-lg p-3 border transition-colors ${
                authType === type.id
                  ? 'border-white bg-zinc-800'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                  authType === type.id ? 'bg-white border-white' : 'border-zinc-500'
                }`} />
                <span className="text-sm font-medium">{type.label}</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 ml-5">{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Options for selected auth type */}
      {selectedType && selectedType.options.length > 0 && (
        <div className="bg-zinc-950 rounded p-4 border border-zinc-700 space-y-3">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Options</p>
          {selectedType.options.map(opt => (
            <div key={opt.key} className="flex items-center justify-between gap-4">
              <label className="text-xs text-zinc-400 w-40 flex-shrink-0">{opt.label}</label>
              {opt.type === 'select' ? (
                <select
                  value={String(options[opt.key] ?? opt.default)}
                  onChange={e => updateOption(opt.key, e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-zinc-500"
                >
                  {(opt as { choices?: string[] }).choices?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={opt.type === 'number' ? 'number' : 'text'}
                  value={String(options[opt.key] ?? opt.default)}
                  onChange={e => updateOption(opt.key, opt.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-500"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSubmit({ username, authType, options })}
          disabled={submitting}
          className="bg-white text-zinc-900 text-sm px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create consumer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-400 text-sm px-4 py-2 rounded-md hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Credential display ───────────────────────────────────────────────────────

function CredentialBadge({ label, value }: { label: string; value: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded p-3 mt-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono flex-1 break-all">
          {revealed ? value : '••••••••••••••••••••••••'}
        </code>
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="text-xs text-zinc-500 hover:text-white transition-colors flex-shrink-0"
        >
          {revealed ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-zinc-500 hover:text-white transition-colors flex-shrink-0"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConsumersPage() {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Credentials are stored in memory only — they are shown once after creation
  const [credentials, setCredentials] = useState<Record<string, { type: string; key?: string; secret?: string }>>({});

  const fetchConsumers = useCallback(async () => {
    try {
      const res = await fetch('/api/consumers');
      const data = await res.json();
      setConsumers(data.list?.map((c: { value: Consumer }) => c.value) ?? []);
    } catch {
      setConsumers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleCreate(data: { username: string; authType: string; options: Record<string, unknown> }) {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/consumers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json.error) { setError(json.error || 'Failed to create consumer'); return; }

      if (json.credentials) {
        setCredentials(prev => ({ ...prev, [data.username]: json.credentials }));
      }

      setShowForm(false);
      fetchConsumers();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(username: string) {
    await fetch(`/api/consumers/${username}`, { method: 'DELETE' });
    setCredentials(prev => { const next = { ...prev }; delete next[username]; return next; });
    fetchConsumers();
  }

  useEffect(() => { fetchConsumers(); }, [fetchConsumers]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Consumers</h1>
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="bg-white text-zinc-900 text-sm px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New consumer'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium mb-4">Create a consumer</h2>
          <ConsumerForm
            onSubmit={handleCreate}
            onCancel={() => { setShowForm(false); setError(''); }}
            submitting={submitting}
            error={error}
          />
        </div>
      )}

      {/* Consumer list */}
      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : consumers.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400">No consumers configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {consumers.map(consumer => (
            <div key={consumer.username} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm">{consumer.username}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {consumer.plugins && Object.keys(consumer.plugins).map(plugin => (
                      <span key={plugin} className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
                        {plugin}
                      </span>
                    ))}
                    {consumer.create_time && (
                      <p className="text-zinc-500 text-xs">
                        Created {new Date(consumer.create_time * 1000).toLocaleDateString('en-GB')}
                      </p>
                    )}
                  </div>

                  {/* Show credentials once, immediately after creation */}
                  {credentials[consumer.username] && (
                    <div className="mt-2">
                      <p className="text-xs text-amber-400">
                        ⚠ Save these credentials — they won&apos;t be shown again
                      </p>
                      {credentials[consumer.username].key && (
                        <CredentialBadge
                          label={credentials[consumer.username].type === 'jwt-auth' ? 'JWT Key' : 'API Key'}
                          value={credentials[consumer.username].key!}
                        />
                      )}
                      {credentials[consumer.username].secret && (
                        <CredentialBadge
                          label="JWT Secret"
                          value={credentials[consumer.username].secret!}
                        />
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(consumer.username)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors ml-4"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
