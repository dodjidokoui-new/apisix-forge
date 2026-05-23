// Shared domain types used across pages and API routes.

export interface Route {
  id: string;
  name?: string;
  uri: string;
  status: number;
  priority?: number;
  update_time: number;
  methods?: string[];
  plugins?: Record<string, unknown>;
  upstream?: {
    type: string;
    nodes: Record<string, number>;
  };
}

export interface Consumer {
  username: string;
  plugins?: Record<string, unknown>;
  create_time?: number;
}

export interface WafEvent {
  timestamp: string;
  ip: string;
  uri: string;
  rule_id: string;
  msg: string;
  severity: string;
}

export interface ServiceHealth {
  name: string;
  url: string;
  status: 'up' | 'down' | 'loading';
  latency?: number;
}
