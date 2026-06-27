'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';
import { PasoFronterizo, EstadoPaso, N8nDobleRutaResponse, OrsResponse } from '@/lib/types';
import styles from './MapArea.module.css';

interface MapViewProps {
  pasos: PasoFronterizo[];
  onSelectPaso: (paso: PasoFronterizo) => void;
  selectedPasoId?: string;
  rutaResultado?: N8nDobleRutaResponse | null;   // C7: nuevo prop doble ruta
  alternativeIsFocused?: boolean;                 // C7: para intercambio de colores
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

// C7: Colores de rutas
const ROUTE_COLORS = {
  primary:     { bright: '#2563eb', dim: '#7BA7C9' },
  casing:      { dark: 'rgba(15,23,42,0.6)', light: 'rgba(255,255,255,0.6)' },
};

type MarkerEntry = { outer: L.CircleMarker };



// ── Helper: construir polilíneas para una ruta ORS ───────────────────────────
function buildRoutePolylines(
  ors: OrsResponse,
  color: string,
  casingColor: string,
  isDark: boolean,
  tooltipBg: string,
  tooltipTxt: string,
  tooltipBdr: string,
  label: string,
  lineOpacity: number,
  casingOpacity: number
): { casing: L.Polyline; line: L.Polyline; bounds: L.LatLngBounds } {
  const feature = ors.features[0];
  const latlngs: L.LatLngExpression[] = feature.geometry.coordinates.map(
    ([lng, lat]) => [lat, lng]
  );

  const casing = L.polyline(latlngs, {
    color:   casingColor,
    weight:  10,
    opacity: casingOpacity,
    lineCap: 'round',
    lineJoin: 'round',
  });

  const line = L.polyline(latlngs, {
    color,
    weight:  5,
    opacity: lineOpacity,
    lineCap: 'round',
    lineJoin: 'round',
  });

  const { summary } = feature.properties;
  const km  = (summary.distance / 1000).toFixed(1);
  const min = Math.round(summary.duration / 60);
  const hrs = Math.floor(min / 60);
  const rem = min % 60;
  const durStr = hrs > 0 ? `${hrs}h ${rem}min` : `${min} min`;

  line.bindTooltip(
    `<div style="
      background:${tooltipBg};
      backdrop-filter:blur(8px);
      color:${tooltipTxt};
      border:1px solid ${tooltipBdr};
      padding:8px 14px;
      border-radius:24px;
      font-size:13px;
      font-weight:600;
      font-family:system-ui,-apple-system,sans-serif;
      white-space:nowrap;
      box-shadow:0 4px 16px rgba(0,0,0,0.12);
      pointer-events:none;
    ">${label} 🛣 ${km} km &nbsp;·&nbsp; ⏱ ${durStr}</div>`,
    { sticky: true, className: 'leaflet-tooltip-custom', opacity: 1 }
  );

  return { casing, line, bounds: L.latLngBounds(latlngs) };
}

export default function MapView({
  pasos,
  onSelectPaso,
  selectedPasoId,
  rutaResultado,
  alternativeIsFocused = false,
}: MapViewProps) {
  const mapRef            = useRef<L.Map | null>(null);
  const markersRef        = useRef<Map<string, MarkerEntry>>(new Map());
  const pulseRef          = useRef<L.Marker | null>(null);
  const routeLayerPrimRef = useRef<L.LayerGroup | null>(null);  // C7: capa primaria
  const routeLayerAltRef  = useRef<L.LayerGroup | null>(null);  // C7: capa alternativa
  const routePrimLineRef  = useRef<L.Polyline | null>(null);    // C7: línea primaria (para setStyle)
  const routeAltLineRef   = useRef<L.Polyline | null>(null);    // C7: línea alt (para setStyle)
  const routePrimCasRef   = useRef<L.Polyline | null>(null);
  const routeAltCasRef    = useRef<L.Polyline | null>(null);
  const tileRef           = useRef<L.TileLayer | null>(null);
  const containerRef      = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const lightTile   = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const darkTile    = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const chileBounds: L.LatLngBoundsExpression = [
      [-54.5, -76.0],
      [-17.0, -64.5],
    ];

    const map = L.map(containerRef.current, {
      center: [-36.0, -70.5],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [[-60.0, -82.0], [-14.0, -60.0]],
      maxBoundsViscosity: 0.8,
    });

    map.fitBounds(chileBounds, { padding: [20, 20] });
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

  // ── C7: Dibujar/actualizar DOS rutas ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Limpiar capas anteriores
    if (routeLayerPrimRef.current) {
      routeLayerPrimRef.current.remove();
      routeLayerPrimRef.current = null;
    }
    if (routeLayerAltRef.current) {
      routeLayerAltRef.current.remove();
      routeLayerAltRef.current = null;
    }
    routePrimLineRef.current = null;
    routeAltLineRef.current  = null;
    routePrimCasRef.current  = null;
    routeAltCasRef.current   = null;

    if (!rutaResultado) return;

    const casingColor = isDark
      ? ROUTE_COLORS.casing.dark
      : ROUTE_COLORS.casing.light;

    const tooltipBg  = isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)';
    const tooltipTxt = isDark ? '#f8fafc' : '#0f172a';
    const tooltipBdr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';

    // Determinar colores y opacidades iniciales según el estado de enfoque
    const primColor = alternativeIsFocused ? ROUTE_COLORS.primary.dim : ROUTE_COLORS.primary.bright;
    const altColor  = alternativeIsFocused ? ROUTE_COLORS.primary.bright : ROUTE_COLORS.primary.dim;
    
    const primOp = alternativeIsFocused ? 0.35 : 0.9;
    const altOp  = alternativeIsFocused ? 0.9 : 0.35;
    
    const primCasOp = alternativeIsFocused ? 0.2 : 1;
    const altCasOp  = alternativeIsFocused ? 1 : 0.2;

    // ── Ruta Primaria ─────────────────────────────────────────────────────────
    const prim = buildRoutePolylines(
      rutaResultado.rutaPrimaria,
      primColor,
      casingColor,
      isDark,
      tooltipBg, tooltipTxt, tooltipBdr,
      '⭐ Ruta primaria:',
      primOp, primCasOp
    );
    const layerPrim = L.layerGroup([prim.casing, prim.line]).addTo(map);
    routeLayerPrimRef.current = layerPrim;
    routePrimLineRef.current  = prim.line;
    routePrimCasRef.current   = prim.casing;

    // ── Ruta Alternativa ──────────────────────────────────────────────────────
    const alt = buildRoutePolylines(
      rutaResultado.rutaAlternativa,
      altColor,
      casingColor,
      isDark,
      tooltipBg, tooltipTxt, tooltipBdr,
      '📍 Ruta alternativa:',
      altOp, altCasOp
    );
    const layerAlt = L.layerGroup([alt.casing, alt.line]).addTo(map);
    routeLayerAltRef.current = layerAlt;
    routeAltLineRef.current  = alt.line;
    routeAltCasRef.current   = alt.casing;

    // fitBounds combinando AMBAS rutas
    const combinedBounds = prim.bounds.extend(alt.bounds);
    map.fitBounds(combinedBounds, { padding: [48, 48], maxZoom: 14, animate: true });

    return () => {
      layerPrim.remove();
      layerAlt.remove();
      routeLayerPrimRef.current = null;
      routeLayerAltRef.current  = null;
      routePrimLineRef.current  = null;
      routeAltLineRef.current   = null;
      routePrimCasRef.current   = null;
      routeAltCasRef.current    = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutaResultado, isDark]);

  // ── C7: Intercambio de colores + z-order al enfocar ─────────────────────
  // Se ejecuta solo cuando cambia alternativeIsFocused (sin re-dibujar)
  useEffect(() => {
    const map     = mapRef.current;
    const primLine = routePrimLineRef.current;
    const altLine  = routeAltLineRef.current;
    const primCas  = routePrimCasRef.current;
    const altCas   = routeAltCasRef.current;
    const primLayer = routeLayerPrimRef.current;
    const altLayer  = routeLayerAltRef.current;
    if (!map || !primLine || !altLine || !primLayer || !altLayer) return;

    if (alternativeIsFocused) {
      // Alternativa brillante y encima, primaria opaca y debajo
      primLine.setStyle({ color: ROUTE_COLORS.primary.dim, opacity: 0.35 });
      altLine.setStyle({ color: ROUTE_COLORS.primary.bright, opacity: 0.9 });
      primCas?.setStyle({ opacity: 0.2 });
      altCas?.setStyle({ opacity: 1 });
      // Reordenar capas: primaria primero (debajo), alternativa encima
      primLayer.remove();
      altLayer.remove();
      primLayer.addTo(map);
      altLayer.addTo(map);
    } else {
      // Primaria brillante y encima, alternativa opaca y debajo
      primLine.setStyle({ color: ROUTE_COLORS.primary.bright, opacity: 0.9 });
      altLine.setStyle({ color: ROUTE_COLORS.primary.dim, opacity: 0.35 });
      primCas?.setStyle({ opacity: 1 });
      altCas?.setStyle({ opacity: 0.2 });
      // Reordenar capas: alternativa primero (debajo), primaria encima
      primLayer.remove();
      altLayer.remove();
      altLayer.addTo(map);
      primLayer.addTo(map);
    }
  }, [alternativeIsFocused]);

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
    const size  = 20;
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
        return;
      }

      const tooltipBg  = isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)';
      const tooltipTxt = isDark ? '#f8fafc' : '#0f172a';
      const tooltipBdr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';

      const outer = L.circleMarker(latlng, {
        pane:        'markerPane',
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
        targetPoint.y += window.innerHeight * 0.2;
      } else {
        targetPoint.x += 176;
      }
      
      const targetLatLng = map.unproject(targetPoint, zoom);
      map.flyTo(targetLatLng, zoom, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [selectedPasoId, pasos]);

  return <div ref={containerRef} className={styles.mapContainer} />;
}
