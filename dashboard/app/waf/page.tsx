'use client';

import { useState, useEffect, useCallback } from 'react';

interface WafEvent {
  timestamp: string;
  ip: string;
  uri: string;
  rule_id: string;
  msg: string;
  severity: string;
}

// Parse a raw Coraza log line into a structured WAF event
function parseCorazaLog(line: string): WafEvent | null {
  try {
    const tsMatch = line.match(/^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/);
    const ipMatch = line.match(/client: ([\d.]+)/);
    const uriMatch = line.match(/uri "([^"]+)"/);
    const idMatch = line.match(/\[id "(\d+)"\]/);
    const msgMatch = line.match(/\[msg "([^"]+)"\]/);
    const severityMatch = line.match(/\[severity "([^"]+)"\]/);

    if (!ipMatch || !uriMatch) return null;

    return {
      timestamp: tsMatch?.[1] ?? '',
      ip: ipMatch[1],
      uri: uriMatch[1],
      rule_id: idMatch?.[1] ?? '—',
      msg: msgMatch?.[1] ?? 'Access denied',
      severity: severityMatch?.[1] ?? 'unknown',
    };
  } catch {
    return null;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-900 text-red-300',
    emergency: 'bg-red-900 text-red-300',
    warning: 'bg-yellow-900 text-yellow-300',
    notice: 'bg-blue-900 text-blue-300',
  };
  const cls = colors[severity.toLowerCase()] ?? 'bg-zinc-800 text-zinc-300';
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-mono ${cls}`}>
      {severity}
    </span>
  );
}

export default function WafPage() {
  const [events, setEvents] = useState<WafEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWafLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/waf/logs');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setEvents(data.events ?? []);
    } catch {
      setError('Failed to fetch WAF logs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 5 seconds for new WAF events
  useEffect(() => {
    fetchWafLogs();
    const interval = setInterval(fetchWafLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchWafLogs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">WAF</h1>
          <p className="text-zinc-500 text-sm mt-1">Coraza — OWASP CRS 4.0 — live feed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-zinc-400">Live</span>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading WAF events...</p>
      ) : error ? (
        <div className="bg-zinc-900 border border-red-900 rounded-lg p-6">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-zinc-500 text-xs mt-1">Make sure Loki is running on port 3100</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400">No WAF events in the last hour</p>
          <p className="text-zinc-600 text-sm mt-1">Try sending a malicious request to trigger Coraza</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={event.severity} />
                    <span className="text-xs text-zinc-500 font-mono">rule #{event.rule_id}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{event.msg}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-zinc-500 font-mono">{event.ip}</span>
                    <span className="text-xs text-zinc-600 font-mono truncate">{event.uri}</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-600 font-mono whitespace-nowrap">{event.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
