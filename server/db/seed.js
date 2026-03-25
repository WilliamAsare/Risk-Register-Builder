const bcrypt = require('bcryptjs');

async function runSeed(db) {
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const password2 = await bcrypt.hash('analyst1', 12);
  const password3 = await bcrypt.hash('manager1', 12);

  // Clear all tables
  db.exec('DELETE FROM register_collaborators');
  db.exec('DELETE FROM risk_comments');
  db.exec('DELETE FROM risk_history');
  db.exec('DELETE FROM risk_controls');
  db.exec('DELETE FROM risks');
  db.exec('DELETE FROM controls');
  db.exec('DELETE FROM threats');
  db.exec('DELETE FROM assets');
  db.exec('DELETE FROM registers');
  try { db.exec('DELETE FROM sessions'); } catch(e) { /* table may not exist on fresh DB */ }
  db.exec('DELETE FROM users');

  // ──────────────────────────────────────────
  // USERS
  // ──────────────────────────────────────────
  const userStmt = db.prepare('INSERT INTO users (email, password_hash, name, organization) VALUES (?, ?, ?, ?)');
  const u1 = userStmt.run('sarah.chen@meridian.io', passwordHash, 'Sarah Chen', 'Meridian Financial Services').lastInsertRowid;
  const u2 = userStmt.run('james.okafor@meridian.io', password2, 'James Okafor', 'Meridian Financial Services').lastInsertRowid;
  const u3 = userStmt.run('priya.sharma@meridian.io', password3, 'Priya Sharma', 'Meridian Financial Services').lastInsertRowid;

  const regStmt = db.prepare('INSERT INTO registers (user_id, name, description, framework) VALUES (?, ?, ?, ?)');
  const assetStmt = db.prepare('INSERT INTO assets (register_id, name, type, owner, criticality, description) VALUES (?, ?, ?, ?, ?, ?)');
  const threatStmt = db.prepare('INSERT INTO threats (register_id, name, category, source, description) VALUES (?, ?, ?, ?, ?)');
  const controlStmt = db.prepare('INSERT INTO controls (register_id, name, type, category, effectiveness, owner, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const riskStmt = db.prepare(`
    INSERT INTO risks (register_id, risk_id_label, title, description, asset_id, threat_id, risk_category,
      inherent_likelihood, inherent_impact, inherent_risk_score, residual_likelihood, residual_impact, residual_risk_score,
      treatment, treatment_plan, risk_owner, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const rcStmt = db.prepare('INSERT INTO risk_controls (risk_id, control_id) VALUES (?, ?)');
  const histStmt = db.prepare('INSERT INTO risk_history (risk_id, register_id, user_id, action, field_name, old_value, new_value, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const commentStmt = db.prepare('INSERT INTO risk_comments (risk_id, user_id, content, created_at) VALUES (?, ?, ?, ?)');
  const collabStmt = db.prepare('INSERT INTO register_collaborators (register_id, user_id, role) VALUES (?, ?, ?)');

  // ──────────────────────────────────────────
  // REGISTER 1: NIST CSF 2.0 - Core Banking Platform
  // ──────────────────────────────────────────
  const reg1 = regStmt.run(u1, 'Core Banking Platform - Q1 2026', 'NIST CSF 2.0 risk assessment covering the core banking platform, payment processing infrastructure, and customer-facing digital channels.', 'nist_csf').lastInsertRowid;

  // Collaborators
  collabStmt.run(reg1, u2, 'editor');
  collabStmt.run(reg1, u3, 'viewer');

  // Assets
  const a1 = [];
  a1.push(assetStmt.run(reg1, 'Core Banking Application', 'application', 'Banking Ops', 'critical', 'FIS Horizon core banking system processing all deposit, lending, and account operations').lastInsertRowid);
  a1.push(assetStmt.run(reg1, 'Payment Processing Gateway', 'application', 'Payments Team', 'critical', 'Real-time ACH, wire, and card payment processing engine handling $2.1B monthly volume').lastInsertRowid);
  a1.push(assetStmt.run(reg1, 'Customer Data Warehouse', 'data', 'Data Engineering', 'critical', 'Snowflake data warehouse containing 3.2M customer records with PII and financial data').lastInsertRowid);
  a1.push(assetStmt.run(reg1, 'AWS Production Environment', 'infrastructure', 'Cloud Engineering', 'critical', 'Multi-AZ deployment across us-east-1 and us-west-2 with 47 production services').lastInsertRowid);
  a1.push(assetStmt.run(reg1, 'Active Directory & Okta', 'application', 'IAM Team', 'critical', 'Identity provider federation serving 1,200 employees and 850 contractors').lastInsertRowid);
  a1.push(assetStmt.run(reg1, 'Mobile Banking App', 'application', 'Digital Products', 'high', 'iOS and Android banking application with 890K active monthly users').lastInsertRowid);
  a1.push(assetStmt.run(reg1, 'Corporate Network', 'infrastructure', 'Network Ops', 'high', 'SD-WAN across 12 branch offices with Zscaler internet access').lastInsertRowid);
  a1.push(assetStmt.run(reg1, 'Backup & DR Systems', 'infrastructure', 'IT Ops', 'high', 'Veeam backup to AWS S3 with cross-region replication, 4-hour RPO target').lastInsertRowid);
  a1.push(assetStmt.run(reg1, 'Third-Party API Integrations', 'application', 'Integration Team', 'medium', 'Plaid, Fiserv, and 14 other vendor API connections for data aggregation').lastInsertRowid);
  a1.push(assetStmt.run(reg1, 'Employee Endpoints', 'infrastructure', 'IT Support', 'medium', '1,400 managed laptops and workstations running Windows 11 and macOS').lastInsertRowid);

  // Threats
  const t1 = [];
  t1.push(threatStmt.run(reg1, 'Ransomware / Destructive Malware', 'cyber', 'external', 'Nation-state or financially motivated ransomware targeting financial institutions').lastInsertRowid);
  t1.push(threatStmt.run(reg1, 'Spear Phishing & BEC', 'cyber', 'external', 'Targeted phishing and business email compromise campaigns against treasury and executives').lastInsertRowid);
  t1.push(threatStmt.run(reg1, 'Insider Threat (Malicious)', 'operational', 'internal', 'Employees or contractors with privileged access intentionally exfiltrating data').lastInsertRowid);
  t1.push(threatStmt.run(reg1, 'Insider Threat (Negligent)', 'operational', 'internal', 'Accidental data exposure through misconfiguration, misdirected emails, or policy violations').lastInsertRowid);
  t1.push(threatStmt.run(reg1, 'Cloud Infrastructure Compromise', 'cyber', 'external', 'Exploitation of cloud misconfigurations or stolen cloud credentials').lastInsertRowid);
  t1.push(threatStmt.run(reg1, 'Third-Party / Supply Chain', 'cyber', 'external', 'Vendor breach or compromised software dependency affecting upstream systems').lastInsertRowid);
  t1.push(threatStmt.run(reg1, 'DDoS Attack', 'cyber', 'external', 'Volumetric or application-layer denial of service against customer-facing services').lastInsertRowid);
  t1.push(threatStmt.run(reg1, 'Regulatory Enforcement Action', 'compliance', 'external', 'OCC, CFPB, or state regulator enforcement for compliance failures').lastInsertRowid);
  t1.push(threatStmt.run(reg1, 'Natural Disaster / Infrastructure Failure', 'operational', 'environmental', 'Data center failure, power outage, or regional disaster impacting availability').lastInsertRowid);

  // Controls
  const c1 = [];
  c1.push(controlStmt.run(reg1, 'Phishing-Resistant MFA (FIDO2)', 'preventive', 'technical', 'strong', 'IAM Team', 'Hardware security keys for privileged access, push MFA for standard users').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'CrowdStrike Falcon EDR', 'detective', 'technical', 'strong', 'SOC', '24/7 managed EDR with automated containment on all endpoints and servers').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'Palo Alto NGFW + Microsegmentation', 'preventive', 'technical', 'strong', 'Network Ops', 'Zero-trust network segmentation isolating core banking from corporate network').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'Immutable Backup (Veeam + S3 Lock)', 'corrective', 'technical', 'strong', 'IT Ops', 'Object-locked S3 backups with automated integrity verification, tested quarterly').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'KnowBe4 Security Awareness', 'preventive', 'administrative', 'moderate', 'Security Team', 'Monthly phishing simulations with 4.2% click rate, mandatory annual training').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'Qualys VMDR + Automated Patching', 'detective', 'technical', 'moderate', 'Vulnerability Mgmt', 'Weekly vulnerability scans, critical patches within 72h, EPSS-prioritized remediation').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'Incident Response Program', 'corrective', 'administrative', 'moderate', 'CISO', 'NIST-aligned IR plan with annual tabletop exercises and retainer with CrowdStrike IR').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'SailPoint IGA + Quarterly Access Reviews', 'detective', 'administrative', 'moderate', 'IAM Team', 'Automated provisioning/deprovisioning with quarterly manager access certification').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'Symantec DLP + CASB', 'preventive', 'technical', 'moderate', 'Data Security', 'Content-aware DLP on email, web, and cloud with 340 custom policies').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'Wiz Cloud Security Platform', 'detective', 'technical', 'strong', 'Cloud Engineering', 'Agentless CSPM/CWPP with real-time misconfiguration and vulnerability detection').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'AWS Shield Advanced + WAF', 'preventive', 'technical', 'strong', 'Cloud Engineering', 'DDoS mitigation with custom WAF rules protecting all public-facing endpoints').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'Vendor Risk Management Program', 'preventive', 'administrative', 'moderate', 'GRC Team', 'Annual vendor assessments, SIG questionnaires, continuous monitoring via SecurityScorecard').lastInsertRowid);
  c1.push(controlStmt.run(reg1, 'Encryption (AES-256 at rest, TLS 1.3)', 'preventive', 'technical', 'strong', 'Engineering', 'All data encrypted at rest and in transit, certificate management via AWS ACM').lastInsertRowid);

  // Risks for Register 1
  const risks1 = [
    { l: 'R-001', t: 'Ransomware disruption to core banking operations', d: 'A ransomware attack encrypts core banking databases and payment processing systems. Mean time to recover estimated at 72-96 hours without immutable backups. Potential loss: $4.2M/day in transaction revenue plus regulatory penalties.', ai: 0, ti: 0, cat: 'cyber', iL: 4, iI: 5, rL: 2, rI: 4, tx: 'mitigate', plan: '1. Complete immutable backup migration (Q1)\n2. Conduct ransomware tabletop exercise with executive team\n3. Validate offline recovery procedures for core banking\n4. Engage CrowdStrike for 4-hour IR retainer SLA', owner: 'Marcus Webb, CISO', due: '2026-06-30', status: 'in_progress', cis: [1, 3, 6, 2] },
    { l: 'R-002', t: 'Credential theft via spear phishing of treasury staff', d: 'Targeted phishing campaign compromises treasury department credentials, enabling unauthorized wire transfers. Similar attack at peer institution resulted in $8.7M loss in 2025. Current phishing click rate: 4.2%.', ai: 1, ti: 1, cat: 'cyber', iL: 5, iI: 5, rL: 3, rI: 3, tx: 'mitigate', plan: '1. Deploy FIDO2 keys for all treasury and finance users by Q2\n2. Implement payment callback verification for wires > $50K\n3. Enhance email gateway rules for treasury-targeted BEC\n4. Monthly phishing simulations targeting finance team', owner: 'Lisa Park, Security Manager', due: '2026-04-30', status: 'in_progress', cis: [0, 4, 8] },
    { l: 'R-003', t: 'Customer PII breach from cloud data warehouse', d: 'Snowflake data warehouse containing 3.2M customer records is exposed due to misconfigured access policies or compromised service account. Estimated regulatory fine: $2-5M plus class action exposure.', ai: 2, ti: 4, cat: 'cyber', iL: 3, iI: 5, rL: 1, rI: 5, tx: 'mitigate', plan: '1. Implement column-level encryption for SSN and account numbers\n2. Deploy Wiz data security posture scanning\n3. Rotate all Snowflake service account credentials\n4. Enable query audit logging with anomaly detection', owner: 'Raj Patel, Data Engineering Lead', due: '2026-05-15', status: 'in_progress', cis: [9, 12, 7] },
    { l: 'R-004', t: 'Insider data exfiltration by privileged contractor', d: 'Contractor with database administrator access copies customer financial data to personal storage. Current controls lack full USB blocking and cloud upload monitoring for privileged users.', ai: 2, ti: 2, cat: 'operational', iL: 3, iI: 5, rL: 2, rI: 4, tx: 'mitigate', plan: '1. Implement CyberArk PAM for all contractor privileged access\n2. Block USB storage on all contractor endpoints\n3. Enable DLP monitoring for privileged user sessions\n4. Quarterly contractor access recertification', owner: 'Lisa Park, Security Manager', due: '2026-07-31', status: 'open', cis: [7, 8] },
    { l: 'R-005', t: 'Supply chain compromise via Plaid integration', d: 'Plaid or another financial data aggregation partner is breached, exposing customer account linking tokens and enabling unauthorized data access. Plaid processes 48M API calls/month for our platform.', ai: 8, ti: 5, cat: 'cyber', iL: 3, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Implement API token rotation every 90 days\n2. Add anomaly detection on aggregator API call patterns\n3. Complete vendor security assessment for all critical integrations\n4. Negotiate breach notification SLA with Plaid (< 24h)', owner: 'David Kim, Integration Lead', due: '2026-08-15', status: 'open', cis: [11, 5] },
    { l: 'R-006', t: 'DDoS attack against online banking and mobile app', d: 'Volumetric DDoS exceeding 400 Gbps or sophisticated application-layer attack takes customer-facing services offline. Previous incident in 2025 caused 6-hour outage affecting 340K customers.', ai: 5, ti: 6, cat: 'cyber', iL: 4, iI: 4, rL: 2, rI: 2, tx: 'mitigate', plan: '1. Upgrade AWS Shield Advanced with auto-scaling response\n2. Implement geographic rate limiting on mobile API\n3. Configure CloudFront failover to static maintenance page\n4. Conduct quarterly DDoS simulation exercises', owner: 'Alex Torres, Cloud Engineering', due: '2026-04-15', status: 'in_progress', cis: [10, 2] },
    { l: 'R-007', t: 'OCC enforcement for BSA/AML program deficiencies', d: 'Bank Secrecy Act and Anti-Money Laundering program gaps identified in recent internal audit. Transaction monitoring system has 23% false negative rate on suspicious activity. OCC exam scheduled Q3 2026.', ai: 0, ti: 7, cat: 'compliance', iL: 4, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Upgrade transaction monitoring to Actimize with AI-driven models\n2. Hire 3 additional BSA analysts before Q2\n3. Remediate 47 findings from internal audit by Q2\n4. Engage external counsel for pre-exam readiness review', owner: 'Michelle Torres, BSA Officer', due: '2026-06-01', status: 'in_progress', cis: [7] },
    { l: 'R-008', t: 'AWS account compromise via stolen IAM credentials', d: 'Root or administrator IAM credentials for production AWS account are leaked via code repository, phishing, or misconfigured CI/CD pipeline. Attacker gains full control of cloud infrastructure.', ai: 3, ti: 4, cat: 'cyber', iL: 3, iI: 5, rL: 1, rI: 4, tx: 'mitigate', plan: '1. Eliminate all long-lived IAM access keys (migrate to IRSA/OIDC)\n2. Enable AWS Organizations SCP guardrails\n3. Implement git-secrets scanning in all CI/CD pipelines\n4. Deploy real-time CloudTrail anomaly detection', owner: 'Alex Torres, Cloud Engineering', due: '2026-05-01', status: 'in_progress', cis: [9, 0, 7] },
    { l: 'R-009', t: 'Payment processing system outage', d: 'Core payment gateway experiences extended outage due to software defect, database corruption, or infrastructure failure. Estimated revenue impact: $175K/hour during business hours.', ai: 1, ti: 8, cat: 'operational', iL: 3, iI: 4, rL: 1, rI: 3, tx: 'mitigate', plan: '1. Implement active-active payment processing across two regions\n2. Automated failover testing monthly via chaos engineering\n3. Establish backup manual payment processing procedures\n4. SLA: 15-minute detection, 1-hour recovery', owner: 'Nina Chen, Payments Engineering', due: '2026-06-15', status: 'open', cis: [3, 6] },
    { l: 'R-010', t: 'Mobile banking app vulnerability exploitation', d: 'Critical vulnerability in mobile banking app exploited to bypass authentication, intercept sessions, or inject malicious transactions. 890K MAU are potentially affected.', ai: 5, ti: 0, cat: 'cyber', iL: 3, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Quarterly penetration testing of mobile app (NowSecure)\n2. Implement runtime application self-protection (RASP)\n3. Certificate pinning with backup pin rotation plan\n4. Bug bounty program on HackerOne (launched Jan 2026)', owner: 'Wei Zhang, Mobile Engineering Lead', due: '2026-05-30', status: 'open', cis: [5, 12] },
    { l: 'R-011', t: 'Email account compromise enabling BEC wire fraud', d: 'Executive or treasury email account compromised through credential stuffing or phishing. Attacker initiates fraudulent wire transfer instructions impersonating CFO. Average BEC loss in financial sector: $1.1M.', ai: 4, ti: 1, cat: 'cyber', iL: 4, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Enforce FIDO2 MFA for all C-suite and treasury staff\n2. Implement out-of-band verification for wire transfers > $25K\n3. Deploy advanced BEC detection in M365 Defender\n4. Simulated BEC exercises for finance team quarterly', owner: 'Lisa Park, Security Manager', due: '2026-04-01', status: 'in_progress', cis: [0, 4, 8] },
    { l: 'R-012', t: 'Network lateral movement after initial breach', d: 'Attacker who gains initial foothold moves laterally across flat network segments to reach core banking systems. Current microsegmentation covers only 60% of critical assets.', ai: 6, ti: 0, cat: 'cyber', iL: 3, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Complete microsegmentation for remaining 40% of critical assets\n2. Deploy Vectra NDR for lateral movement detection\n3. Implement just-in-time network access for admin sessions\n4. Quarterly network penetration test validating segmentation', owner: 'Tom Rhodes, Network Engineering', due: '2026-07-01', status: 'open', cis: [2, 1] },
    { l: 'R-013', t: 'GLBA/CCPA non-compliance leading to regulatory fines', d: 'Privacy program gaps in data inventory, consent management, and data subject rights fulfillment. California AG investigation pending. Potential fine exposure: $2,500-7,500 per violation.', ai: 2, ti: 7, cat: 'compliance', iL: 3, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Complete comprehensive data inventory and flow mapping\n2. Deploy OneTrust consent management platform\n3. Automate DSAR fulfillment (current SLA: 28 days, target: 15 days)\n4. Annual GLBA risk assessment with external counsel', owner: 'Sandra Liu, Chief Privacy Officer', due: '2026-05-31', status: 'in_progress', cis: [7, 11] },
    { l: 'R-014', t: 'Disaster recovery failure for core banking', d: 'DR failover to secondary region fails during actual disaster or test. RTO target of 4 hours not achievable due to data replication lag and manual runbook dependencies.', ai: 7, ti: 8, cat: 'operational', iL: 2, iI: 5, rL: 1, rI: 4, tx: 'mitigate', plan: '1. Migrate to active-active DR architecture\n2. Automate DR runbooks with Terraform + Step Functions\n3. Monthly automated DR validation tests\n4. Reduce RPO from 4 hours to 15 minutes', owner: 'Carlos Mendez, IT Ops Director', due: '2026-08-01', status: 'open', cis: [3, 6] },
    { l: 'R-015', t: 'Shadow IT and unsanctioned SaaS data exposure', d: '1,200+ employees using 87 unsanctioned SaaS applications (identified via CASB). Customer data found in 12 unauthorized cloud services including personal Dropbox and Google Drive accounts.', ai: 9, ti: 3, cat: 'operational', iL: 4, iI: 3, rL: 3, rI: 2, tx: 'mitigate', plan: '1. Block unsanctioned cloud storage via Netskope CASB\n2. Implement sanctioned alternative catalog with SSO integration\n3. Quarterly SaaS discovery scans and remediation\n4. Policy enforcement with HR for repeat violations', owner: 'Lisa Park, Security Manager', due: '2026-06-01', status: 'open', cis: [4, 8, 11] },
    { l: 'R-016', t: 'Privilege escalation through unpatched vulnerabilities', d: 'Attacker exploits known CVE in unpatched system to escalate from standard user to domain admin. Current mean time to patch critical vulnerabilities: 18 days (target: 7 days).', ai: 4, ti: 0, cat: 'cyber', iL: 3, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Automate patching for critical CVEs (EPSS > 0.7) within 72 hours\n2. Implement virtual patching via WAF for web-facing systems\n3. Deploy CrowdStrike Falcon Spotlight for real-time vuln visibility\n4. Monthly patching compliance report to CISO', owner: 'James Okafor, Vulnerability Mgmt', due: '2026-05-30', status: 'in_progress', cis: [5, 1] },
    { l: 'R-017', t: 'Third-party data processing non-compliance', d: 'Critical vendor processing customer data fails to maintain SOC 2 compliance or experiences unreported breach. 14 vendors classified as high-risk with access to customer PII.', ai: 8, ti: 5, cat: 'compliance', iL: 3, iI: 3, rL: 2, rI: 2, tx: 'mitigate', plan: '1. Implement continuous vendor monitoring via SecurityScorecard\n2. Contractual right-to-audit for all critical vendors\n3. Annual SOC 2 Type II review required for all high-risk vendors\n4. Vendor incident response notification SLA: 24 hours', owner: 'Priya Sharma, GRC Manager', due: '2026-09-01', status: 'open', cis: [11] },
    { l: 'R-018', t: 'API rate limiting bypass causing service degradation', d: 'Attacker discovers technique to bypass API rate limits on customer-facing services, causing resource exhaustion and degraded performance for legitimate users.', ai: 8, ti: 6, cat: 'cyber', iL: 3, iI: 3, rL: 2, rI: 2, tx: 'accept', plan: 'Current AWS WAF rate limiting and Shield Advanced provide acceptable risk level. Residual risk within appetite. Re-evaluate quarterly.', owner: 'David Kim, Integration Lead', due: null, status: 'accepted', cis: [10] },
    { l: 'R-019', t: 'Employee negligence causing accidental data exposure', d: 'Employee sends spreadsheet with customer data to wrong external recipient or uploads to personal cloud storage. 3 incidents in past 12 months with average 500 records affected.', ai: 9, ti: 3, cat: 'operational', iL: 4, iI: 3, rL: 3, rI: 2, tx: 'mitigate', plan: '1. Enforce DLP external email scanning with auto-quarantine\n2. Block personal cloud storage uploads on managed devices\n3. Quarterly data handling refresher training\n4. Implement sensitivity labels on all documents containing PII', owner: 'Lisa Park, Security Manager', due: '2026-05-01', status: 'in_progress', cis: [4, 8] },
    { l: 'R-020', t: 'Backup integrity failure discovered during restore', d: 'Backup data found to be corrupted or incomplete during disaster recovery exercise. Last failed backup restore test: November 2025, affecting 12-hour data loss for 3 systems.', ai: 7, ti: 8, cat: 'operational', iL: 2, iI: 4, rL: 1, rI: 3, tx: 'mitigate', plan: '1. Implement automated daily backup integrity verification\n2. Monthly restore tests for Tier 1 systems\n3. Migrate to immutable backup with automated validation\n4. Dashboard for backup health monitoring', owner: 'Carlos Mendez, IT Ops Director', due: '2026-04-30', status: 'in_progress', cis: [3] },
  ];

  const riskIds1 = [];
  for (const r of risks1) {
    const id = riskStmt.run(
      reg1, r.l, r.t, r.d, a1[r.ai], t1[r.ti], r.cat,
      r.iL, r.iI, r.iL * r.iI, r.rL, r.rI, r.rL * r.rI,
      r.tx, r.plan, r.owner, r.due, r.status
    ).lastInsertRowid;
    riskIds1.push(id);
    for (const ci of r.cis) { rcStmt.run(id, c1[ci]); }
  }

  // Audit history for key risks
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000).toISOString();

  histStmt.run(riskIds1[0], reg1, u1, 'created', null, null, 'R-001: Ransomware disruption to core banking operations', daysAgo(45));
  histStmt.run(riskIds1[0], reg1, u2, 'updated', 'status', 'open', 'in_progress', daysAgo(30));
  histStmt.run(riskIds1[0], reg1, u2, 'updated', 'inherent_risk_score', '25', '20', daysAgo(15));
  histStmt.run(riskIds1[1], reg1, u1, 'created', null, null, 'R-002: Credential theft via spear phishing', daysAgo(45));
  histStmt.run(riskIds1[1], reg1, u3, 'updated', 'residual_risk_score', '12', '9', daysAgo(10));
  histStmt.run(riskIds1[2], reg1, u1, 'created', null, null, 'R-003: Customer PII breach from cloud data warehouse', daysAgo(40));
  histStmt.run(riskIds1[2], reg1, u2, 'updated', 'status', 'open', 'in_progress', daysAgo(20));
  histStmt.run(riskIds1[6], reg1, u1, 'created', null, null, 'R-007: OCC enforcement for BSA/AML deficiencies', daysAgo(38));
  histStmt.run(riskIds1[6], reg1, u3, 'updated', 'risk_owner', '', 'Michelle Torres, BSA Officer', daysAgo(25));

  // Comments
  commentStmt.run(riskIds1[0], u2, 'EDR team confirmed immutable backup migration is 75% complete. Remaining systems on track for March 31 deadline.', daysAgo(5));
  commentStmt.run(riskIds1[0], u1, 'Tabletop exercise scheduled for April 10. CrowdStrike IR team confirmed participation.', daysAgo(2));
  commentStmt.run(riskIds1[1], u3, 'Phishing click rate dropped to 3.8% after latest training wave. Still above 2% target.', daysAgo(7));
  commentStmt.run(riskIds1[1], u2, 'FIDO2 keys ordered for treasury team. Deployment starting next week.', daysAgo(3));
  commentStmt.run(riskIds1[2], u1, 'Column-level encryption for SSN completed. Working on account numbers next.', daysAgo(4));
  commentStmt.run(riskIds1[6], u3, 'Met with external counsel. They recommend remediating all 47 findings before OCC exam.', daysAgo(8));
  commentStmt.run(riskIds1[6], u1, 'Budget approved for 3 additional BSA analysts. HR posting positions this week.', daysAgo(1));
  commentStmt.run(riskIds1[5], u2, 'AWS Shield test completed successfully. Blocked simulated 350 Gbps attack with no customer impact.', daysAgo(6));

  // ──────────────────────────────────────────
  // REGISTER 2: ISO 27001 - Information Security Management
  // ──────────────────────────────────────────
  const reg2 = regStmt.run(u1, 'ISO 27001 ISMS - Annual Review 2026', 'Annual information security management system risk assessment aligned to ISO 27001:2022 Annex A controls. Scope: all information processing facilities and digital assets.', 'iso_27001').lastInsertRowid;

  collabStmt.run(reg2, u3, 'editor');

  const a2 = [];
  a2.push(assetStmt.run(reg2, 'Information Security Policy Framework', 'data', 'CISO Office', 'high', 'ISMS documentation including policies, standards, and procedures').lastInsertRowid);
  a2.push(assetStmt.run(reg2, 'HR Information System', 'application', 'HR Technology', 'high', 'Workday HRIS containing employee PII, compensation, and performance data').lastInsertRowid);
  a2.push(assetStmt.run(reg2, 'Physical Security Systems', 'infrastructure', 'Facilities', 'medium', 'Badge access, CCTV, and visitor management across 12 locations').lastInsertRowid);
  a2.push(assetStmt.run(reg2, 'Source Code Repositories', 'data', 'Engineering', 'high', 'GitHub Enterprise with 340 repositories including proprietary banking algorithms').lastInsertRowid);
  a2.push(assetStmt.run(reg2, 'Cryptographic Key Infrastructure', 'infrastructure', 'Security Engineering', 'critical', 'HSMs, PKI, and key management for payment card processing and TLS').lastInsertRowid);
  a2.push(assetStmt.run(reg2, 'Security Operations Center', 'infrastructure', 'SOC', 'high', 'SIEM (Splunk), SOAR (Palo Alto XSOAR), and threat intelligence platforms').lastInsertRowid);

  const t2 = [];
  t2.push(threatStmt.run(reg2, 'Policy Non-Compliance', 'compliance', 'internal', 'Staff failing to follow information security policies and procedures').lastInsertRowid);
  t2.push(threatStmt.run(reg2, 'Unauthorized Physical Access', 'operational', 'external', 'Unauthorized person gains physical access to restricted areas').lastInsertRowid);
  t2.push(threatStmt.run(reg2, 'Intellectual Property Theft', 'cyber', 'internal', 'Source code or proprietary algorithms stolen by departing employee').lastInsertRowid);
  t2.push(threatStmt.run(reg2, 'Cryptographic Key Compromise', 'cyber', 'external', 'Private keys or certificates compromised enabling man-in-the-middle attacks').lastInsertRowid);
  t2.push(threatStmt.run(reg2, 'SIEM Blind Spots', 'operational', 'internal', 'Critical security events not captured or detected by monitoring systems').lastInsertRowid);
  t2.push(threatStmt.run(reg2, 'Certification Audit Failure', 'compliance', 'external', 'ISO 27001 surveillance audit identifies major non-conformities').lastInsertRowid);

  const c2 = [];
  c2.push(controlStmt.run(reg2, 'A.5 Information Security Policies', 'preventive', 'administrative', 'moderate', 'CISO', 'Annual policy review cycle with board approval and staff acknowledgment').lastInsertRowid);
  c2.push(controlStmt.run(reg2, 'A.6 Organization of Information Security', 'preventive', 'administrative', 'moderate', 'CISO', 'Defined roles and responsibilities with segregation of duties matrix').lastInsertRowid);
  c2.push(controlStmt.run(reg2, 'A.7 Human Resource Security', 'preventive', 'administrative', 'moderate', 'HR', 'Background checks, security clauses in contracts, termination procedures').lastInsertRowid);
  c2.push(controlStmt.run(reg2, 'A.8 Asset Management', 'detective', 'administrative', 'moderate', 'IT Ops', 'CMDB with automated discovery, classification labels, and ownership assignment').lastInsertRowid);
  c2.push(controlStmt.run(reg2, 'A.10 Cryptography', 'preventive', 'technical', 'strong', 'Security Engineering', 'HSM-backed key management with automated rotation and FIPS 140-2 compliance').lastInsertRowid);
  c2.push(controlStmt.run(reg2, 'A.11 Physical Security', 'preventive', 'physical', 'moderate', 'Facilities', 'Layered physical access with badge, biometric, and 24/7 CCTV monitoring').lastInsertRowid);
  c2.push(controlStmt.run(reg2, 'A.12 Operations Security', 'detective', 'technical', 'strong', 'SOC', 'Splunk SIEM with 500+ correlation rules and 15-minute mean detection time').lastInsertRowid);
  c2.push(controlStmt.run(reg2, 'Internal Audit Program', 'detective', 'administrative', 'moderate', 'Internal Audit', 'Risk-based annual audit plan covering all ISMS domains').lastInsertRowid);

  const risks2 = [
    { l: 'R-001', t: 'Information security policy framework gaps', d: 'Several policies have not been updated to reflect ISO 27001:2022 changes. 8 of 24 policies are overdue for annual review. Staff acknowledgment rate: 78% (target: 95%).', ai: 0, ti: 0, cat: 'compliance', iL: 3, iI: 3, rL: 2, rI: 2, tx: 'mitigate', plan: '1. Complete policy refresh for all 24 policies by Q2\n2. Migrate to automated policy acknowledgment via ServiceNow\n3. Quarterly policy compliance dashboard for ISMS committee', owner: 'Priya Sharma, GRC Manager', due: '2026-06-30', status: 'in_progress', cis: [0, 7] },
    { l: 'R-002', t: 'Source code theft by departing engineer', d: 'Engineer with access to proprietary banking algorithms downloads code before resignation. GitHub audit logs show 3 bulk clone events in past 6 months from departing employees.', ai: 3, ti: 2, cat: 'operational', iL: 3, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Implement GitHub secret scanning and push protection\n2. Automated offboarding to revoke access within 1 hour of resignation\n3. DLP monitoring for large code downloads\n4. IP assignment agreements updated in employment contracts', owner: 'Lisa Park, Security Manager', due: '2026-05-15', status: 'open', cis: [2, 3] },
    { l: 'R-003', t: 'Cryptographic key compromise impacting payments', d: 'HSM firmware vulnerability or operational error exposes private keys used for payment card transaction signing. PCI DSS Requirement 3 compliance at risk.', ai: 4, ti: 3, cat: 'cyber', iL: 2, iI: 5, rL: 1, rI: 4, tx: 'mitigate', plan: '1. Upgrade HSM firmware to latest version\n2. Implement dual-control key ceremonies\n3. Annual PCI DSS key management audit\n4. Automated certificate expiry monitoring', owner: 'Security Engineering Lead', due: '2026-07-01', status: 'open', cis: [4] },
    { l: 'R-004', t: 'SIEM detection blind spots for cloud workloads', d: 'Splunk SIEM covers only 70% of cloud workloads. Container and serverless logs not fully ingested. Mean time to detect for cloud-origin incidents: 4.2 hours vs 22 minutes for on-prem.', ai: 5, ti: 4, cat: 'operational', iL: 4, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Onboard remaining 30% cloud log sources by Q2\n2. Build cloud-native detection rules (50 new rules planned)\n3. Deploy CloudTrail Lake for long-term investigation\n4. Hire cloud security analyst for SOC team', owner: 'SOC Manager', due: '2026-06-15', status: 'in_progress', cis: [6] },
    { l: 'R-005', t: 'ISO 27001 surveillance audit major non-conformity', d: 'Surveillance audit scheduled for September 2026. Previous audit identified 3 minor non-conformities in access management and change management. Risk of major NC if not remediated.', ai: 0, ti: 5, cat: 'compliance', iL: 2, iI: 4, rL: 1, rI: 3, tx: 'mitigate', plan: '1. Remediate all 3 prior non-conformities with evidence\n2. Internal audit cycle covering all Annex A domains before August\n3. Management review meeting in July to confirm readiness\n4. Pre-audit readiness assessment with external consultant', owner: 'Priya Sharma, GRC Manager', due: '2026-08-15', status: 'open', cis: [7, 0] },
    { l: 'R-006', t: 'Unauthorized physical access to server room', d: 'Badge access system firmware is 3 years old. No biometric verification at server room entry. Two tailgating incidents reported in past 6 months.', ai: 2, ti: 1, cat: 'operational', iL: 2, iI: 3, rL: 1, rI: 2, tx: 'mitigate', plan: '1. Upgrade badge system firmware and add biometric reader\n2. Install anti-tailgating mantrap at server room entrance\n3. Monthly physical security audit walks\n4. Annual social engineering assessment including physical', owner: 'Facilities Director', due: '2026-09-01', status: 'open', cis: [5] },
    { l: 'R-007', t: 'HR data breach from Workday misconfiguration', d: 'Overly permissive Workday security roles expose employee compensation and performance data to unauthorized managers. Last access review found 34 excessive access grants.', ai: 1, ti: 0, cat: 'operational', iL: 3, iI: 3, rL: 2, rI: 2, tx: 'mitigate', plan: '1. Redesign Workday security role matrix with least privilege\n2. Quarterly access recertification for all Workday roles\n3. Enable Workday security audit trail and alerting', owner: 'HR Technology Lead', due: '2026-05-31', status: 'in_progress', cis: [1, 3] },
  ];

  for (const r of risks2) {
    const id = riskStmt.run(
      reg2, r.l, r.t, r.d, a2[r.ai], t2[r.ti], r.cat,
      r.iL, r.iI, r.iL * r.iI, r.rL, r.rI, r.rL * r.rI,
      r.tx, r.plan, r.owner, r.due, r.status
    ).lastInsertRowid;
    for (const ci of r.cis) { rcStmt.run(id, c2[ci]); }
  }

  // ──────────────────────────────────────────
  // REGISTER 3: SOX ITGC - IT General Controls
  // ──────────────────────────────────────────
  const reg3 = regStmt.run(u3, 'SOX ITGC - FY2026 Assessment', 'Sarbanes-Oxley Section 404 IT General Controls assessment covering access management, change management, computer operations, and program development for financially significant applications.', 'sox_itgc').lastInsertRowid;

  collabStmt.run(reg3, u1, 'editor');
  collabStmt.run(reg3, u2, 'viewer');

  const a3 = [];
  a3.push(assetStmt.run(reg3, 'SAP S/4HANA (General Ledger)', 'application', 'Finance IT', 'critical', 'Enterprise ERP system for financial reporting, journal entries, and consolidation').lastInsertRowid);
  a3.push(assetStmt.run(reg3, 'Oracle HCM (Payroll)', 'application', 'HR Technology', 'critical', 'Payroll processing for 1,200 employees with direct deposit integrations').lastInsertRowid);
  a3.push(assetStmt.run(reg3, 'BlackLine (Reconciliation)', 'application', 'Accounting', 'high', 'Account reconciliation and close management tool for 2,400 accounts').lastInsertRowid);
  a3.push(assetStmt.run(reg3, 'Concur (T&E)', 'application', 'Finance', 'medium', 'Travel and expense management with automated approval workflows').lastInsertRowid);

  const t3 = [];
  t3.push(threatStmt.run(reg3, 'Unauthorized Access to Financial Systems', 'compliance', 'internal', 'Users retain access to SOX-relevant applications after role change or termination').lastInsertRowid);
  t3.push(threatStmt.run(reg3, 'Segregation of Duties Violations', 'compliance', 'internal', 'Single user can initiate and approve financial transactions without proper SoD controls').lastInsertRowid);
  t3.push(threatStmt.run(reg3, 'Unauthorized Changes to Financial Applications', 'compliance', 'internal', 'Changes deployed to production without proper testing, approval, or documentation').lastInsertRowid);
  t3.push(threatStmt.run(reg3, 'Batch Processing Failures', 'operational', 'internal', 'Scheduled financial batch jobs fail without detection, causing inaccurate reporting').lastInsertRowid);

  const c3 = [];
  c3.push(controlStmt.run(reg3, 'User Access Provisioning (ITGC-AC-01)', 'preventive', 'administrative', 'moderate', 'IAM Team', 'Formal access request and approval workflow via ServiceNow for all SOX apps').lastInsertRowid);
  c3.push(controlStmt.run(reg3, 'Quarterly Access Recertification (ITGC-AC-02)', 'detective', 'administrative', 'moderate', 'Internal Audit', 'Quarterly review of user access to SOX-relevant applications by system owners').lastInsertRowid);
  c3.push(controlStmt.run(reg3, 'Termination Access Revocation (ITGC-AC-03)', 'preventive', 'administrative', 'weak', 'HR/IT Ops', 'Access disabled within 24 hours of termination date per HR notification').lastInsertRowid);
  c3.push(controlStmt.run(reg3, 'SoD Matrix Enforcement (ITGC-AC-04)', 'preventive', 'technical', 'moderate', 'GRC Team', 'Automated SoD conflict detection in SAP GRC for 120 critical transaction combinations').lastInsertRowid);
  c3.push(controlStmt.run(reg3, 'Change Management Process (ITGC-CM-01)', 'preventive', 'administrative', 'moderate', 'IT Change Mgmt', 'ServiceNow-managed CAB process with testing evidence and production approval').lastInsertRowid);
  c3.push(controlStmt.run(reg3, 'Batch Job Monitoring (ITGC-CO-01)', 'detective', 'technical', 'moderate', 'IT Ops', 'Automated monitoring of all scheduled financial batch jobs with alerting on failure').lastInsertRowid);

  const risks3 = [
    { l: 'ITGC-R01', t: 'Stale access to SAP after employee role changes', d: 'Internal audit found 47 users with SAP access inconsistent with current role. Average time to revoke access after role change: 12 business days. PCAOB identified this as common deficiency.', ai: 0, ti: 0, cat: 'compliance', iL: 4, iI: 4, rL: 3, rI: 3, tx: 'mitigate', plan: '1. Implement automated role-based provisioning via SailPoint\n2. Reduce access revocation SLA from 12 to 3 business days\n3. Monthly stale access report to application owners\n4. Remediate 47 identified exceptions by end of Q1', owner: 'IAM Team Lead', due: '2026-04-30', status: 'in_progress', cis: [0, 1] },
    { l: 'ITGC-R02', t: 'Segregation of duties violations in SAP', d: 'SoD analysis found 23 active conflicts in SAP: 8 users can create and approve journal entries, 15 users can create vendors and process payments. 4 conflicts involve users in finance leadership.', ai: 0, ti: 1, cat: 'compliance', iL: 3, iI: 5, rL: 2, rI: 4, tx: 'mitigate', plan: '1. Remediate 8 critical SoD conflicts (journal entry) by March 31\n2. Implement mitigating controls for 15 remaining conflicts\n3. Deploy SAP GRC Access Control for real-time SoD checking\n4. Quarterly SoD monitoring report to CFO', owner: 'Priya Sharma, GRC Manager', due: '2026-05-31', status: 'in_progress', cis: [3] },
    { l: 'ITGC-R03', t: 'Terminated employees retaining system access', d: 'Spot check found 5 terminated employees with active accounts 3+ weeks after termination date. Root cause: HR notification delay and manual provisioning process.', ai: 0, ti: 0, cat: 'compliance', iL: 3, iI: 4, rL: 2, rI: 3, tx: 'mitigate', plan: '1. Automate Workday → Active Directory termination trigger\n2. Same-day access revocation for SOX-relevant applications\n3. Weekly terminated employee access reconciliation report\n4. Escalation process for HR notification delays', owner: 'IAM Team Lead', due: '2026-04-15', status: 'in_progress', cis: [2, 0] },
    { l: 'ITGC-R04', t: 'Emergency changes bypassing CAB approval', d: '14% of production changes to SOX applications were classified as emergency in 2025 (target: < 5%). 6 emergency changes lacked post-implementation review documentation.', ai: 0, ti: 2, cat: 'compliance', iL: 3, iI: 3, rL: 2, rI: 2, tx: 'mitigate', plan: '1. Tighten emergency change criteria and require VP approval\n2. Mandatory post-implementation review within 5 business days\n3. Monthly emergency change trend reporting to IT Director\n4. Target: reduce emergency changes to < 5% by Q3', owner: 'IT Change Manager', due: '2026-06-30', status: 'open', cis: [4] },
    { l: 'ITGC-R05', t: 'Financial batch processing failure goes undetected', d: 'Month-end close batch job for BlackLine reconciliation failed silently in October 2025. Detected 3 days later, requiring manual reconciliation of 240 accounts.', ai: 2, ti: 3, cat: 'operational', iL: 2, iI: 4, rL: 1, rI: 3, tx: 'mitigate', plan: '1. Implement real-time batch job monitoring with PagerDuty alerting\n2. Daily batch completion dashboard for finance team\n3. Automated retry logic for transient failures\n4. Monthly batch processing reliability report', owner: 'IT Ops Manager', due: '2026-05-01', status: 'in_progress', cis: [5] },
  ];

  for (const r of risks3) {
    const id = riskStmt.run(
      reg3, r.l, r.t, r.d, a3[r.ai], t3[r.ti], r.cat,
      r.iL, r.iI, r.iL * r.iI, r.rL, r.rI, r.rL * r.rI,
      r.tx, r.plan, r.owner, r.due, r.status
    ).lastInsertRowid;
    for (const ci of r.cis) { rcStmt.run(id, c3[ci]); }
  }

  console.log('Seed data created successfully.');
  console.log('');
  console.log('Demo accounts:');
  console.log('  sarah.chen@meridian.io / demo1234 (CISO - owns NIST CSF & ISO 27001 registers)');
  console.log('  james.okafor@meridian.io / analyst1 (Vulnerability Mgmt - editor on NIST CSF)');
  console.log('  priya.sharma@meridian.io / manager1 (GRC Manager - owns SOX ITGC register)');
}

module.exports = { runSeed };

// Allow running directly: node db/seed.js
if (require.main === module) {
  const { getDb } = require('./database');
  getDb().then(db => runSeed(db)).catch(console.error);
}
