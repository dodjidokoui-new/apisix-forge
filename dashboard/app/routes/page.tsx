'use client';

import { useState, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Route {
  id: string;
  uri: string;
  status: number;
  priority?: number;
  methods?: string[];
  plugins?: Record<string, unknown>;
  upstream?: {
    type: string;
    nodes: Record<string, number>;
  };
}

interface PluginOption {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  choices?: string[];
  default: string | number;
}

interface PluginDefinition {
  id: string;
  label: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  options: PluginOption[];
}

interface RouteFormProps {
  initial?: Route;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const UPSTREAM_TYPES = ['roundrobin', 'chash', 'ewma', 'least_conn'];

const AVAILABLE_PLUGINS: PluginDefinition[] = [
  {
    id: 'coraza-filter',
    label: 'Coraza WAF',
    description: 'OWASP CRS — blocks SQLi, XSS, path traversal',
    defaultConfig: {
      engine: 'On',
      debug_level: '1',
    },
    options: [
      {
        key: 'engine',
        label: 'Rule Engine',
        type: 'select',
        choices: ['On', 'Off', 'DetectionOnly'],
        default: 'On',
      },
      {
        key: 'debug_level',
        label: 'Debug Log Level',
        type: 'select',
        choices: ['0', '1', '3', '5', '9'],
        default: '1',
      },
    ],
  },
  {
    id: 'limit-req',
    label: 'Rate Limit',
    description: 'Limit requests per second per key',
    defaultConfig: { rate: 10, burst: 20, key: 'remote_addr', rejected_code: 429 },
    options: [
      { key: 'rate', label: 'Rate (req/s)', type: 'number', default: 10 },
      { key: 'burst', label: 'Burst', type: 'number', default: 20 },
      {
        key: 'key',
        label: 'Key',
        type: 'select',
        choices: ['remote_addr', 'http_x_forwarded_for', 'consumer_name'],
        default: 'remote_addr',
      },
      {
        key: 'rejected_code',
        label: 'Rejected HTTP code',
        type: 'select',
        choices: ['429', '503', '403'],
        default: '429',
      },
    ],
  },
  {
    id: 'jwt-auth',
    label: 'JWT Auth',
    description: 'Require valid JWT token — configure consumers first',
    defaultConfig: { header: 'Authorization' },
    options: [
      { key: 'header', label: 'Header name', type: 'text', default: 'Authorization' },
    ],
  },
  {
    id: 'key-auth',
    label: 'Key Auth',
    description: 'Require API key — configure consumers first',
    defaultConfig: { header: 'apikey' },
    options: [
      { key: 'header', label: 'Header name', type: 'text', default: 'apikey' },
    ],
  },
  {
    id: 'cors',
    label: 'CORS',
    description: 'Cross-origin resource sharing',
    defaultConfig: {
      allow_origins: '*',
      allow_methods: 'GET,POST,PUT,DELETE',
      allow_headers: '*',
      max_age: 5,
    },
    options: [
      { key: 'allow_origins', label: 'Allow origins', type: 'text', default: '*' },
      { key: 'allow_methods', label: 'Allow methods', type: 'text', default: 'GET,POST,PUT,DELETE' },
      { key: 'allow_headers', label: 'Allow headers', type: 'text', default: '*' },
      { key: 'max_age', label: 'Max age (s)', type: 'number', default: 5 },
    ],
  },
  {
    id: 'prometheus',
    label: 'Prometheus',
    description: 'Expose metrics for this route',
    defaultConfig: {},
    options: [],
  },
];

// ─── Plugin options panel ─────────────────────────────────────────────────────

function PluginOptionsPanel({
  plugin,
  config,
  onChange,
}: {
  plugin: PluginDefinition;
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (plugin.options.length === 0) return null;

  return (
    <div className="mt-2 ml-5">
      <button
        onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
      >
        <span>{expanded ? '▾' : '▸'}</span>
        Advanced options
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 bg-zinc-950 rounded p-3 border border-zinc-700">
          {plugin.options.map(opt => (
            <div key={opt.key} className="flex items-center justify-between gap-4">
              <label className="text-xs text-zinc-400 w-40 flex-shrink-0">{opt.label}</label>

              {opt.type === 'select' ? (
                <select
                  value={String(config[opt.key] ?? opt.default)}
                  onChange={e => onChange(opt.key, opt.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-zinc-500"
                >
                  {opt.choices?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={opt.type === 'number' ? 'number' : 'text'}
                  value={String(config[opt.key] ?? opt.default)}
                  onChange={e => onChange(opt.key, opt.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-zinc-500"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Route form (shared by create and edit) ───────────────────────────────────

function RouteForm({ initial, onSubmit, onCancel, submitting, error }: RouteFormProps) {
  const [uri, setUri] = useState(initial?.uri ?? '');
  const [upstreamHost, setUpstreamHost] = useState(
    initial?.upstream ? Object.keys(initial.upstream.nodes)[0] : ''
  );
  const [upstreamType, setUpstreamType] = useState(initial?.upstream?.type ?? 'roundrobin');
  const [selectedMethods, setSelectedMethods] = useState<string[]>(initial?.methods ?? ['GET', 'POST']);
  const [priority, setPriority] = useState(initial?.priority ?? 0);

  // Plugin configs — key: plugin id, value: plugin config object
  const [pluginConfigs, setPluginConfigs] = useState<Record<string, Record<string, unknown>>>(
    initial?.plugins
      ? Object.fromEntries(
          Object.entries(initial.plugins).map(([k, v]) => [k, v as Record<string, unknown>])
        )
      : {}
  );

  function toggleMethod(method: string) {
    setSelectedMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  }

  function togglePlugin(plugin: PluginDefinition) {
    setPluginConfigs(prev => {
      if (prev[plugin.id] !== undefined) {
        const next = { ...prev };
        delete next[plugin.id];
        return next;
      }
      return { ...prev, [plugin.id]: { ...plugin.defaultConfig } };
    });
  }

  function updatePluginOption(pluginId: string, key: string, value: unknown) {
    setPluginConfigs(prev => ({
      ...prev,
      [pluginId]: { ...prev[pluginId], [key]: value },
    }));
  }

  async function handleSubmit() {
    const plugins: Record<string, unknown> = {};

    for (const [pluginId, config] of Object.entries(pluginConfigs)) {
      if (pluginId === 'coraza-filter') {
        // Rebuild Coraza directives from advanced option values
        const engine = config['engine'] ?? 'On';
        const debugLevel = config['debug_level'] ?? '1';
        plugins[pluginId] = {
          conf: {
            directives_map: {
              default: [
                `SecDebugLogLevel ${debugLevel}`,
                `SecRuleEngine ${engine}`,
                'Include @crs-setup-conf',
                'Include @owasp_crs/*.conf',
              ],
            },
            default_directives: 'default',
          },
        };
      } else {
        plugins[pluginId] = config;
      }
    }

    await onSubmit({
      uri,
      upstream: upstreamHost,
      upstreamType,
      methods: selectedMethods.length > 0 ? selectedMethods : undefined,
      plugins: Object.keys(plugins).length > 0 ? plugins : undefined,
      priority,
    });
  }

  return (
    <div className="space-y-5">

      {/* URI */}
      <div>
        <label className="text-xs text-zinc-400 block mb-1">URI</label>
        <input
          type="text"
          value={uri}
          onChange={e => setUri(e.target.value)}
          placeholder="/api/v1/*"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* HTTP Methods */}
      <div>
        <label className="text-xs text-zinc-400 block mb-2">HTTP Methods</label>
        <div className="flex flex-wrap gap-2">
          {HTTP_METHODS.map(method => (
            <button
              key={method}
              onClick={() => toggleMethod(method)}
              className={`text-xs px-3 py-1 rounded font-mono transition-colors ${
                selectedMethods.includes(method)
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Upstream */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Upstream (host:port)</label>
          <input
            type="text"
            value={upstreamHost}
            onChange={e => setUpstreamHost(e.target.value)}
            placeholder="backend:8080"
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Load balancing</label>
          <select
            value={upstreamType}
            onChange={e => setUpstreamType(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          >
            {UPSTREAM_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="text-xs text-zinc-400 block mb-1">Priority (higher = matched first)</label>
        <input
          type="number"
          value={priority}
          onChange={e => setPriority(Number(e.target.value))}
          className="w-32 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
        />
      </div>

      {/* Plugins */}
      <div>
        <label className="text-xs text-zinc-400 block mb-2">Plugins</label>
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_PLUGINS.map(plugin => (
            <div key={plugin.id}>
              <div
                onClick={() => togglePlugin(plugin)}
                className={`cursor-pointer rounded-lg p-3 border transition-colors ${
                  pluginConfigs[plugin.id] !== undefined
                    ? 'border-white bg-zinc-800'
                    : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm border flex-shrink-0 ${
                    pluginConfigs[plugin.id] !== undefined
                      ? 'bg-white border-white'
                      : 'border-zinc-500'
                  }`} />
                  <span className="text-sm font-medium">{plugin.label}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 ml-5">{plugin.description}</p>
              </div>

              {/* Advanced options panel — shown when plugin is selected */}
              {pluginConfigs[plugin.id] !== undefined && (
                <PluginOptionsPanel
                  plugin={plugin}
                  config={pluginConfigs[plugin.id]}
                  onChange={(key, value) => updatePluginOption(plugin.id, key, value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-white text-zinc-900 text-sm px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : initial ? 'Save changes' : 'Create route'}
        </button>
        <button
          onClick={onCancel}
          className="text-zinc-400 text-sm px-4 py-2 rounded-md hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function fetchRoutes() {
    try {
      const res = await fetch('/api/routes');
      const data = await res.json();
      setRoutes(data.list?.map((r: { value: Route }) => r.value) ?? []);
    } catch {
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: Record<string, unknown>) {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json.error) { setError(json.error || 'Failed to create route'); return; }
      setShowCreateForm(false);
      fetchRoutes();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(id: string, data: Record<string, unknown>) {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || json.error) { setError(json.error || 'Failed to update route'); return; }
      setEditingId(null);
      fetchRoutes();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(route: Route) {
    await fetch(`/api/routes/${route.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: route.status === 1 ? 0 : 1 }),
    });
    fetchRoutes();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/routes/${id}`, { method: 'DELETE' });
    fetchRoutes();
  }

  useEffect(() => { fetchRoutes(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Routes</h1>
        <button
          onClick={() => { setShowCreateForm(!showCreateForm); setError(''); }}
          className="bg-white text-zinc-900 text-sm px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ New route'}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium mb-4">Create a route</h2>
          <RouteForm
            onSubmit={handleCreate}
            onCancel={() => { setShowCreateForm(false); setError(''); }}
            submitting={submitting}
            error={error}
          />
        </div>
      )}

      {/* Route list */}
      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : routes.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400">No routes configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map(route => (
            <div key={route.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              {editingId === route.id ? (
                // Inline edit form
                <div>
                  <h3 className="text-sm font-medium mb-4">Edit route</h3>
                  <RouteForm
                    initial={route}
                    onSubmit={data => handleEdit(route.id, data)}
                    onCancel={() => { setEditingId(null); setError(''); }}
                    submitting={submitting}
                    error={error}
                  />
                </div>
              ) : (
                // Route summary row
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm">{route.uri}</span>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        route.status === 1 ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {/* HTTP methods */}
                      {route.methods?.map(m => (
                        <span key={m} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                          {m}
                        </span>
                      ))}
                      {/* Active plugins */}
                      {route.plugins && Object.keys(route.plugins).map(plugin => (
                        <span key={plugin} className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
                          {plugin}
                        </span>
                      ))}
                      {/* Upstream */}
                      {route.upstream && (
                        <span className="text-xs text-zinc-500 font-mono">
                          → {Object.keys(route.upstream.nodes)[0]} ({route.upstream.type})
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-600 text-xs mt-1">ID: {route.id}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={() => { setEditingId(route.id); setError(''); }}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(route)}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      {route.status === 1 ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(route.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}