'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';
import { PasoFronterizo, EstadoPaso } from '@/lib/types';
import styles from './MapArea.module.css';

interface MapViewProps {
  pasos: PasoFronterizo[];
  onSelectPaso: (paso: PasoFronterizo) => void;
  selectedPasoId?: string;
}

const STATUS_COLORS: Record<EstadoPaso, string> = {
  abierto:    '#10b981',
  precaucion: '#f59e0b',
  cerrado:    '#ef4444',
};

const STATUS_LABELS: Record<EstadoPaso, string> = {
  abierto:    'ABIERTO',
  precaucion: 'PRECAUCIÓN',
  cerrado:    'CERRADO',
};

type MarkerEntry = { outer: L.CircleMarker };

function createPopupContent(paso: PasoFronterizo, isDark: boolean): string {
  const color     = STATUS_COLORS[paso.estado];
  const bg        = isDark ? '#0f172a' : '#ffffff';
  const textMain  = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const border    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';

  return `<div style="
    background:${bg};color:${textMain};
    border:1px solid ${border};border-radius:16px;
    padding:16px;min-width:240px;
    font-family:system-ui,-apple-system,sans-serif;
    box-shadow:0 12px 40px rgba(0,0,0,0.2);
  ">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
      <div>
        <div style="font-size:16px;font-weight:700;letter-spacing:-0.01em;">${paso.nombre}</div>
        ${paso.subtitulo ? `<div style="font-size:12px;color:${textMuted};margin-top:2px;">${paso.subtitulo}</div>` : ''}
      </div>
    </div>
    
    <div style="
      display:flex;align-items:center;gap:8px;
      background:${color}15;border:1px solid ${color}30;
      border-radius:8px;padding:8px 12px;margin-bottom:16px;
    ">
      <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;box-shadow:0 0 6px ${color};"></div>
      <span style="font-size:12px;font-weight:700;color:${color};letter-spacing:0.02em;">ESTADO: ${STATUS_LABELS[paso.estado]}</span>
    </div>
    
    <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;color:${textMuted};">
      <div style="display:flex;align-items:center;gap:6px;"><span style="opacity:0.7">📍</span> ${paso.region}</div>
      ${paso.altitud ? `<div style="display:flex;align-items:center;gap:6px;"><span style="opacity:0.7">⛰</span> ${paso.altitud.toLocaleString()} m.s.n.m.</div>` : ''}
      <div style="display:flex;align-items:center;gap:6px;"><span style="opacity:0.7">🕐</span> Actualizado: ${paso.ultimaActualizacion}</div>
    </div>
  </div>`;
}

export default function MapView({ pasos, onSelectPaso, selectedPasoId }: MapViewProps) {
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<Map<string, MarkerEntry>>(new Map());
  const pulseRef     = useRef<L.Marker | null>(null);
  const tileRef      = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const lightTile   = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const darkTile    = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Chile spans from ~-17.6 (Visviri) to ~-52.3 (Bellavista), longitude ~-66 to -75
    const chileBounds: L.LatLngBoundsExpression = [
      [-54.5, -76.0], // SW — sur de Magallanes + margen
      [-17.0, -64.5], // NE — norte de Arica + margen
    ];

    const map = L.map(containerRef.current, {
      center: [-36.0, -70.5],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [[-60.0, -82.0], [-14.0, -60.0]], // restringe el paneo a la zona Chile-Argentina
      maxBoundsViscosity: 0.8,
    });

    // Ajustar para que Chile quede perfectamente encuadrado al inicio
    map.fitBounds(chileBounds, { padding: [20, 20] });

    // Zoom buttons in the bottom right corner
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tile = L.tileLayer(isDark ? darkTile : lightTile, { attribution, maxZoom: 18 });
    tile.addTo(map);
    tileRef.current = tile;

    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current!);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tile on theme change
  useEffect(() => {
    if (!tileRef.current) return;
    tileRef.current.setUrl(isDark ? darkTile : lightTile);
  }, [isDark, darkTile, lightTile]);

  // Pulse ring for selected marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pulseRef.current) {
      pulseRef.current.remove();
      pulseRef.current = null;
    }

    if (!selectedPasoId) return;
    const paso = pasos.find((p) => p.id === selectedPasoId);
    if (!paso) return;

    const color = STATUS_COLORS[paso.estado];
    const size  = 20; // Matches selected marker radius (10) * 2
    const half  = size / 2;

    const pulseIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        --pulse-color: ${color}99;
        animation: markerPulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        pointer-events:none;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [half, half],
    });

    const pulseMkr = L.marker([paso.lat, paso.lng], {
      icon: pulseIcon,
      interactive: false,
      zIndexOffset: -500,
    });
    pulseMkr.addTo(map);
    pulseRef.current = pulseMkr;
  }, [selectedPasoId, pasos]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove stale markers
    markersRef.current.forEach((entry, id) => {
      if (!pasos.find((p) => p.id === id)) {
        entry.outer.remove();
        markersRef.current.delete(id);
      }
    });

    pasos.forEach((paso) => {
      const color      = STATUS_COLORS[paso.estado];
      const isSelected = paso.id === selectedPasoId;
      const radius     = isSelected ? 10 : 7;
      const latlng: L.LatLngExpression = [paso.lat, paso.lng];
      const existing   = markersRef.current.get(paso.id);
      
      const borderColor = isDark ? '#0f172a' : '#ffffff';

      if (existing) {
        existing.outer.setStyle({
          color:       borderColor,
          weight:      2.5,
          fillColor:   color,
          fillOpacity: 1,
          radius,
        });
        existing.outer.setLatLng(latlng);
        existing.outer.setPopupContent(createPopupContent(paso, isDark));
        return;
      }

      // Tooltip: only on hover
      const tooltipBg  = isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)';
      const tooltipTxt = isDark ? '#f8fafc' : '#0f172a';
      const tooltipBdr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';

      const outer = L.circleMarker(latlng, {
        radius,
        color:       borderColor,
        weight:      2.5,
        fillColor:   color,
        fillOpacity: 1,
        interactive: true,
        bubblingMouseEvents: false,
      });

      outer.bindTooltip(
        `<div style="
          background:${tooltipBg};
          backdrop-filter:blur(8px);
          color:${tooltipTxt};
          border:1px solid ${tooltipBdr};
          padding:6px 14px;
          border-radius:24px;
          font-size:13px;
          font-weight:600;
          font-family:system-ui,-apple-system,sans-serif;
          white-space:nowrap;
          box-shadow:0 4px 16px rgba(0,0,0,0.12);
          pointer-events:none;
        ">${paso.nombre}</div>`,
        {
          permanent:  false,
          direction:  'right',
          offset:     [radius + 4, 0],
          className:  'leaflet-tooltip-custom',
          opacity:    1,
        }
      );

      outer.bindPopup(createPopupContent(paso, isDark), {
        maxWidth:    300,
        className:   'leaflet-popup-custom',
        closeButton: true,
        offset:      [0, -radius]
      });

      outer.on('click', () => {
        onSelectPaso(paso);
      });
      
      outer.addTo(map);
      markersRef.current.set(paso.id, { outer });
    });
  }, [pasos, isDark, onSelectPaso, selectedPasoId]);

  // Fly to selected paso if changed externally
  useEffect(() => {
    if (!mapRef.current || !selectedPasoId) return;
    const paso = pasos.find((p) => p.id === selectedPasoId);
    if (paso) {
      const map = mapRef.current;
      const zoom = map.getZoom() > 8 ? map.getZoom() : 8;
      
      const targetPoint = map.project([paso.lat, paso.lng], zoom);
      const isMobile  = window.innerWidth <= 768;
      
      if (isMobile) {
        // Shift map center down to move point up, avoiding bottom sheet
        targetPoint.y += window.innerHeight * 0.2;
      } else {
        // Shift map center right to move point left, avoiding side panel (width: 352px)
        targetPoint.x += 176;
      }
      
      const targetLatLng = map.unproject(targetPoint, zoom);
      map.flyTo(targetLatLng, zoom, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [selectedPasoId, pasos]);

  return <div ref={containerRef} className={styles.mapContainer} />;
}
