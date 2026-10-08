'use client';

import { useEffect, useMemo, useState } from 'react';
import { db } from './db';
import { seedDiscoveries, seedExplorations } from './seed';
import type { Discovery, Exploration } from './types';

const SEED_KEY = 'naturelens-seeded-v2';

async function readLocal() {
  const [discoveries, explorations] = await Promise.all([
    db.discoveries.orderBy('date').reverse().toArray(),
    db.explorations.orderBy('startedAt').reverse().toArray()
  ]);
  return { discoveries, explorations };
}

async function pushLocalVault(discoveries: Discovery[], explorations: Exploration[]) {
  try {
    await fetch('/api/sync', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({discoveries, explorations})
    });
  } catch {
    // Browser-local storage remains the source of truth when the local server is unavailable.
  }
}

async function mergeRemoteVault() {
  try {
    const response = await fetch('/api/sync', { cache:'no-store' });
    if (!response.ok) return;
    const remote = await response.json() as {discoveries?:Discovery[]; explorations?:Exploration[]};
    const local = await readLocal();
    const remoteDiscoveries = Array.isArray(remote.discoveries) ? remote.discoveries : [];
    const remoteExplorations = Array.isArray(remote.explorations) ? remote.explorations : [];
    if (remoteDiscoveries.length) await db.discoveries.bulkPut(remoteDiscoveries);
    if (remoteExplorations.length) await db.explorations.bulkPut(remoteExplorations);
    if (!remoteDiscoveries.length && !remoteExplorations.length && (local.discoveries.length || local.explorations.length)) {
      await pushLocalVault(local.discoveries, local.explorations);
    }
  } catch {
    // Offline is a supported state.
  }
}

export function useNatureLens() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refresh = async () => {
    const local = await readLocal();
    setDiscoveries(local.discoveries);
    setExplorations(local.explorations);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!localStorage.getItem(SEED_KEY)) {
          await db.transaction('rw', db.discoveries, db.explorations, async () => {
            const hasDiscoveries = await db.discoveries.count();
            const hasExplorations = await db.explorations.count();
            if (!hasDiscoveries) await db.discoveries.bulkPut(seedDiscoveries);
            if (!hasExplorations) await db.explorations.bulkPut(seedExplorations);
          });
          localStorage.setItem(SEED_KEY, '1');
        }
        await mergeRemoteVault();
        await refresh();
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const stats = useMemo(() => {
    const minutes = explorations.reduce((sum, e) => sum + e.minutes, 0);
    const tasksCompleted = explorations.reduce((sum, e) => sum + (e.tasksCompleted || 0), 0);
    const highConfidence = discoveries.filter(d => (d.confidenceLevel || (d.confidence >= 80 ? 'high' : d.confidence >= 55 ? 'medium' : 'low')) === 'high').length;
    const locations = discoveries.filter(d => typeof d.lat === 'number' && typeof d.lng === 'number').length;
    const species = new Set(discoveries.map(d => d.title.trim().toLowerCase()).filter(Boolean)).size;
    return {
      discoveries: discoveries.length,
      species,
      walks: explorations.filter(e => e.status === 'completed').length,
      minutes,
      tasksCompleted,
      highConfidence,
      locations,
      level: Math.max(1, Math.floor((discoveries.length + tasksCompleted) / 4) + 1)
    };
  }, [discoveries, explorations]);

  const syncNow = async () => {
    setSyncing(true);
    try {
      const local = await readLocal();
      await pushLocalVault(local.discoveries, local.explorations);
    } finally { setSyncing(false); }
  };

  const addDiscovery = async (discovery: Discovery) => {
    await db.discoveries.put(discovery);
    await refresh();
    await syncNow();
  };

  const deleteDiscovery = async (id: string) => {
    await db.discoveries.delete(id);
    await refresh();
    try { await fetch(`/api/sync?type=discovery&id=${encodeURIComponent(id)}`, { method:'DELETE' }); } catch {}
    await syncNow();
  };

  const addExploration = async (exploration: Exploration) => {
    await db.explorations.put(exploration);
    await refresh();
    await syncNow();
  };

  const clearAll = async () => {
    await db.transaction('rw', db.discoveries, db.explorations, async () => {
      await db.discoveries.clear();
      await db.explorations.clear();
    });
    localStorage.removeItem(SEED_KEY);
    await refresh();
    await pushLocalVault([], []);
  };

  return { discoveries, explorations, stats, ready, syncing, refresh, syncNow, addDiscovery, deleteDiscovery, addExploration, clearAll };
}
