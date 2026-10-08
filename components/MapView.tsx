'use client';

import { useEffect, useRef, useState } from 'react';
import type { Discovery } from '@/lib/types';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char] || char));
}

type LatLng = { lat: number; lng: number };

function waitForVisibleSize(el: HTMLElement, cancelled: { current: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    const isOk = () => el.isConnected && el.clientWidth > 0 && el.clientHeight > 0;
    if (isOk()) {
      // Let layout settle one frame so Leaflet measures real pane sizes.
      requestAnimationFrame(() => resolve(!cancelled.current && isOk()));
      return;
    }
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      ro?.disconnect();
      resolve(ok && !cancelled.current);
    };
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (isOk()) {
            requestAnimationFrame(() => finish(isOk()));
          }
        })
      : null;
    ro?.observe(el);
    // Fallback: don't wait forever (e.g. tab hidden). Time out after ~3s.
    window.setTimeout(() => finish(isOk()), 3000);
  });
}

export function MapView({ discoveries, currentLocation }: { discoveries: Discovery[]; currentLocation?: LatLng | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const valid = discoveries.filter(d => typeof d.lat === 'number' && typeof d.lng === 'number');
  const hasData = valid.length > 0 || !!currentLocation;

  // Effect 1: create the Leaflet map exactly once per mounted container.
  // Never rebuilds on discoveries[] identity changes — markers are updated separately below.
  useEffect(() => {
    if (!hasData) return;
    const cancelled = { current: false };
    let map: import('leaflet').Map | null = null;
    let sizeObserver: ResizeObserver | null = null;
    let invalidate: (() => void) | null = null;
    let rafId = 0;
    let resizeRaf = 0;

    (async () => {
      const L = await import('leaflet');
      if (cancelled.current) return;
      const el = containerRef.current;
      if (!el) return;

      // Guard against duplicate init on the same DOM node (StrictMode remount / HMR / fast nav).
      if ((el as HTMLElement & { _leaflet_id?: unknown })._leaflet_id != null || mapRef.current) return;

      // Don't init Leaflet while the container is detached or 0x0 (mobile layout settling).
      // Initializing on a zero-size container leaves panes unpositioned and later
      // marker/popup/zoom operations read `._leaflet_pos` of undefined -> Runtime TypeError.
      const visible = await waitForVisibleSize(el, cancelled);
      if (cancelled.current || !visible) return;
      if (containerRef.current !== el || !el.isConnected) return;
      if ((el as HTMLElement & { _leaflet_id?: unknown })._leaflet_id != null || mapRef.current) return;

      map = L.map(el, { zoomControl: false }).setView([20.2961, 85.8245], 15);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
      markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // Container just became visible / layout may still settle (mobile URL bar, fonts).
      invalidate = () => {
        if (cancelled.current || !mapRef.current) return;
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          try { mapRef.current?.invalidateSize(); } catch { /* container gone */ }
        });
      };
      rafId = requestAnimationFrame(() => {
        if (!cancelled.current) {
          try { map?.invalidateSize(); } catch { /* ignore */ }
          setMapReady(true);
        }
      });

      sizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidate) : null;
      sizeObserver?.observe(el);
      window.addEventListener('resize', invalidate);
      window.addEventListener('orientationchange', invalidate);
    })();

    return () => {
      cancelled.current = true;
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRaf);
      sizeObserver?.disconnect();
      if (invalidate) {
        window.removeEventListener('resize', invalidate);
        window.removeEventListener('orientationchange', invalidate);
      }
      const m = mapRef.current ?? map;
      mapRef.current = null;
      markersRef.current = null;
      setMapReady(false);
      try { m?.off(); } catch { /* already torn down */ }
      try { m?.remove(); } catch { /* container already detached */ }
    };
    // Intentionally keyed on hasData only: map instance is stable, markers update separately.
  }, [hasData]);

  // Effect 2: render markers into the stable map instance (no map rebuild).
  useEffect(() => {
    if (!hasData || !mapReady) return;
    const cancelled = { current: false };
    (async () => {
      const L = await import('leaflet');
      const map = mapRef.current;
      const layer = markersRef.current;
      if (cancelled.current || !map || !layer) return;
      layer.clearLayers();
      const icon = L.divIcon({ className: '', html: '<div style="width:28px;height:28px;border-radius:50%;background:#1f4a2e;border:3px solid white;box-shadow:0 5px 13px #0003;display:grid;place-items:center;color:white;font-size:13px">•</div>', iconSize: [28, 28], iconAnchor: [14, 14] });
      valid.forEach(d => {
        L.marker([d.lat!, d.lng!], { icon }).addTo(layer).bindPopup(`<strong>${escapeHtml(d.title)}</strong><br/>${escapeHtml(d.date)} · ${escapeHtml(d.time)}`);
      });
      if (currentLocation) {
        L.circleMarker([currentLocation.lat, currentLocation.lng], { radius: 7, color: '#1f4a2e', fillColor: '#6e9d58', fillOpacity: 1, weight: 3 }).addTo(layer).bindPopup('<strong>You are here</strong><br/>Current location is only used for this local session.');
      }
      const all: LatLng[] = [...valid.map(d => ({ lat: d.lat!, lng: d.lng! })), ...(currentLocation ? [currentLocation] : [])];
      if (all.length === 1) {
        try { map.setView([all[0].lat, all[0].lng], 15); } catch { /* map torn down */ }
      } else if (all.length > 1) {
        try {
          map.invalidateSize();
          map.fitBounds(L.latLngBounds(all.map(p => [p.lat, p.lng] as [number, number])).pad(0.15));
        } catch { /* container resized mid-update */ }
      }
    })();
    return () => { cancelled.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, hasData, discoveries, currentLocation]);

  if (!hasData) return <div className="map-placeholder"><div><div className="map-placeholder-icon">◉</div><strong>No mapped discoveries yet</strong><div className="small">Allow location during your next exploration.</div></div></div>;
  // minHeight guarantees a measurable box even before globals.css applies on mobile,
  // so Leaflet never initializes on a 0-height container.
  return <div ref={containerRef} className="map" style={{ width: '100%', height: '100%', minHeight: 280 }} />;
}

export default MapView;
