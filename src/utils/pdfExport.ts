import { jsPDF } from 'jspdf';
import { HousePlanData } from '../../server';

export function exportPlanToPDF(plan: HousePlanData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 45;

  // Header Banner
  doc.setFillColor(26, 29, 32); // #1A1D20 Charcoal
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Accent Gold Line
  doc.setFillColor(197, 160, 89); // Gold
  doc.rect(0, 75, pageWidth, 4, 'F');

  // Logo / Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('HomeAI', margin, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 175, 55); // Warm gold
  doc.text('AI-POWERED ARCHITECTURAL BLUEPRINT SPECIFICATION', margin, 58);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 110, 48);

  y = 105;

  // Plan Title & Summary
  doc.setTextColor(26, 29, 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(plan.title, margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Plot: ${plan.plotLength}' × ${plan.plotBreadth}' (${plan.totalPlotAreaSqFt} sq ft)  |  Facing: ${plan.facingDirection}  |  Floors: ${plan.floors}  |  Bedrooms: ${plan.bedrooms} BHK  |  Style: ${plan.architecturalStyle}`,
    margin,
    y
  );
  y += 24;

  // Horizontal divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Section 1: Key Metrics Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(26, 29, 32);
  doc.text('1. Project Architectural Summary', margin, y);
  y += 14;

  const colW = (pageWidth - margin * 2) / 3;
  const metrics = [
    { label: 'Built-up Area', val: `${plan.totalBuiltUpAreaSqFt.toLocaleString()} sq ft` },
    { label: 'Carpet Area (82%)', val: `${plan.carpetAreaSqFt.toLocaleString()} sq ft` },
    { label: 'Estimated Turnkey Cost', val: `Rs. ${plan.estimatedCost.toLocaleString()}` },
    { label: 'Kitchen Design', val: plan.kitchenType },
    { label: 'Bathrooms', val: `${plan.bathrooms} Units` },
    { label: 'Vastu Harmony Score', val: `${plan.recommendations.vastuCompliance?.score || 94}%` },
  ];

  metrics.forEach((m, idx) => {
    const rx = margin + (idx % 3) * colW;
    const ry = y + Math.floor(idx / 3) * 36;

    doc.setFillColor(248, 246, 242);
    doc.roundedRect(rx, ry, colW - 8, 30, 4, 4, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(m.label, rx + 8, ry + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(26, 29, 32);
    doc.text(m.val, rx + 8, ry + 24);
  });

  y += 86;

  // Section 2: Room Schedule Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(26, 29, 32);
  doc.text('2. Room Dimensions & Zoning Schedule', margin, y);
  y += 16;

  // Table Header
  doc.setFillColor(26, 29, 32);
  doc.rect(margin, y, pageWidth - margin * 2, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Room / Space', margin + 10, y + 14);
  doc.text('Floor', margin + 170, y + 14);
  doc.text('Dimensions (L × W)', margin + 230, y + 14);
  doc.text('Area (Sq Ft)', margin + 340, y + 14);
  doc.text('Vastu Direction', margin + 410, y + 14);
  y += 20;

  // Table Rows
  plan.rooms.slice(0, 8).forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 245);
    doc.rect(margin, y, pageWidth - margin * 2, 18, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(r.name, margin + 10, y + 13);
    doc.text(r.floor === 1 ? 'Ground' : 'First', margin + 170, y + 13);
    doc.text(`${r.width}'-0" × ${r.height}'-0"`, margin + 230, y + 13);
    doc.text(`${r.width * r.height} sqft`, margin + 340, y + 13);
    doc.text(r.vastuZone || 'Balanced', margin + 410, y + 13);
    y += 18;
  });

  y += 16;

  // Section 3: Cost Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(26, 29, 32);
  doc.text('3. Construction Budget Breakdown (Turnkey)', margin, y);
  y += 14;

  const costItems = [
    { name: 'Structure & Masonry (45%)', amt: plan.costBreakdown.structureAndMasonry },
    { name: 'Flooring, Tiling & Cladding (15%)', amt: plan.costBreakdown.flooringAndTiling },
    { name: 'Plumbing & Electrical Infrastructure (13%)', amt: plan.costBreakdown.electricalAndPlumbing },
    { name: 'Exterior & Interior Finishing / Painting (13%)', amt: plan.costBreakdown.paintingAndFinishing },
    { name: 'Modular Kitchen & Interior Millwork (14%)', amt: plan.costBreakdown.interiorsAndKitchen },
  ];

  costItems.forEach((ci) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text(ci.name, margin + 10, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 29, 32);
    doc.text(`Rs. ${ci.amt.toLocaleString()}`, pageWidth - margin - 100, y + 10);
    y += 16;
  });

  y += 16;

  // Section 4: AI Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(26, 29, 32);
  doc.text('4. Smart Passive & Environmental Optimizations', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  const tips = [
    `Ventilation: ${plan.recommendations.ventilation?.description || 'Optimal cross flow layout.'}`,
    `Natural Light: ${plan.recommendations.naturalLighting?.description || 'East-west sun harvesting.'}`,
    `Space Ratio: ${plan.recommendations.spaceUtilization?.description || 'Zero corridor wastage.'}`,
  ];

  tips.forEach((t) => {
    doc.text(`• ${t}`, margin + 10, y, { maxWidth: pageWidth - margin * 2 - 20 });
    y += 16;
  });

  // Footer Note
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Notice: Architectural drawings are generated by HomeAI. Please confirm local municipality setbacks and structural engineer stamp prior to site excavation.',
    margin,
    pageWidth > 750 ? 780 : 800,
    { maxWidth: pageWidth - margin * 2 }
  );

  doc.save(`${plan.title.replace(/[^a-zA-Z0-9]/g, '_')}_Blueprint.pdf`);
}
