export function getRiskLevel(score) {
  if (score >= 16) return 'critical';
  if (score >= 8) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

export function getRiskColor(score) {
  const level = getRiskLevel(score);
  const colors = {
    critical: '#DC2626',
    high: '#F97316',
    medium: '#EAB308',
    low: '#22C55E',
  };
  return colors[level];
}

export function getRiskBgClass(score) {
  const level = getRiskLevel(score);
  const classes = {
    critical: 'bg-red-600',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };
  return classes[level];
}

export function getRiskTextClass(score) {
  const level = getRiskLevel(score);
  const classes = {
    critical: 'text-red-600',
    high: 'text-orange-500',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  };
  return classes[level];
}

export function getRiskLabel(score) {
  const level = getRiskLevel(score);
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export const LIKELIHOOD_LABELS = {
  1: 'Rare',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Almost Certain',
};

export const IMPACT_LABELS = {
  1: 'Minimal',
  2: 'Minor',
  3: 'Moderate',
  4: 'Major',
  5: 'Critical',
};

export const FRAMEWORK_DATA = {
  nist_csf: {
    label: 'NIST CSF 2.0',
    assets: [
      { name: 'Network Infrastructure', type: 'infrastructure', criticality: 'critical' },
      { name: 'Cloud Environment', type: 'infrastructure', criticality: 'critical' },
      { name: 'Identity Systems', type: 'application', criticality: 'critical' },
      { name: 'Endpoint Devices', type: 'infrastructure', criticality: 'high' },
      { name: 'Data Repositories', type: 'data', criticality: 'critical' },
      { name: 'Third-Party Integrations', type: 'application', criticality: 'medium' },
    ],
    threats: [
      { name: 'Ransomware Attack', category: 'cyber', source: 'external' },
      { name: 'Phishing/Social Engineering', category: 'cyber', source: 'external' },
      { name: 'Insider Threat', category: 'operational', source: 'internal' },
      { name: 'Supply Chain Compromise', category: 'cyber', source: 'external' },
      { name: 'Misconfiguration', category: 'cyber', source: 'internal' },
      { name: 'Data Exfiltration', category: 'cyber', source: 'external' },
    ],
    controls: [
      { name: 'MFA Enforcement', type: 'preventive', category: 'technical', effectiveness: 'strong' },
      { name: 'EDR Deployment', type: 'detective', category: 'technical', effectiveness: 'strong' },
      { name: 'Network Segmentation', type: 'preventive', category: 'technical', effectiveness: 'moderate' },
      { name: 'Backup & Recovery', type: 'corrective', category: 'technical', effectiveness: 'strong' },
      { name: 'Security Awareness Training', type: 'preventive', category: 'administrative', effectiveness: 'moderate' },
      { name: 'Vulnerability Management', type: 'detective', category: 'technical', effectiveness: 'moderate' },
      { name: 'Incident Response Plan', type: 'corrective', category: 'administrative', effectiveness: 'moderate' },
      { name: 'Access Reviews', type: 'detective', category: 'administrative', effectiveness: 'moderate' },
    ],
  },
  iso_27001: {
    label: 'ISO 27001',
    assets: [
      { name: 'Information Processing Facilities', type: 'infrastructure', criticality: 'critical' },
      { name: 'Business Applications', type: 'application', criticality: 'high' },
      { name: 'Personnel Records', type: 'data', criticality: 'high' },
      { name: 'Customer Data', type: 'data', criticality: 'critical' },
      { name: 'Intellectual Property', type: 'data', criticality: 'critical' },
      { name: 'Communication Systems', type: 'infrastructure', criticality: 'high' },
    ],
    threats: [
      { name: 'Unauthorized Access', category: 'cyber', source: 'external' },
      { name: 'Information Leakage', category: 'cyber', source: 'internal' },
      { name: 'System Failure', category: 'operational', source: 'internal' },
      { name: 'Natural Disaster', category: 'operational', source: 'environmental' },
      { name: 'Regulatory Non-Compliance', category: 'compliance', source: 'internal' },
      { name: 'Third-Party Breach', category: 'third_party', source: 'external' },
    ],
    controls: [
      { name: 'Access Control Policy', type: 'preventive', category: 'administrative', effectiveness: 'strong' },
      { name: 'Encryption at Rest/Transit', type: 'preventive', category: 'technical', effectiveness: 'strong' },
      { name: 'Business Continuity Plan', type: 'corrective', category: 'administrative', effectiveness: 'moderate' },
      { name: 'Supplier Security Assessment', type: 'detective', category: 'administrative', effectiveness: 'moderate' },
      { name: 'Information Classification', type: 'preventive', category: 'administrative', effectiveness: 'moderate' },
      { name: 'Audit Logging', type: 'detective', category: 'technical', effectiveness: 'strong' },
      { name: 'Physical Security', type: 'preventive', category: 'physical', effectiveness: 'moderate' },
      { name: 'Change Management', type: 'preventive', category: 'administrative', effectiveness: 'moderate' },
    ],
  },
  sox_itgc: {
    label: 'SOX ITGC',
    assets: [
      { name: 'Financial Reporting Systems (ERP)', type: 'application', criticality: 'critical' },
      { name: 'General Ledger', type: 'data', criticality: 'critical' },
      { name: 'Access Management Platform', type: 'application', criticality: 'high' },
      { name: 'Change Management System', type: 'application', criticality: 'high' },
      { name: 'Backup Infrastructure', type: 'infrastructure', criticality: 'high' },
      { name: 'Database Servers', type: 'infrastructure', criticality: 'critical' },
    ],
    threats: [
      { name: 'Unauthorized Access to Financial Data', category: 'compliance', source: 'internal' },
      { name: 'Uncontrolled Program Changes', category: 'operational', source: 'internal' },
      { name: 'Inadequate Segregation of Duties', category: 'compliance', source: 'internal' },
      { name: 'Processing Integrity Failure', category: 'operational', source: 'internal' },
      { name: 'IT Operations Disruption', category: 'operational', source: 'internal' },
      { name: 'Incomplete Audit Trail', category: 'compliance', source: 'internal' },
    ],
    controls: [
      { name: 'User Access Reviews', type: 'detective', category: 'administrative', effectiveness: 'strong' },
      { name: 'Change Approval Workflow', type: 'preventive', category: 'administrative', effectiveness: 'strong' },
      { name: 'SoD Matrix Enforcement', type: 'preventive', category: 'administrative', effectiveness: 'moderate' },
      { name: 'Automated Reconciliation', type: 'detective', category: 'technical', effectiveness: 'strong' },
      { name: 'Job Scheduling Monitoring', type: 'detective', category: 'technical', effectiveness: 'moderate' },
      { name: 'Privileged Access Management', type: 'preventive', category: 'technical', effectiveness: 'strong' },
      { name: 'Backup Verification', type: 'detective', category: 'technical', effectiveness: 'moderate' },
      { name: 'Password Policy Enforcement', type: 'preventive', category: 'technical', effectiveness: 'moderate' },
    ],
  },
};
