import React, { useState } from 'react';
import { RoomLayout } from '../../server';
import { Compass, ZoomIn, ZoomOut, RotateCcw, Eye, Layers, Sparkles, Info } from 'lucide-react';

interface FloorPlan2DProps {
  rooms: RoomLayout[];
  plotLength: number;
  plotBreadth: number;
  facingDirection: string;
  totalFloors: number;
  activeFloor: number;
  onFloorChange: (floor: number) => void;
  onRoomSelect?: (room: RoomLayout) => void;
}

export const FloorPlan2D: React.FC<FloorPlan2DProps> = ({
  rooms,
  plotLength,
  plotBreadth,
  facingDirection,
  totalFloors,
  activeFloor,
  onFloorChange,
  onRoomSelect,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showFurniture, setShowFurniture] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showVastu, setShowVastu] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Filter rooms on current floor
  const floorRooms = rooms.filter((r) => r.floor === activeFloor);

  // SVG coordinate system sizing (1 ft = 18 SVG units)
  const scale = 18;
  const padding = 60;
  const svgWidth = plotBreadth * scale + padding * 2;
  const svgHeight = plotLength * scale + padding * 2;

  // Setback bounds
  const marginX = Math.max(2, Math.round(plotBreadth * 0.08));
  const marginY = Math.max(3, Math.round(plotLength * 0.1));
  const buildWidth = Math.max(20, plotBreadth - marginX * 2);
  const buildDepth = Math.max(25, plotLength - marginY * 2);

  // Color mapping by room type
  const getRoomColor = (type: string, isSelected: boolean) => {
    if (isSelected) return 'fill-amber-50 stroke-amber-500 stroke-2';
    switch (type) {
      case 'living':
        return 'fill-[#FAF8F5] stroke-[#2A2E33] stroke-1.5';
      case 'master_bedroom':
        return 'fill-[#F4F6F8] stroke-[#2A2E33] stroke-1.5';
      case 'bedroom':
        return 'fill-[#F7F9FA] stroke-[#2A2E33] stroke-1.5';
      case 'kitchen':
        return 'fill-[#FFF8F0] stroke-[#2A2E33] stroke-1.5';
      case 'dining':
        return 'fill-[#FAF7F2] stroke-[#2A2E33] stroke-1.5';
      case 'bathroom':
        return 'fill-[#F0F5FA] stroke-[#2A2E33] stroke-1.5';
      case 'pooja':
        return 'fill-[#FFFDF0] stroke-[#C5A059] stroke-1.5';
      case 'parking':
        return 'fill-[#F0F2F5] stroke-[#5A626A] stroke-1 stroke-dashed';
      case 'balcony':
      case 'garden':
        return 'fill-[#F0F7F2] stroke-[#4A7C59] stroke-1.5';
      default:
        return 'fill-[#FAFAFA] stroke-[#2A2E33] stroke-1.5';
    }
  };

  const getVastuBadgeColor = (type: string) => {
    switch (type) {
      case 'kitchen':
        return '#E53E3E'; // SE Fire
      case 'master_bedroom':
        return '#805AD5'; // SW Earth
      case 'living':
        return '#3182CE'; // NE Water
      case 'pooja':
        return '#D69E2E'; // NE Sacred
      default:
        return '#718096';
    }
  };

  const selectedRoom = floorRooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="relative flex flex-col h-full bg-[#1A1D20]/5 rounded-2xl border border-stone-200 overflow-hidden shadow-inner">
      {/* Top Floor Switcher & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white/90 backdrop-blur-md border-b border-stone-200 z-10">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => onFloorChange(1)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFloor === 1
                ? 'bg-stone-900 text-amber-300 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Ground Floor
          </button>
          {totalFloors >= 2 && (
            <button
              onClick={() => onFloorChange(2)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFloor === 2
                  ? 'bg-stone-900 text-amber-300 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              First Floor
            </button>
          )}
          {totalFloors >= 3 && (
            <button
              onClick={() => onFloorChange(3)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFloor === 3
                  ? 'bg-stone-900 text-amber-300 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Second Floor
            </button>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            title="Toggle Dimensions"
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showDimensions
                ? 'bg-stone-800 text-amber-300 border-stone-800'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Dimensions</span>
          </button>

          <button
            onClick={() => setShowFurniture(!showFurniture)}
            title="Toggle Furniture"
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showFurniture
                ? 'bg-stone-800 text-amber-300 border-stone-800'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Furniture</span>
          </button>

          <button
            onClick={() => setShowVastu(!showVastu)}
            title="Toggle Vastu Analysis"
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showVastu
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vastu Zones</span>
          </button>

          <div className="h-4 w-px bg-stone-300 mx-1" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
              className="p-1 hover:bg-stone-100 rounded text-stone-600"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 text-stone-600 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
              className="p-1 hover:bg-stone-100 rounded text-stone-600"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:bg-stone-100 rounded text-stone-600"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center min-h-[460px] bg-[#FAF8F5]">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="transition-transform duration-200 ease-out drop-shadow-md select-none"
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="rounded-xl overflow-hidden bg-white shadow-xl border border-stone-300"
          >
            <defs>
              {/* Architectural Grid Pattern */}
              <pattern id="archGridSmall" width="18" height="18" patternUnits="userSpaceOnUse">
                <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#F0ECE1" strokeWidth="0.8" />
              </pattern>
              <pattern id="archGridBig" width="90" height="90" patternUnits="userSpaceOnUse">
                <rect width="90" height="90" fill="url(#archGridSmall)" />
                <path d="M 90 0 L 0 0 0 90" fill="none" stroke="#E2DAC9" strokeWidth="1.2" />
              </pattern>
              {/* Diagonal Hatch for Cavity Walls */}
              <pattern id="wallHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#1A1D20" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* Background Blueprint Grid */}
            <rect width={svgWidth} height={svgHeight} fill="url(#archGridBig)" />

            {/* Plot Boundary Outer Setback Frame */}
            <g transform={`translate(${padding}, ${padding})`}>
              <rect
                x="0"
                y="0"
                width={plotBreadth * scale}
                height={plotLength * scale}
                fill="none"
                stroke="#A8A29E"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />

              {/* Plot Boundary Dimension Labels */}
              <text
                x={(plotBreadth * scale) / 2}
                y="-18"
                textAnchor="middle"
                className="text-[12px] font-mono font-bold fill-stone-500 tracking-wider"
              >
                ← {plotBreadth}'-0" (Road / {facingDirection} Facing) →
              </text>
              <text
                x="-24"
                y={(plotLength * scale) / 2}
                textAnchor="middle"
                transform={`rotate(-90, -24, ${(plotLength * scale) / 2})`}
                className="text-[12px] font-mono font-bold fill-stone-500 tracking-wider"
              >
                ← {plotLength}'-0" Depth →
              </text>

              {/* Setback Indicator Lines */}
              <rect
                x={marginX * scale}
                y={marginY * scale}
                width={buildWidth * scale}
                height={buildDepth * scale}
                fill="none"
                stroke="#1A1D20"
                strokeWidth="4"
              />

              {/* Render Each Room */}
              {floorRooms.map((room) => {
                const rx = (marginX + room.x) * scale;
                const ry = (marginY + room.y) * scale;
                const rw = room.width * scale;
                const rh = room.height * scale;
                const isSelected = selectedRoomId === room.id;

                return (
                  <g
                    key={room.id}
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      if (onRoomSelect) onRoomSelect(room);
                    }}
                    className="cursor-pointer transition-all hover:opacity-95"
                  >
                    {/* Room Floor Rectangle */}
                    <rect
                      x={rx}
                      y={ry}
                      width={rw}
                      height={rh}
                      className={getRoomColor(room.type, isSelected)}
                    />

                    {/* Vastu Zone Overlay Tint if enabled */}
                    {showVastu && room.vastuZone && (
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        fill={getVastuBadgeColor(room.type)}
                        opacity="0.12"
                      />
                    )}

                    {/* Room Interior Furniture Symbols */}
                    {showFurniture && (
                      <g transform={`translate(${rx}, ${ry})`}>
                        {room.type === 'living' && (
                          <g opacity="0.6">
                            {/* Sofa */}
                            <rect x="15" y="15" width={rw - 30} height="24" rx="4" fill="#D6D3D1" stroke="#78716C" />
                            <rect x="15" y="15" width="24" height={rh * 0.4} rx="4" fill="#D6D3D1" stroke="#78716C" />
                            {/* Coffee Table */}
                            <rect x="45" y="45" width="40" height="26" rx="3" fill="#E7E5E4" stroke="#A8A29E" />
                            {/* TV Unit on wall */}
                            <rect x={rw - 22} y="15" width="8" height={rh * 0.5} rx="2" fill="#44403C" />
                          </g>
                        )}

                        {(room.type === 'bedroom' || room.type === 'master_bedroom') && (
                          <g opacity="0.65">
                            {/* Bed */}
                            <rect x="25" y="25" width={Math.min(90, rw - 40)} height={Math.min(110, rh - 40)} rx="4" fill="#E2E8F0" stroke="#64748B" />
                            {/* Pillows */}
                            <rect x="32" y="30" width="30" height="18" rx="3" fill="#FFFFFF" stroke="#94A3B8" />
                            <rect x="68" y="30" width="30" height="18" rx="3" fill="#FFFFFF" stroke="#94A3B8" />
                            {/* Side Nightstands */}
                            <rect x="6" y="25" width="14" height="20" rx="2" fill="#CBD5E1" />
                            <rect x={Math.min(90, rw - 40) + 30} y="25" width="14" height="20" rx="2" fill="#CBD5E1" />
                          </g>
                        )}

                        {room.type === 'kitchen' && (
                          <g opacity="0.65">
                            {/* Countertop */}
                            <path
                              d={`M 0 0 L ${rw} 0 L ${rw} 28 L 28 28 L 28 ${rh} L 0 ${rh} Z`}
                              fill="#FED7AA"
                              stroke="#EA580C"
                              strokeWidth="1"
                            />
                            {/* Stove Burners */}
                            <circle cx="50" cy="14" r="5" fill="#431407" />
                            <circle cx="70" cy="14" r="5" fill="#431407" />
                            {/* Sink */}
                            <rect x={rw - 50} y="6" width="36" height="16" rx="2" fill="#E2E8F0" stroke="#64748B" />
                          </g>
                        )}

                        {room.type === 'dining' && (
                          <g opacity="0.6">
                            {/* Dining Table */}
                            <rect x={rw / 2 - 40} y={rh / 2 - 25} width="80" height="50" rx="6" fill="#FDE68A" stroke="#D97706" />
                            {/* Chairs */}
                            <rect x={rw / 2 - 32} y={rh / 2 - 36} width="22" height="8" rx="2" fill="#B45309" />
                            <rect x={rw / 2 + 10} y={rh / 2 - 36} width="22" height="8" rx="2" fill="#B45309" />
                            <rect x={rw / 2 - 32} y={rh / 2 + 28} width="22" height="8" rx="2" fill="#B45309" />
                            <rect x={rw / 2 + 10} y={rh / 2 + 28} width="22" height="8" rx="2" fill="#B45309" />
                          </g>
                        )}

                        {room.type === 'bathroom' && (
                          <g opacity="0.7">
                            {/* WC */}
                            <rect x="10" y="8" width="16" height="12" rx="2" fill="#E2E8F0" stroke="#64748B" />
                            <ellipse cx="18" cy="26" rx="10" ry="12" fill="#FFFFFF" stroke="#64748B" />
                            {/* Basin */}
                            <ellipse cx={rw - 20} cy="18" rx="12" ry="9" fill="#FFFFFF" stroke="#64748B" />
                          </g>
                        )}

                        {room.type === 'pooja' && (
                          <g opacity="0.75">
                            {/* Sacred Altar */}
                            <rect x="8" y="8" width={rw - 16} height="18" rx="2" fill="#FEF08A" stroke="#CA8A04" />
                            <circle cx={rw / 2} cy="17" r="4" fill="#CA8A04" />
                          </g>
                        )}

                        {room.type === 'parking' && (
                          <g opacity="0.45" transform={`translate(${rw / 2 - 25}, ${rh / 2 - 45})`}>
                            {/* Car top-down silhouette */}
                            <rect x="0" y="0" width="50" height="90" rx="14" fill="#64748B" stroke="#1E293B" strokeWidth="2" />
                            <rect x="5" y="20" width="40" height="35" rx="6" fill="#0F172A" />
                            <rect x="7" y="24" width="36" height="14" rx="2" fill="#38BDF8" opacity="0.6" />
                            <rect x="7" y="42" width="36" height="10" rx="2" fill="#38BDF8" opacity="0.6" />
                          </g>
                        )}
                      </g>
                    )}

                    {/* Doors representation (Wall opening + swing arc) */}
                    {room.doors?.map((d, di) => {
                      const dScale = 22;
                      return (
                        <g key={`door-${di}`}>
                          {d.wall === 'south' && (
                            <g transform={`translate(${rx + d.offset * scale}, ${ry + rh})`}>
                              <line x1="0" y1="0" x2={dScale} y2="0" stroke="#FFFFFF" strokeWidth="6" />
                              <path d={`M 0 0 A ${dScale} ${dScale} 0 0 1 ${dScale} -${dScale}`} fill="none" stroke="#D97706" strokeWidth="1.2" strokeDasharray="2 2" />
                              <line x1="0" y1="0" x2="0" y2={`-${dScale}`} stroke="#92400E" strokeWidth="1.8" />
                            </g>
                          )}
                          {d.wall === 'north' && (
                            <g transform={`translate(${rx + d.offset * scale}, ${ry})`}>
                              <line x1="0" y1="0" x2={dScale} y2="0" stroke="#FFFFFF" strokeWidth="6" />
                              <path d={`M 0 0 A ${dScale} ${dScale} 0 0 0 ${dScale} ${dScale}`} fill="none" stroke="#D97706" strokeWidth="1.2" strokeDasharray="2 2" />
                              <line x1="0" y1="0" x2="0" y2={dScale} stroke="#92400E" strokeWidth="1.8" />
                            </g>
                          )}
                          {d.wall === 'east' && (
                            <g transform={`translate(${rx + rw}, ${ry + d.offset * scale})`}>
                              <line x1="0" y1="0" x2="0" y2={dScale} stroke="#FFFFFF" strokeWidth="6" />
                              <path d={`M 0 0 A ${dScale} ${dScale} 0 0 0 -${dScale} ${dScale}`} fill="none" stroke="#D97706" strokeWidth="1.2" strokeDasharray="2 2" />
                              <line x1="0" y1="0" x2={`-${dScale}`} y2="0" stroke="#92400E" strokeWidth="1.8" />
                            </g>
                          )}
                          {d.wall === 'west' && (
                            <g transform={`translate(${rx}, ${ry + d.offset * scale})`}>
                              <line x1="0" y1="0" x2="0" y2={dScale} stroke="#FFFFFF" strokeWidth="6" />
                              <path d={`M 0 0 A ${dScale} ${dScale} 0 0 1 ${dScale} ${dScale}`} fill="none" stroke="#D97706" strokeWidth="1.2" strokeDasharray="2 2" />
                              <line x1="0" y1="0" x2={dScale} y2="0" stroke="#92400E" strokeWidth="1.8" />
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Windows representation */}
                    {room.windows?.map((w, wi) => {
                      const winLength = (w.width || 4) * scale;
                      return (
                        <g key={`win-${wi}`}>
                          {w.wall === 'east' && (
                            <g transform={`translate(${rx + rw - 3}, ${ry + w.offset * scale})`}>
                              <rect x="0" y="0" width="6" height={winLength} fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
                            </g>
                          )}
                          {w.wall === 'west' && (
                            <g transform={`translate(${rx - 3}, ${ry + w.offset * scale})`}>
                              <rect x="0" y="0" width="6" height={winLength} fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
                            </g>
                          )}
                          {w.wall === 'south' && (
                            <g transform={`translate(${rx + w.offset * scale}, ${ry + rh - 3})`}>
                              <rect x="0" y="0" width={winLength} height="6" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
                            </g>
                          )}
                          {w.wall === 'north' && (
                            <g transform={`translate(${rx + w.offset * scale}, ${ry - 3})`}>
                              <rect x="0" y="0" width={winLength} height="6" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Room Labels and Dimensions */}
                    <g transform={`translate(${rx + rw / 2}, ${ry + rh / 2})`} pointerEvents="none">
                      <rect
                        x="-70"
                        y="-22"
                        width="140"
                        height="44"
                        rx="6"
                        fill="rgba(255,255,255,0.88)"
                        stroke="#E7E5E4"
                        strokeWidth="0.8"
                      />
                      <text
                        y="-4"
                        textAnchor="middle"
                        className="text-[12px] font-bold fill-stone-900 tracking-tight"
                      >
                        {room.name}
                      </text>
                      {showDimensions && (
                        <text
                          y="14"
                          textAnchor="middle"
                          className="text-[10px] font-mono font-semibold fill-amber-700"
                        >
                          {room.width}'-0" × {room.height}'-0" ({room.width * room.height} sqft)
                        </text>
                      )}
                    </g>

                    {/* Vastu Zone Marker Tag */}
                    {showVastu && room.vastuZone && (
                      <g transform={`translate(${rx + 8}, ${ry + 16})`}>
                        <rect x="0" y="-10" width="105" height="16" rx="3" fill="#1A1D20" opacity="0.85" />
                        <text x="5" y="2" className="text-[9px] font-semibold fill-amber-300">
                          {room.vastuZone}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Compass Rose Indicator (Top-Right) */}
            <g transform={`translate(${svgWidth - 55}, 55)`}>
              <circle cx="0" cy="0" r="28" fill="#FFFFFF" stroke="#D6D3D1" strokeWidth="1.5" className="shadow-md" />
              {/* North Arrow */}
              <polygon points="0,-22 6,-4 0,0" fill="#DC2626" />
              <polygon points="0,-22 -6,-4 0,0" fill="#991B1B" />
              {/* South Arrow */}
              <polygon points="0,22 6,4 0,0" fill="#52525B" />
              <polygon points="0,22 -6,4 0,0" fill="#27272A" />
              {/* East / West ticks */}
              <line x1="-16" y1="0" x2="16" y2="0" stroke="#71717A" strokeWidth="1.2" />
              <text x="0" y="-25" textAnchor="middle" className="text-[10px] font-bold fill-red-600 font-mono">
                N
              </text>
              <text x="24" y="3" textAnchor="middle" className="text-[9px] font-bold fill-stone-600 font-mono">
                E
              </text>
              <text x="0" y="33" textAnchor="middle" className="text-[9px] font-bold fill-stone-600 font-mono">
                S
              </text>
              <text x="-24" y="3" textAnchor="middle" className="text-[9px] font-bold fill-stone-600 font-mono">
                W
              </text>
            </g>

            {/* Architectural Scale Bar (Bottom-Right) */}
            <g transform={`translate(${svgWidth - 160}, ${svgHeight - 25})`}>
              <rect x="0" y="0" width="120" height="4" fill="#1A1D20" />
              <rect x="0" y="0" width="40" height="4" fill="#D97706" />
              <rect x="80" y="0" width="40" height="4" fill="#D97706" />
              <text x="0" y="-5" className="text-[9px] font-mono font-semibold fill-stone-500">
                0'
              </text>
              <text x="60" y="-5" textAnchor="middle" className="text-[9px] font-mono font-semibold fill-stone-500">
                10'
              </text>
              <text x="120" y="-5" textAnchor="end" className="text-[9px] font-mono font-semibold fill-stone-500">
                20' Scale
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Selected Room Details Drawer/Banner */}
      {selectedRoom && (
        <div className="flex items-center justify-between px-5 py-2.5 bg-stone-900 text-stone-100 border-t border-stone-800 text-xs">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-amber-400" />
            <div>
              <span className="font-semibold text-amber-300">{selectedRoom.name}</span>
              <span className="mx-2 text-stone-500">|</span>
              <span className="font-mono text-stone-300">
                {selectedRoom.width}' × {selectedRoom.height}' ({selectedRoom.width * selectedRoom.height} sq ft)
              </span>
              {selectedRoom.vastuZone && (
                <>
                  <span className="mx-2 text-stone-500">|</span>
                  <span className="text-amber-200">Vastu: {selectedRoom.vastuZone}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-stone-400 italic text-[11px]">{selectedRoom.notes}</div>
        </div>
      )}
    </div>
  );
};
