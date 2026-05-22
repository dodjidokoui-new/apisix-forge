'use client';

import { useState } from 'react';

interface ConfigItem {
  label: string;
  value: string;
  secret?: boolean;
}

const config: ConfigItem[] = [
  { label: 'APISIX Admin URL', value: process.env.NEXT_PUBLIC_APISIX_URL || 'http://localhost:9180' },
  { label: 'Admin API Key', value: 'apisixforge-admin-key', secret: true },
  { label: 'Grafana', value: 'http://localhost:3000' },
  { label: 'Prometheus', value: 'http://localhost:9090' },
  { label: 'Loki', value: 'http://localhost:3100' },
  { label: 'WAF Engine', value: 'Coraza WASM v0.5.0' },
  { label: 'OWASP CRS', value: '4.0.0-rc2' },
];

function ConfigRow({ item }: { item: ConfigItem }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
      <span className="text-sm text-zinc-400">{item.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono">
          {item.secret && !revealed ? '••••••••••••••••' : item.value}
        </span>
        {item.secret && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8">Settings</h1>

      <div className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Configuration</h2>
          {config.map(item => (
            <ConfigRow key={item.label} item={item} />
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Stack</h2>
          <div className="space-y-2">
            {[
              { name: 'Apache APISIX', version: '3.11.0' },
              { name: 'Coraza WAF', version: '0.5.0' },
              { name: 'etcd', version: '3.5.17' },
              { name: 'Prometheus', version: '2.47.0' },
              { name: 'Grafana', version: '10.4.0' },
              { name: 'Loki', version: '2.9.0' },
            ].map(({ name, version }) => (
              <div key={name} className="flex items-center justify-between py-2">
                <span className="text-sm">{name}</span>
                <span className="text-xs font-mono text-zinc-500">v{version}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-amber-900 rounded-lg p-6">
          <h2 className="text-sm font-medium text-amber-400 mb-2">Security notice</h2>
          <p className="text-sm text-zinc-400">
            The Admin API key is stored in <span className="font-mono text-zinc-300">.env.local</span>.
            Rotate it regularly and never expose the Admin API publicly.
            In production, restrict access via VPN or firewall rules.
          </p>
        </div>
      </div>
    </div>
  );
}
