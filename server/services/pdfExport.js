const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const { getRiskLevel } = require('../utils/riskLevel');

const NAVY = [30, 58, 95];
const WHITE = [255, 255, 255];
const LIGHT_GRAY = [248, 250, 252];
const RISK_COLORS = {
  critical: [220, 38, 38],
  high: [249, 115, 22],
  medium: [234, 179, 8],
  low: [34, 197, 94],
};

function getRiskLevelLabel(score) {
  if (score >= 16) return 'Critical';
  if (score >= 8) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

function generatePDF(register, user) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 0;

  function addHeader() {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.text(register.name, margin, 13);
    doc.text('Risk Register Report', pageWidth - margin, 13, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  function addFooter(pageNum) {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(new Date().toLocaleDateString(), pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  function checkPageBreak(needed) {
    if (yPos + needed > pageHeight - 25) {
      addFooter(doc.getNumberOfPages());
      doc.addPage();
      addHeader();
      yPos = 30;
    }
  }

  // Cover page
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(32);
  doc.text('Risk Register', pageWidth / 2, 80, { align: 'center' });
  doc.setFontSize(18);
  doc.text(register.name, pageWidth / 2, 100, { align: 'center' });

  doc.setFontSize(12);
  const framework = { nist_csf: 'NIST CSF 2.0', iso_27001: 'ISO 27001', sox_itgc: 'SOX ITGC', custom: 'General Risk Assessment', general: 'General Risk Assessment' };
  doc.text(`Framework: ${framework[register.framework] || register.framework}`, pageWidth / 2, 130, { align: 'center' });
  doc.text(`Organization: ${user.organization || 'N/A'}`, pageWidth / 2, 140, { align: 'center' });
  doc.text(`Prepared by: ${user.name}`, pageWidth / 2, 150, { align: 'center' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 160, { align: 'center' });

  if (register.description) {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(register.description, pageWidth - 80);
    doc.text(lines, pageWidth / 2, 180, { align: 'center' });
  }

  // Executive Summary
  doc.addPage();
  addHeader();
  yPos = 30;

  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('Executive Summary', margin, yPos);
  yPos += 12;

  const risks = register.risks || [];
  const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
  risks.forEach(r => { distribution[getRiskLevel(r.inherent_risk_score)]++; });

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Risks Identified: ${risks.length}`, margin, yPos); yPos += 8;

  const levels = [
    { label: 'Critical', count: distribution.critical, color: RISK_COLORS.critical },
    { label: 'High', count: distribution.high, color: RISK_COLORS.high },
    { label: 'Medium', count: distribution.medium, color: RISK_COLORS.medium },
    { label: 'Low', count: distribution.low, color: RISK_COLORS.low },
  ];

  levels.forEach(level => {
    doc.setFillColor(...level.color);
    doc.roundedRect(margin, yPos - 4, 5, 5, 1, 1, 'F');
    doc.text(`${level.label}: ${level.count}`, margin + 8, yPos);
    yPos += 7;
  });

  yPos += 5;
  const avgInherent = risks.length ? (risks.reduce((s, r) => s + r.inherent_risk_score, 0) / risks.length).toFixed(1) : 0;
  const avgResidual = risks.length ? (risks.reduce((s, r) => s + r.residual_risk_score, 0) / risks.length).toFixed(1) : 0;
  doc.text(`Average Inherent Risk Score: ${avgInherent}`, margin, yPos); yPos += 7;
  doc.text(`Average Residual Risk Score: ${avgResidual}`, margin, yPos); yPos += 7;
  doc.text(`Risk Reduction: ${avgInherent > 0 ? Math.round((1 - avgResidual / avgInherent) * 100) : 0}%`, margin, yPos);
  yPos += 15;

  // Top 5 risks
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text('Top 5 Risks by Inherent Score', margin, yPos);
  yPos += 5;

  const topRisks = [...risks].sort((a, b) => b.inherent_risk_score - a.inherent_risk_score).slice(0, 5);
  doc.autoTable({
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['Risk ID', 'Title', 'Inherent Score', 'Residual Score', 'Status']],
    body: topRisks.map(r => [
      r.risk_id_label, r.title, r.inherent_risk_score.toString(),
      r.residual_risk_score.toString(), r.status
    ]),
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Heat Map
  checkPageBreak(90);
  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text('Risk Heat Map (Inherent)', margin, yPos);
  yPos += 8;

  const cellSize = 22;
  const heatmapX = margin + 30;
  const heatmapY = yPos;
  const likelihoodLabels = ['5', '4', '3', '2', '1'];
  const impactLabels = ['1', '2', '3', '4', '5'];

  doc.setFontSize(8);
  doc.text('Likelihood', margin, heatmapY + cellSize * 2.5, { angle: 90 });
  doc.text('Impact', heatmapX + cellSize * 2.5, heatmapY + cellSize * 5 + 8, { align: 'center' });

  for (let row = 0; row < 5; row++) {
    const likelihood = 5 - row;
    doc.setFontSize(7);
    doc.text(likelihoodLabels[row], heatmapX - 5, heatmapY + row * cellSize + cellSize / 2 + 1, { align: 'right' });

    for (let col = 0; col < 5; col++) {
      const impact = col + 1;
      const score = likelihood * impact;
      const level = getRiskLevel(score);
      const color = RISK_COLORS[level];

      doc.setFillColor(...color);
      doc.setDrawColor(255, 255, 255);
      doc.rect(heatmapX + col * cellSize, heatmapY + row * cellSize, cellSize, cellSize, 'FD');

      const count = risks.filter(r => r.inherent_likelihood === likelihood && r.inherent_impact === impact).length;
      if (count > 0) {
        doc.setTextColor(...WHITE);
        doc.setFontSize(10);
        doc.text(count.toString(), heatmapX + col * cellSize + cellSize / 2, heatmapY + row * cellSize + cellSize / 2 + 1, { align: 'center' });
      }

      if (row === 4) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.text(impactLabels[col], heatmapX + col * cellSize + cellSize / 2, heatmapY + 5 * cellSize + 5, { align: 'center' });
      }
    }
  }

  yPos = heatmapY + 5 * cellSize + 15;

  // Full Risk Register Table
  doc.addPage();
  addHeader();
  yPos = 30;

  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('Risk Register', margin, yPos);
  yPos += 5;

  doc.autoTable({
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['ID', 'Title', 'Category', 'Inherent', 'Residual', 'Treatment', 'Owner', 'Status']],
    body: risks.map(r => [
      r.risk_id_label, r.title, r.risk_category,
      `${r.inherent_risk_score} (${getRiskLevelLabel(r.inherent_risk_score)})`,
      `${r.residual_risk_score} (${getRiskLevelLabel(r.residual_risk_score)})`,
      r.treatment, r.risk_owner || 'N/A', r.status
    ]),
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 35 },
      2: { cellWidth: 22 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 18 },
      6: { cellWidth: 25 },
      7: { cellWidth: 18 },
    },
    didParseCell: function(data) {
      if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
        const text = data.cell.raw;
        if (text.includes('Critical')) data.cell.styles.textColor = RISK_COLORS.critical;
        else if (text.includes('High')) data.cell.styles.textColor = RISK_COLORS.high;
        else if (text.includes('Medium')) data.cell.styles.textColor = RISK_COLORS.medium;
        else if (text.includes('Low')) data.cell.styles.textColor = RISK_COLORS.low;
      }
    },
  });

  // Critical/High risk detail pages
  const highRisks = risks.filter(r => r.inherent_risk_score >= 8).sort((a, b) => b.inherent_risk_score - a.inherent_risk_score);
  if (highRisks.length > 0) {
    doc.addPage();
    addHeader();
    yPos = 30;
    doc.setFontSize(18);
    doc.setTextColor(...NAVY);
    doc.text('Risk Detail - Critical & High', margin, yPos);
    yPos += 10;

    for (const r of highRisks) {
      checkPageBreak(60);
      const level = getRiskLevel(r.inherent_risk_score);
      doc.setFillColor(...RISK_COLORS[level]);
      doc.roundedRect(margin, yPos - 4, pageWidth - margin * 2, 7, 1, 1, 'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(10);
      doc.text(`${r.risk_id_label} - ${r.title}`, margin + 3, yPos + 1);
      yPos += 12;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      if (r.description) {
        const descLines = doc.splitTextToSize(r.description, pageWidth - margin * 2);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 5 + 3;
      }
      doc.text(`Category: ${r.risk_category}   |   Asset: ${r.asset_name || 'N/A'}   |   Threat: ${r.threat_name || 'N/A'}`, margin, yPos); yPos += 6;
      doc.text(`Inherent: L${r.inherent_likelihood} x I${r.inherent_impact} = ${r.inherent_risk_score}   |   Residual: L${r.residual_likelihood} x I${r.residual_impact} = ${r.residual_risk_score}`, margin, yPos); yPos += 6;
      doc.text(`Treatment: ${r.treatment}   |   Owner: ${r.risk_owner || 'N/A'}   |   Due: ${r.due_date || 'N/A'}   |   Status: ${r.status}`, margin, yPos); yPos += 6;

      if (r.controls && r.controls.length > 0) {
        doc.text(`Controls: ${r.controls.map(c => c.name).join(', ')}`, margin, yPos); yPos += 6;
      }
      if (r.treatment_plan) {
        const planLines = doc.splitTextToSize(`Treatment Plan: ${r.treatment_plan}`, pageWidth - margin * 2);
        doc.text(planLines, margin, yPos);
        yPos += planLines.length * 5;
      }
      yPos += 8;
    }
  }

  // Appendix - Assets
  doc.addPage();
  addHeader();
  yPos = 30;
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('Appendix A: Asset Inventory', margin, yPos);
  yPos += 5;

  const assets = register.assets || [];
  if (assets.length > 0) {
    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Name', 'Type', 'Owner', 'Criticality', 'Description']],
      body: assets.map(a => [a.name, a.type, a.owner || 'N/A', a.criticality, a.description || '']),
      headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Appendix - Threats
  checkPageBreak(30);
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('Appendix B: Threat Catalog', margin, yPos);
  yPos += 5;

  const threats = register.threats || [];
  if (threats.length > 0) {
    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Name', 'Category', 'Source', 'Description']],
      body: threats.map(t => [t.name, t.category, t.source || 'N/A', t.description || '']),
      headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Appendix - Controls
  checkPageBreak(30);
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('Appendix C: Control Inventory', margin, yPos);
  yPos += 5;

  const controls = register.controls || [];
  if (controls.length > 0) {
    doc.autoTable({
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Name', 'Type', 'Category', 'Effectiveness', 'Owner']],
      body: controls.map(c => [c.name, c.type, c.category || 'N/A', c.effectiveness, c.owner || 'N/A']),
      headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
    });
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  return doc.output('arraybuffer');
}

module.exports = { generatePDF };
