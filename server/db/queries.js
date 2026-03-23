const db = () => global.__db;

function getRisksWithControls(registerId) {
  const risks = db().prepare(`
    SELECT r.*, a.name as asset_name, t.name as threat_name
    FROM risks r
    LEFT JOIN assets a ON r.asset_id = a.id
    LEFT JOIN threats t ON r.threat_id = t.id
    WHERE r.register_id = ?
    ORDER BY r.inherent_risk_score DESC
  `).all(registerId);

  const rcStmt = db().prepare(`
    SELECT c.* FROM controls c
    JOIN risk_controls rc ON c.id = rc.control_id
    WHERE rc.risk_id = ?
  `);
  for (const risk of risks) {
    risk.controls = rcStmt.all(risk.id);
  }

  return risks;
}

function getSingleRiskWithControls(riskId) {
  const risk = db().prepare(`
    SELECT r.*, a.name as asset_name, t.name as threat_name
    FROM risks r
    LEFT JOIN assets a ON r.asset_id = a.id
    LEFT JOIN threats t ON r.threat_id = t.id
    WHERE r.id = ?
  `).get(riskId);

  if (risk) {
    risk.controls = db().prepare(`
      SELECT c.* FROM controls c
      JOIN risk_controls rc ON c.id = rc.control_id
      WHERE rc.risk_id = ?
    `).all(risk.id);
  }

  return risk;
}

module.exports = { getRisksWithControls, getSingleRiskWithControls };
