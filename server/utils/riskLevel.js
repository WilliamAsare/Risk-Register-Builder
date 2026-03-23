function getRiskLevel(score) {
  if (score >= 16) return 'critical';
  if (score >= 8) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

module.exports = { getRiskLevel };
