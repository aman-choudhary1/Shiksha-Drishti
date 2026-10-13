import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, IconButton,
  Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Stack, TextField, InputAdornment, alpha
} from '@mui/material';
import {
  Compass, MapPin, Award, Activity, TrendingUp, TrendingDown,
  Search, RefreshCw, Layers, Sliders, ChevronRight, School,
  Users, CheckCircle2, AlertTriangle, ArrowUpRight, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Bounding box for Chhattisgarh state geometry projection
const MIN_LON = 80.0;
const MAX_LON = 84.8;
const MIN_LAT = 17.7;
const MAX_LAT = 24.2;

function projectCoord([lon, lat], width = 560, height = 650, padding = 26) {
  const x = padding + ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * (width - 2 * padding);
  const y = height - padding - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * (height - 2 * padding);
  return [x, y];
}

function ringToPathD(ring, width, height) {
  if (!ring || ring.length === 0) return '';
  return ring
    .map((pt, i) => {
      const [x, y] = projectCoord(pt, width, height);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

function geometryToD(geometry, width, height) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => ringToPathD(ring, width, height)).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .flatMap(polygon => polygon.map(ring => ringToPathD(ring, width, height)))
      .join(' ');
  }
  return '';
}

function getCentroid(geometry, width, height) {
  let pts = [];
  if (geometry.type === 'Polygon') {
    pts = geometry.coordinates[0] || [];
  } else if (geometry.type === 'MultiPolygon') {
    pts = (geometry.coordinates[0] && geometry.coordinates[0][0]) || [];
  }
  if (pts.length === 0) return [width / 2, height / 2];

  let sumX = 0, sumY = 0;
  pts.forEach(pt => {
    const [x, y] = projectCoord(pt, width, height);
    sumX += x;
    sumY += y;
  });
  return [sumX / pts.length, sumY / pts.length];
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

const ALIAS_MAP = {
  [norm('gaurela')]: norm('gourela pendra marvahi'),
  [norm('gaurelapendramarwahi')]: norm('gourela pendra marvahi'),
  [norm('khairagarh')]: norm('khairagarh chuikhadan gandai'),
  [norm('khairagarhchuikhadangandai')]: norm('khairagarh chuikhadan gandai'),
  [norm('mohlamanpurambagarhchowki')]: norm('mohla manpur chowki'),
  [norm('mohlamanpur')]: norm('mohla manpur chowki'),
  [norm('bastar')]: norm('baster'),
  [norm('gariyaband')]: norm('gariaband'),
  [norm('kabirdham')]: norm('kawardha'),
  [norm('korea')]: norm('koriya'),
  [norm('balodabazar')]: norm('balodabzar'),
};

export default function StateHeatmapMap({
  districtData = [],
  selectedDistrict = 'ALL',
  onSelectDistrict = () => {},
  loading = false
}) {
  const [geoFeatures, setGeoFeatures] = useState([]);
  const [metricMode, setMetricMode] = useState('avg_score'); // 'avg_score', 'pass_rate', 'high_achievers', 'remedial'
  const [hoveredDist, setHoveredDist] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [searchFilter, setSearchFilter] = useState('');
  const mapCanvasRef = useRef(null);

  // 1. Load GeoJSON
  useEffect(() => {
    async function loadGeo() {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}chhattisgarh_districts.json`);
        const data = await res.json();
        if (data && data.features) {
          setGeoFeatures(data.features);
        }
      } catch (err) {
        console.error('Failed to load Chhattisgarh GeoJSON:', err);
      }
    }
    loadGeo();
  }, []);

  const updateTooltipPos = (e) => {
    if (mapCanvasRef.current) {
      const rect = mapCanvasRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    } else {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  // Lookup map for district metrics
  const statsMap = useMemo(() => {
    const map = {};
    districtData.forEach(d => {
      const k = norm(d.district_name);
      map[k] = d;
      if (ALIAS_MAP[k]) map[ALIAS_MAP[k]] = d;
      if (d.district_cd) map[`cd_${d.district_cd}`] = d;
      if (d.district_id) map[`id_${d.district_id}`] = d;
    });
    return map;
  }, [districtData]);

  // Color logic based on active metric
  const getDistrictColor = (stats) => {
    if (!stats || !stats.evaluated_students || Number(stats.evaluated_students) === 0) {
      return {
        fill: '#f1f5f9',
        stroke: '#cbd5e1',
        textFill: '#64748b',
        hoverFill: '#e2e8f0',
        valText: 'No Data',
        valNum: 0,
        tier: 'Unreported',
      };
    }

    if (metricMode === 'avg_score') {
      const score = Number(stats.avg_score_pct || 0);
      if (score >= 70) {
        return { fill: '#d1fae5', stroke: '#059669', hoverFill: '#a7f3d0', textFill: '#065f46', valText: `${score}%`, valNum: score, tier: 'Excellent' };
      } else if (score >= 60) {
        return { fill: '#e0f2fe', stroke: '#0284c7', hoverFill: '#bae6fd', textFill: '#0369a1', valText: `${score}%`, valNum: score, tier: 'Good' };
      } else if (score >= 50) {
        return { fill: '#fef3c7', stroke: '#d97706', hoverFill: '#fde68a', textFill: '#92400e', valText: `${score}%`, valNum: score, tier: 'Average' };
      } else {
        return { fill: '#fee2e2', stroke: '#dc2626', hoverFill: '#fecaca', textFill: '#991b1b', valText: `${score}%`, valNum: score, tier: 'Remedial' };
      }
    } else if (metricMode === 'pass_rate') {
      const pass = Number(stats.pass_rate_pct || 0);
      if (pass >= 85) {
        return { fill: '#d1fae5', stroke: '#059669', hoverFill: '#a7f3d0', textFill: '#065f46', valText: `${pass}%`, valNum: pass, tier: 'High Pass' };
      } else if (pass >= 70) {
        return { fill: '#e0f2fe', stroke: '#0284c7', hoverFill: '#bae6fd', textFill: '#0369a1', valText: `${pass}%`, valNum: pass, tier: 'Moderate' };
      } else {
        return { fill: '#fee2e2', stroke: '#dc2626', hoverFill: '#fecaca', textFill: '#991b1b', valText: `${pass}%`, valNum: pass, tier: 'Low Pass' };
      }
    } else if (metricMode === 'high_achievers') {
      const ha = Number(stats.high_achievers || 0);
      return { fill: '#eff6ff', stroke: '#3b82f6', hoverFill: '#bfdbfe', textFill: '#1e40af', valText: ha.toLocaleString(), valNum: ha, tier: 'High Achievers' };
    } else {
      const rem = Number(stats.remedial_students || 0);
      return { fill: '#fff1f2', stroke: '#e11d48', hoverFill: '#fecdd3', textFill: '#9f1239', valText: rem.toLocaleString(), valNum: rem, tier: 'Remedial Cohort' };
    }
  };

  const selectedDistObj = useMemo(() => {
    if (!selectedDistrict || selectedDistrict === 'ALL') return null;
    return districtData.find(d =>
      String(d.district_name).toLowerCase() === String(selectedDistrict).toLowerCase() ||
      String(d.district_cd) === String(selectedDistrict)
    ) || null;
  }, [selectedDistrict, districtData]);

  const sortedLeaderboard = useMemo(() => {
    let list = [...districtData];
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(d => (d.district_name || '').toLowerCase().includes(q));
    }
    return list.sort((a, b) => (Number(b.avg_score_pct) || 0) - (Number(a.avg_score_pct) || 0));
  }, [districtData, searchFilter]);

  const mapWidth = 560;
  const mapHeight = 650;

  return (
    <Card elevation={0} className="glass-card-premium" sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 3 }}>
      {/* ── Top Header Bar ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5,
            background: 'linear-gradient(135deg, #0f3460, #0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
          }}>
            <Compass size={24} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography
                onClick={() => onSelectDistrict('ALL')}
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1rem', sm: '1.15rem' },
                  color: selectedDistObj ? '#0284c7' : '#0f172a',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Chhattisgarh State GIS Cartography
              </Typography>
              {selectedDistObj && (
                <>
                  <ChevronRight size={16} color="#94a3b8" />
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.15rem' }, color: '#059669' }}>
                    {selectedDistObj.district_name}
                  </Typography>
                </>
              )}
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              Live district-wise telemetry computed directly from class report cards ({geoFeatures.length} districts mapped)
            </Typography>
          </Box>
        </Box>

        {/* ── Metric Mode Selectors ── */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {[
            { id: 'avg_score', label: 'Average Score', icon: <BarChart2 size={13} /> },
            { id: 'pass_rate', label: 'Pass Rate %', icon: <CheckCircle2 size={13} /> },
            { id: 'high_achievers', label: 'High Achievers (≥70%)', icon: <Award size={13} /> },
            { id: 'remedial', label: 'Remedial (<40%)', icon: <AlertTriangle size={13} /> },
          ].map(btn => (
            <Button
              key={btn.id}
              size="small"
              variant={metricMode === btn.id ? 'contained' : 'outlined'}
              onClick={() => setMetricMode(btn.id)}
              startIcon={btn.icon}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontSize: '0.72rem',
                fontWeight: 700,
                py: 0.6,
                px: 1.4,
                background: metricMode === btn.id ? 'linear-gradient(135deg, #0f3460, #0284c7)' : 'transparent',
                borderColor: metricMode === btn.id ? 'transparent' : '#e2e8f0',
                color: metricMode === btn.id ? '#ffffff' : '#475569',
                '&:hover': {
                  borderColor: '#0284c7',
                  background: metricMode === btn.id ? 'linear-gradient(135deg, #0f3460, #0284c7)' : alpha('#0284c7', 0.06),
                }
              }}
            >
              {btn.label}
            </Button>
          ))}
          {selectedDistrict !== 'ALL' && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => onSelectDistrict('ALL')}
              startIcon={<RefreshCw size={12} />}
              sx={{ fontSize: '0.72rem', borderRadius: 2 }}
            >
              View State
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── Main Layout: Map Canvas + Side Intelligence Dossier ── */}
      <Box className="vsk-grid-map-panel">
        {/* ── 1. SVG Map Container ── */}
        <Box
          ref={mapCanvasRef}
          sx={{
            position: 'relative',
            borderRadius: 3,
            p: { xs: 1, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 50%, #f8fafc 0%, #edf2f7 100%)',
            border: '1px solid #e2e8f0',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
            minHeight: { xs: 460, md: 580 },
            overflow: 'hidden'
          }}
        >
          {loading && (
            <Box sx={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
              px: 1.5, py: 0.5, borderRadius: 2, border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.72rem', fontWeight: 700, color: '#0284c7'
            }}>
              <Activity size={14} className="spin" /> Updating Map Telemetry...
            </Box>
          )}

          <svg
            width={mapWidth}
            height={mapHeight}
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            style={{ width: '100%', height: 'auto', maxHeight: '620px', filter: 'drop-shadow(0 8px 16px rgba(15,23,42,0.06))' }}
          >
            <defs>
              <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render 33 District Polygons */}
            {geoFeatures.map((feat, idx) => {
              const geoCd = String(feat.properties?.dist_id || feat.properties?.udise_code || feat.properties?.dt_code || '');
              const displayName = feat.properties?.District_N || feat.properties?.name || feat.properties?.PMP || `District ${idx}`;
              const distId = feat.properties?.dist_id || idx;

              const candidates = [
                geoCd ? `cd_${geoCd}` : null,
                norm(feat.properties?.PMP),
                norm(feat.properties?.name),
                norm(feat.properties?.District_N),
                norm(displayName),
              ];

              let stats = null;
              for (const c of candidates) {
                if (!c) continue;
                stats = statsMap[c] || statsMap[ALIAS_MAP[c]];
                if (stats) break;
              }
              if (!stats) stats = statsMap[`id_${distId}`];

              const colorInfo = getDistrictColor(stats);
              const pathD = geometryToD(feat.geometry, mapWidth, mapHeight);
              const [cx, cy] = getCentroid(feat.geometry, mapWidth, mapHeight);

              const isSelected = selectedDistObj && (
                String(selectedDistObj.district_cd) === String(geoCd) ||
                norm(selectedDistObj.district_name) === norm(displayName) ||
                norm(selectedDistObj.district_name) === norm(feat.properties?.name)
              );

              const isHovered = hoveredDist && hoveredDist.rawName === displayName;

              let fillVal = colorInfo.fill;
              let strokeVal = colorInfo.stroke;
              let strokeW = 1.3;

              if (isSelected) {
                fillVal = '#0284c7'; // Active Sky Blue
                strokeVal = '#0f3460';
                strokeW = 3.2;
              } else if (isHovered) {
                fillVal = colorInfo.hoverFill;
                strokeVal = '#0f3460';
                strokeW = 2.4;
              }

              return (
                <g key={idx} style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
                  <path
                    d={pathD}
                    fill={fillVal}
                    stroke={strokeVal}
                    strokeWidth={strokeW}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    onClick={() => {
                      onSelectDistrict(stats?.district_name || displayName);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredDist({ rawName: stats?.district_name || displayName, stats, colorInfo });
                      updateTooltipPos(e);
                    }}
                    onMouseMove={updateTooltipPos}
                    onMouseLeave={() => setHoveredDist(null)}
                  />

                  {/* Centroid marker dot */}
                  {!isSelected && colorInfo.valNum > 0 && (
                    <circle
                      cx={cx}
                      cy={cy - 4}
                      r={isHovered ? 5 : 3.5}
                      fill={colorInfo.stroke}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}

                  {/* Clean cartographic label with halo */}
                  <text
                    x={cx}
                    y={cy + 8}
                    textAnchor="middle"
                    fill={isSelected ? '#ffffff' : '#0f172a'}
                    fontSize="9px"
                    fontWeight="800"
                    style={{
                      pointerEvents: 'none',
                      paintOrder: 'stroke fill',
                      stroke: isSelected ? 'none' : '#ffffff',
                      strokeWidth: isSelected ? '0px' : '2.4px',
                      strokeLinejoin: 'round',
                    }}
                  >
                    {(stats?.district_name || displayName).substring(0, 11)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* ── Interactive Cursor Hover Tooltip ── */}
          {hoveredDist && (
            <Box
              sx={{
                position: 'absolute',
                left: Math.min(tooltipPos.x + 16, (mapCanvasRef.current?.clientWidth || 500) - 230),
                top: Math.max(tooltipPos.y - 65, 12),
                zIndex: 999,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                p: 1.5,
                borderRadius: 2.5,
                border: `2px solid ${hoveredDist.colorInfo.stroke}`,
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.15)',
                pointerEvents: 'none',
                minWidth: 200,
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', mb: 0.5 }}>
                📍 {hoveredDist.rawName}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, fontSize: '0.74rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.74rem' }}>Average Score:</Typography>
                  <Typography sx={{ fontWeight: 800, color: hoveredDist.colorInfo.stroke, fontSize: '0.74rem' }}>
                    {hoveredDist.stats?.avg_score_pct ? `${hoveredDist.stats.avg_score_pct}%` : 'Unreported'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.74rem' }}>Pass Rate:</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.74rem' }}>
                    {hoveredDist.stats?.pass_rate_pct ? `${hoveredDist.stats.pass_rate_pct}%` : '0%'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.74rem' }}>Evaluated Cohort:</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.74rem' }}>
                    {Number(hoveredDist.stats?.evaluated_students || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.74rem' }}>Remedial Needs:</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#ef4444', fontSize: '0.74rem' }}>
                    {Number(hoveredDist.stats?.remedial_students || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* ── Legend Bar ── */}
          <Box sx={{
            position: 'absolute', bottom: 12, left: 12,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
            p: 1, borderRadius: 2, border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '0.7rem'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#059669' }} />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#334155' }}>≥70% High</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7' }} />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#334155' }}>60–70% Good</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#d97706' }} />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#334155' }}>50–60% Avg</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#334155' }}>&lt;50% Critical</Typography>
            </Box>
          </Box>
        </Box>

        {/* ── 2. Side Intelligence Panel & District Leaderboard ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Spotlight Dossier Card */}
          <Box sx={{
            p: 2, borderRadius: 3,
            background: selectedDistObj ? 'linear-gradient(135deg, #f0fdf4, #e0f2fe)' : '#f8fafc',
            border: `1px solid ${selectedDistObj ? '#a7f3d0' : '#e2e8f0'}`,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedDistObj ? '🎯 District Spotlight' : '🌟 State Leading District'}
              </Typography>
              {selectedDistObj && (
                <Chip
                  label={`Rank #${selectedDistObj.rank}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, background: '#0f3460', color: '#ffffff' }}
                />
              )}
            </Box>

            <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', mb: 0.5 }}>
              {selectedDistObj?.district_name || sortedLeaderboard[0]?.district_name || 'Chhattisgarh'}
            </Typography>
            <Typography sx={{ fontSize: '0.74rem', color: '#64748b', mb: 1.5 }}>
              {selectedDistObj
                ? `Total Schools: ${(selectedDistObj.school_count || 0).toLocaleString()} · Blocks: ${selectedDistObj.block_count || 0}`
                : 'Click any district polygon on the map to filter and drill into local performance'}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
              <Box sx={{ p: 1.25, borderRadius: 2, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Avg Score</Typography>
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 900, color: '#059669' }}>
                  {selectedDistObj?.avg_score_pct ?? sortedLeaderboard[0]?.avg_score_pct ?? 0}%
                </Typography>
              </Box>
              <Box sx={{ p: 1.25, borderRadius: 2, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Pass Rate</Typography>
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7' }}>
                  {selectedDistObj?.pass_rate_pct ?? sortedLeaderboard[0]?.pass_rate_pct ?? 0}%
                </Typography>
              </Box>
              <Box sx={{ p: 1.25, borderRadius: 2, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>High Achievers</Typography>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#3b82f6' }}>
                  {(selectedDistObj?.high_achievers ?? sortedLeaderboard[0]?.high_achievers ?? 0).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ p: 1.25, borderRadius: 2, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Remedial Needs</Typography>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#ef4444' }}>
                  {(selectedDistObj?.remedial_students ?? sortedLeaderboard[0]?.remedial_students ?? 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* District Academic League Leaderboard */}
          <Box sx={{ p: 2, borderRadius: 3, background: '#ffffff', border: '1px solid #e2e8f0', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                🏆 District Rankings
              </Typography>
              <Chip
                label={`${sortedLeaderboard.length} Districts`}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, background: '#f1f5f9' }}
              />
            </Box>

            <TextField
              size="small"
              placeholder="Search district..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={14} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  py: 0.2,
                }
              }}
            />

            <TableContainer sx={{ maxHeight: 310, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { background: '#f8fafc', fontSize: '0.68rem', fontWeight: 800, color: '#64748b', py: 0.8 } }}>
                    <TableCell>#</TableCell>
                    <TableCell>District</TableCell>
                    <TableCell align="right">Avg %</TableCell>
                    <TableCell align="right">Pass %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedLeaderboard.map((d, idx) => {
                    const isSelected = selectedDistObj && norm(selectedDistObj.district_name) === norm(d.district_name);
                    return (
                      <TableRow
                        key={idx}
                        onClick={() => onSelectDistrict(d.district_name)}
                        sx={{
                          cursor: 'pointer',
                          background: isSelected ? alpha('#0284c7', 0.1) : 'transparent',
                          '&:hover': { background: alpha('#0284c7', 0.05) },
                          '& td': { py: 0.7, fontSize: '0.74rem' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800, color: idx < 3 ? '#f59e0b' : '#64748b' }}>
                          #{idx + 1}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {d.district_name}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: Number(d.avg_score_pct) >= 70 ? '#059669' : Number(d.avg_score_pct) >= 60 ? '#0284c7' : '#ef4444' }}>
                          {d.avg_score_pct}%
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                          {d.pass_rate_pct}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
