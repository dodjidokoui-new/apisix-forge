const APISIX_ADMIN_URL = process.env.APISIX_ADMIN_URL || 'http://localhost:9180';
const APISIX_ADMIN_KEY = process.env.APISIX_ADMIN_KEY || 'apisixforge-admin-key';

const headers = {
  'X-API-KEY': APISIX_ADMIN_KEY,
  'Content-Type': 'application/json',
};

export async function getRoutes() {
  const res = await fetch(`${APISIX_ADMIN_URL}/apisix/admin/routes`, { headers });
  if (!res.ok) throw new Error('Failed to fetch routes');
  return res.json();
}

export async function createRoute(data: Record<string, unknown>) {
  const res = await fetch(`${APISIX_ADMIN_URL}/apisix/admin/routes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create route');
  return res.json();
}

export async function deleteRoute(id: string) {
  const res = await fetch(`${APISIX_ADMIN_URL}/apisix/admin/routes/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete route');
  return res.json();
}

export async function getConsumers() {
  const res = await fetch(`${APISIX_ADMIN_URL}/apisix/admin/consumers`, { headers });
  if (!res.ok) throw new Error('Failed to fetch consumers');
  return res.json();
}

export async function deleteConsumer(username: string) {
  const res = await fetch(`${APISIX_ADMIN_URL}/apisix/admin/consumers/${username}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete consumer');
  return res.json();
}
