/**
 * APISIX Admin API client.
 *
 * All functions are server-side only — they call the Admin API directly
 * using the admin key from environment variables.
 */
import { config } from '@/lib/config';

const { adminUrl, adminKey } = config.apisix;

const adminHeaders = {
  'X-API-KEY': adminKey,
  'Content-Type': 'application/json',
};

// ─── Routes ───────────────────────────────────────────────────────────────────

/** Fetch all routes from APISIX. */
export async function getRoutes() {
  const res = await fetch(`${adminUrl}/apisix/admin/routes`, { headers: adminHeaders });
  if (!res.ok) throw new Error('Failed to fetch routes');
  return res.json();
}

/** Create a new route. */
export async function createRoute(body: Record<string, unknown>) {
  const res = await fetch(`${adminUrl}/apisix/admin/routes`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Replace a route by ID (full update). */
export async function updateRoute(id: string, body: Record<string, unknown>) {
  const res = await fetch(`${adminUrl}/apisix/admin/routes/${id}`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Partially update a route by ID (e.g. toggle status). */
export async function patchRoute(id: string, body: Record<string, unknown>) {
  const res = await fetch(`${adminUrl}/apisix/admin/routes/${id}`, {
    method: 'PATCH',
    headers: adminHeaders,
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Delete a route by ID. */
export async function deleteRoute(id: string) {
  const res = await fetch(`${adminUrl}/apisix/admin/routes/${id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  if (!res.ok) throw new Error('Failed to delete route');
  return res.json();
}

// ─── Consumers ────────────────────────────────────────────────────────────────

/** Fetch all consumers from APISIX. */
export async function getConsumers() {
  const res = await fetch(`${adminUrl}/apisix/admin/consumers`, { headers: adminHeaders });
  if (!res.ok) throw new Error('Failed to fetch consumers');
  return res.json();
}

/** Create or replace a consumer (APISIX uses PUT for upsert). */
export async function upsertConsumer(body: Record<string, unknown>) {
  const res = await fetch(`${adminUrl}/apisix/admin/consumers`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Delete a consumer by username. */
export async function deleteConsumer(username: string) {
  const res = await fetch(`${adminUrl}/apisix/admin/consumers/${username}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  if (!res.ok) throw new Error('Failed to delete consumer');
  return res.json();
}
