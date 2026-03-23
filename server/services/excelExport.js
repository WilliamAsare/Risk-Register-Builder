const ExcelJS = require('exceljs');
const { getRiskLevel } = require('../utils/riskLevel');

const NAVY = 'FF1E3A5F';
const WHITE = 'FFFFFFFF';
const LIGHT_GRAY = 'FFF1F5F9';
const RISK_FILLS = {
  critical: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } },
  high: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } },
  medium: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAB308' } },
  low: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } },
};

function applyHeaderStyle(row) {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.font = { color: { argb: WHITE }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });
  row.height = 24;
}

function applyAlternatingRows(sheet, startRow) {
  for (let i = startRow; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    if ((i - startRow) % 2 === 1) {
      row.eachCell(cell => {
        if (!cell.fill || cell.fill.fgColor?.argb !== NAVY) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
        }
      });
    }
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  }
}

async function generateExcel(register) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Risk Register Builder';
  workbook.created = new Date();

  const risks = register.risks || [];
  const assets = register.assets || [];
  const threats = register.threats || [];
  const controls = register.controls || [];

  // Sheet 1 - Risk Register
  const riskSheet = workbook.addWorksheet('Risk Register', { views: [{ state: 'frozen', ySplit: 1 }] });
  riskSheet.columns = [
    { header: 'Risk ID', key: 'risk_id_label', width: 10 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Category', key: 'risk_category', width: 14 },
    { header: 'Asset', key: 'asset_name', width: 20 },
    { header: 'Threat', key: 'threat_name', width: 20 },
    { header: 'Inherent L', key: 'inherent_likelihood', width: 10 },
    { header: 'Inherent I', key: 'inherent_impact', width: 10 },
    { header: 'Inherent Score', key: 'inherent_risk_score', width: 13 },
    { header: 'Residual L', key: 'residual_likelihood', width: 10 },
    { header: 'Residual I', key: 'residual_impact', width: 10 },
    { header: 'Residual Score', key: 'residual_risk_score', width: 13 },
    { header: 'Treatment', key: 'treatment', width: 12 },
    { header: 'Treatment Plan', key: 'treatment_plan', width: 35 },
    { header: 'Owner', key: 'risk_owner', width: 18 },
    { header: 'Due Date', key: 'due_date', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Controls', key: 'controls_text', width: 30 },
  ];

  applyHeaderStyle(riskSheet.getRow(1));

  risks.forEach(r => {
    const row = riskSheet.addRow({
      ...r,
      asset_name: r.asset_name || 'N/A',
      threat_name: r.threat_name || 'N/A',
      risk_owner: r.risk_owner || 'N/A',
      due_date: r.due_date || '',
      controls_text: (r.controls || []).map(c => c.name).join(', '),
    });

    // Color code score cells
    const inherentCell = row.getCell('inherent_risk_score');
    const residualCell = row.getCell('residual_risk_score');
    const iLevel = getRiskLevel(r.inherent_risk_score);
    const rLevel = getRiskLevel(r.residual_risk_score);
    inherentCell.fill = RISK_FILLS[iLevel];
    inherentCell.font = { color: { argb: WHITE }, bold: true };
    residualCell.fill = RISK_FILLS[rLevel];
    residualCell.font = { color: { argb: WHITE }, bold: true };
  });

  applyAlternatingRows(riskSheet, 2);

  // Sheet 2 - Heat Map Data
  const heatSheet = workbook.addWorksheet('Heat Map');
  heatSheet.addRow(['Risk Heat Map - Inherent Risk']);
  heatSheet.getRow(1).font = { bold: true, size: 14, color: { argb: NAVY } };
  heatSheet.addRow([]);
  heatSheet.addRow(['Likelihood / Impact', '1-Minimal', '2-Minor', '3-Moderate', '4-Major', '5-Critical']);
  applyHeaderStyle(heatSheet.getRow(3));

  const likelihoodLabels = ['5-Almost Certain', '4-Likely', '3-Possible', '2-Unlikely', '1-Rare'];
  likelihoodLabels.forEach((label, rowIdx) => {
    const likelihood = 5 - rowIdx;
    const rowData = [label];
    for (let impact = 1; impact <= 5; impact++) {
      const score = likelihood * impact;
      const count = risks.filter(r => r.inherent_likelihood === likelihood && r.inherent_impact === impact).length;
      rowData.push(count > 0 ? `${count} risk(s) [Score: ${score}]` : `Score: ${score}`);
    }
    const row = heatSheet.addRow(rowData);
    row.getCell(1).font = { bold: true };
    for (let col = 2; col <= 6; col++) {
      const impact = col - 1;
      const score = likelihood * impact;
      const level = getRiskLevel(score);
      row.getCell(col).fill = RISK_FILLS[level];
      row.getCell(col).font = { color: { argb: WHITE }, bold: true };
      row.getCell(col).alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });

  heatSheet.columns.forEach(col => { col.width = 20; });

  // Sheet 3 - Assets
  const assetSheet = workbook.addWorksheet('Assets', { views: [{ state: 'frozen', ySplit: 1 }] });
  assetSheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Owner', key: 'owner', width: 20 },
    { header: 'Criticality', key: 'criticality', width: 12 },
    { header: 'Description', key: 'description', width: 40 },
  ];
  applyHeaderStyle(assetSheet.getRow(1));
  assets.forEach(a => assetSheet.addRow({ ...a, owner: a.owner || 'N/A', description: a.description || '' }));
  applyAlternatingRows(assetSheet, 2);

  // Sheet 4 - Threats
  const threatSheet = workbook.addWorksheet('Threats', { views: [{ state: 'frozen', ySplit: 1 }] });
  threatSheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Source', key: 'source', width: 15 },
    { header: 'Description', key: 'description', width: 45 },
  ];
  applyHeaderStyle(threatSheet.getRow(1));
  threats.forEach(t => threatSheet.addRow({ ...t, source: t.source || 'N/A', description: t.description || '' }));
  applyAlternatingRows(threatSheet, 2);

  // Sheet 5 - Controls
  const controlSheet = workbook.addWorksheet('Controls', { views: [{ state: 'frozen', ySplit: 1 }] });
  controlSheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Category', key: 'category', width: 14 },
    { header: 'Effectiveness', key: 'effectiveness', width: 14 },
    { header: 'Owner', key: 'owner', width: 20 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Linked Risks', key: 'linked_risks', width: 30 },
  ];
  applyHeaderStyle(controlSheet.getRow(1));
  controls.forEach(c => {
    const linkedRisks = risks.filter(r => (r.controls || []).some(rc => rc.id === c.id)).map(r => r.risk_id_label).join(', ');
    controlSheet.addRow({
      ...c, owner: c.owner || 'N/A', category: c.category || 'N/A',
      description: c.description || '', linked_risks: linkedRisks || 'None',
    });
  });
  applyAlternatingRows(controlSheet, 2);

  // Sheet 6 - Summary Stats
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Risk Register Summary']);
  summarySheet.getRow(1).font = { bold: true, size: 16, color: { argb: NAVY } };
  summarySheet.addRow([]);

  const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
  risks.forEach(r => { distribution[getRiskLevel(r.inherent_risk_score)]++; });

  const summaryData = [
    ['Register Name', register.name],
    ['Framework', register.framework],
    ['Total Risks', risks.length],
    ['Critical Risks', distribution.critical],
    ['High Risks', distribution.high],
    ['Medium Risks', distribution.medium],
    ['Low Risks', distribution.low],
    ['Total Assets', assets.length],
    ['Total Threats', threats.length],
    ['Total Controls', controls.length],
    ['Open Risks', risks.filter(r => r.status === 'open').length],
    ['In Progress', risks.filter(r => r.status === 'in_progress').length],
    ['Closed', risks.filter(r => r.status === 'closed').length],
    ['Accepted', risks.filter(r => r.status === 'accepted').length],
    ['Avg Inherent Score', risks.length ? (risks.reduce((s, r) => s + r.inherent_risk_score, 0) / risks.length).toFixed(1) : 0],
    ['Avg Residual Score', risks.length ? (risks.reduce((s, r) => s + r.residual_risk_score, 0) / risks.length).toFixed(1) : 0],
  ];

  summaryData.forEach(([label, value]) => {
    const row = summarySheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
  });

  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 35;

  return workbook;
}

module.exports = { generateExcel };
