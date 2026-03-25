import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

const sections = [
  { id: 'overview', title: 'Overview', content: `Risk Register Builder is a full-stack GRC (Governance, Risk & Compliance) application designed for IT auditors, CISOs, and GRC professionals. It provides a structured workflow for identifying, assessing, and managing information security risks.\n\nSupported frameworks include NIST CSF 2.0, ISO 27001, SOX ITGC, and General (start from scratch).` },
  { id: 'getting-started', title: 'Getting Started', content: `Navigate to the application URL. You will see the landing page with options to sign in or create an account.\n\nTo create an account, click "Get Started" or "Sign up", enter your full name, email, password (8+ characters), and optionally your organization. You will be signed in automatically.\n\nSessions last 24 hours. Click "Sign out" in the top-right to log out.` },
  { id: 'dashboard', title: 'Dashboard', content: `The dashboard is your home screen after logging in. It displays:\n\n- Risk Overview Chart: Donut chart showing Critical vs Other risks with total count\n- Risks by Register: Bar chart comparing risk counts per register\n- Register Cards: Each register shows name, framework, total/critical/open counts, risk distribution bar, and last updated date\n- Framework and Risk Level filters to narrow displayed registers\n- "+ New Risk Register" button to create a new register` },
  { id: 'creating-register', title: 'Creating a Risk Register', content: `The 6-step wizard guides you through creating a complete risk register:\n\nStep 1 - Register Info: Enter name, description, and select a framework template. Frameworks pre-populate assets, threats, and controls.\n\nStep 2 - Assets: Review and customize assets in scope. Add custom assets with name, type, owner, and criticality.\n\nStep 3 - Threats: Review and customize threats. Each has name, category, and source.\n\nStep 4 - Controls: Review and customize controls. Each has name, type, category, effectiveness, and owner.\n\nStep 5 - Risk Assessment: Add risks using Quick Add (rapid entry) or Detail Mode (full form). Set inherent and residual likelihood/impact scores (1-5 each).\n\nStep 6 - Review: Preview summary, risk distribution, and heat map. Click "Create Risk Register" to save.` },
  { id: 'managing-risks', title: 'Managing Risks', content: `The Risks tab shows a sortable, filterable table with columns: ID, Title, Category, Inherent score, Residual score, Treatment, Status, Owner.\n\nClick column headers to sort. Use status filter buttons (All, Open, In Progress, Closed, Accepted) to narrow the view.\n\nClick "+ Add Risk" to create new risks. Click any row to open the Risk Detail Panel.\n\nQuick Add mode lets you rapidly enter risks with just title, category, and L x I scores. Detail Mode provides all fields including asset/threat linkage, treatment plan, and control mapping.` },
  { id: 'heat-map', title: 'Heat Map', content: `The Heatmap tab displays an interactive 5x5 risk matrix with Likelihood (Y-axis) and Impact (X-axis).\n\nFeatures:\n- Toggle between Inherent and Residual risk views\n- Risk Appetite threshold line (configurable: Low 4+, Moderate 8+, High 12+, Very High 16+)\n- Color coding: Green (Low 1-3), Yellow (Medium 4-7), Orange (High 8-15), Red (Critical 16-25)\n- Risk counts in each cell\n- Above/within appetite summary` },
  { id: 'analytics', title: 'Analytics', content: `The Analytics tab provides 4 charts:\n\n1. Risks by Category: Bar chart showing distribution across Cyber, Operational, Compliance, Strategic, Third Party\n2. Treatment Strategy: Pie chart of Mitigate, Accept, Transfer, Avoid breakdown\n3. Risk Status: Horizontal bar chart of Open, In Progress, Closed, Accepted\n4. Inherent vs Residual: Grouped bar chart comparing scores per risk to show control effectiveness` },
  { id: 'risk-detail', title: 'Risk Detail Panel', content: `Click any risk row to open a slide-over panel with three tabs:\n\nDetails Tab: Full risk information including scores, linked assets/threats/controls, treatment plan. Click edit to modify.\n\nComments Tab: Add threaded comments attributed to your user account with timestamps.\n\nHistory Tab: Complete audit trail with field-level change tracking showing what changed, old value, new value, who changed it, and when.` },
  { id: 'assets-threats-controls', title: 'Assets, Threats & Controls', content: `These tabs on the register detail page show data tables for each entity type.\n\nTo edit, click the pencil icon next to the register name to open the Edit Register slide-over. It includes tabs for:\n- Register Info: Edit name, description, framework\n- Assets: Add, inline edit, or delete assets\n- Threats: Add, inline edit, or delete threats\n- Controls: Add, inline edit, or delete controls` },
  { id: 'clone', title: 'Clone Register', content: `Cloning creates a complete deep copy of a register including all assets, threats, controls, and risks.\n\n1. Click "Clone" on the register detail page\n2. Enter a new name\n3. Click "Clone Register"\n\nUseful for periodic assessments (e.g., quarterly reviews) based on a previous assessment.` },
  { id: 'csv-import', title: 'CSV Import', content: `Bulk import risks from a CSV file:\n\n1. Click "Import CSV" on the register detail page\n2. Upload a CSV with columns: risk_id_label, title, risk_category, inherent_likelihood, inherent_impact, residual_likelihood, residual_impact\n3. Preview parsed data\n4. Click "Import"\n\nOptional columns: description, treatment, treatment_plan, risk_owner, due_date, status. Maximum 500 rows per import.` },
  { id: 'exports', title: 'PDF & Excel Export', content: `PDF Export: Click "PDF" to generate a professional report with register summary, risk statistics, and complete risk table formatted for audit submission.\n\nExcel Export: Click "Excel" to generate a workbook with separate sheets for Summary, Risks (color-coded), Assets, Threats, and Controls.` },
  { id: 'search', title: 'Search', content: `Global search is available from the dashboard nav bar. Press "/" to focus the search input. Type 2+ characters to search across all your registers.\n\nResults show matching risks with their ID, title, score, and register name. Click a result to navigate directly to that register.` },
  { id: 'collaboration', title: 'Collaboration & Sharing', content: `Share registers with team members:\n\n1. Open a register you own\n2. Click the share icon\n3. Enter a collaborator's email and select their role (Editor or Viewer)\n4. Click "Add"\n\nRoles:\n- Owner: Full access including delete and sharing\n- Editor: Can edit risks, assets, threats, controls, and metadata\n- Viewer: Read-only access\n\nRemove collaborators by clicking the X next to their name.` },
  { id: 'scoring', title: 'Scoring Guide', subsections: [
    { title: 'Formula', content: 'Risk Score = Likelihood (1-5) x Impact (1-5)' },
    { title: 'Likelihood Scale', items: ['1 - Rare: Very unlikely to occur', '2 - Unlikely: Could occur but not expected', '3 - Possible: May occur at some point', '4 - Likely: Will probably occur', '5 - Almost Certain: Expected to occur'] },
    { title: 'Impact Scale', items: ['1 - Minimal: Negligible impact', '2 - Minor: Easily recoverable', '3 - Moderate: Requires effort to recover', '4 - Major: Significant operational impact', '5 - Critical: Severe, potential business failure'] },
    { title: 'Risk Levels', items: ['Low (1-3): Monitor and accept', 'Medium (4-7): Review and consider treatment', 'High (8-15): Treat with priority', 'Critical (16-25): Immediate action required'] },
    { title: 'Treatment Options', items: ['Mitigate: Implement controls to reduce likelihood or impact', 'Accept: Acknowledge and monitor without action', 'Transfer: Shift risk to third party (insurance, outsourcing)', 'Avoid: Eliminate the activity creating the risk'] },
  ]},
];

const RISK_MATRIX = [
  [5, 10, 15, 20, 25],
  [4, 8, 12, 16, 20],
  [3, 6, 9, 12, 15],
  [2, 4, 6, 8, 10],
  [1, 2, 3, 4, 5],
];
const L_LABELS = ['5 - Almost Certain', '4 - Likely', '3 - Possible', '2 - Unlikely', '1 - Rare'];
const I_LABELS = ['1 - Minimal', '2 - Minor', '3 - Moderate', '4 - Major', '5 - Critical'];

function getCellColor(score) {
  if (score >= 16) return 'bg-red-100 text-red-800 font-bold';
  if (score >= 8) return 'bg-orange-100 text-orange-800';
  if (score >= 4) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

function generatePdf() {
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then(() => {
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(22);
      doc.setTextColor(30, 58, 95);
      doc.text('Risk Register Builder', 105, y, { align: 'center' });
      y += 10;
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text('User Manual', 105, y, { align: 'center' });
      y += 15;

      doc.setDrawColor(30, 58, 95);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
      y += 10;

      // Table of contents
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 95);
      doc.text('Table of Contents', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60);
      sections.forEach((s, i) => {
        doc.text(`${i + 1}. ${s.title}`, 25, y);
        y += 5;
        if (y > 270) { doc.addPage(); y = 20; }
      });

      // Sections
      sections.forEach(s => {
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.setTextColor(30, 58, 95);
        doc.text(s.title, 20, y);
        y += 10;

        if (s.content) {
          doc.setFontSize(10);
          doc.setTextColor(50);
          const lines = doc.splitTextToSize(s.content, 170);
          lines.forEach(line => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(line, 20, y);
            y += 5;
          });
        }

        if (s.subsections) {
          s.subsections.forEach(sub => {
            y += 5;
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFontSize(12);
            doc.setTextColor(30, 58, 95);
            doc.text(sub.title, 20, y);
            y += 7;
            doc.setFontSize(10);
            doc.setTextColor(50);
            if (sub.content) {
              doc.text(sub.content, 25, y);
              y += 6;
            }
            if (sub.items) {
              sub.items.forEach(item => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.text(`- ${item}`, 25, y);
                y += 5;
              });
            }
          });
        }

        // Add risk matrix to scoring section
        if (s.id === 'scoring') {
          y += 10;
          if (y > 200) { doc.addPage(); y = 20; }
          doc.setFontSize(12);
          doc.setTextColor(30, 58, 95);
          doc.text('5x5 Risk Matrix', 20, y);
          y += 5;

          doc.autoTable({
            startY: y,
            head: [['L \\ I', '1-Min', '2-Minor', '3-Mod', '4-Major', '5-Crit']],
            body: RISK_MATRIX.map((row, i) => [L_LABELS[i].split(' - ')[0], ...row]),
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
            headStyles: { fillColor: [30, 58, 95] },
            bodyStyles: { textColor: [50, 50, 50] },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index > 0) {
                const val = data.cell.raw;
                if (val >= 16) data.cell.styles.fillColor = [254, 202, 202];
                else if (val >= 8) data.cell.styles.fillColor = [254, 215, 170];
                else if (val >= 4) data.cell.styles.fillColor = [254, 240, 138];
                else data.cell.styles.fillColor = [187, 247, 208];
              }
            },
          });
        }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Risk Register Builder - User Manual | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      doc.save('RiskRegister_User_Manual.pdf');
    });
  });
}

export default function Guide() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) setActiveSection(hash);
  }, []);

  const scrollTo = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-navy text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-bold">RiskRegister</span>
            </Link>
            <span className="text-white/50 mx-2">|</span>
            <span className="text-sm text-white/80">User Guide</span>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={generatePdf} className="!text-white !border-white/30 hover:!bg-white/10">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download PDF
            </Button>
            <Link to={user ? '/dashboard' : '/login'}>
              <Button size="sm" variant="ghost" className="!text-white/70 hover:!text-white">
                {user ? '← Dashboard' : '← Sign In'}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contents</h3>
            <nav className="space-y-0.5">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeSection === s.id
                      ? 'bg-navy text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile TOC toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-40 bg-navy text-white p-3 rounded-full shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Contents</h3>
              {sections.map(s => (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  className={`block w-full text-left px-3 py-2 rounded text-sm ${activeSection === s.id ? 'bg-navy text-white' : 'text-slate-700'}`}
                >{s.title}</button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0" ref={contentRef}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-8">
            <h1 className="text-3xl font-bold text-navy mb-2">User Guide</h1>
            <p className="text-slate-500">Complete guide to using Risk Register Builder for IT risk management and GRC compliance.</p>
          </div>

          {sections.map(s => (
            <section key={s.id} id={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 mb-4 scroll-mt-20">
              <h2 className="text-xl font-bold text-navy mb-4">{s.title}</h2>
              {s.content && (
                <div className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">{s.content}</div>
              )}
              {s.subsections && (
                <div className="space-y-6 mt-4">
                  {s.subsections.map(sub => (
                    <div key={sub.title}>
                      <h3 className="text-base font-semibold text-slate-800 mb-2">{sub.title}</h3>
                      {sub.content && <p className="text-sm text-slate-600 mb-2">{sub.content}</p>}
                      {sub.items && (
                        <ul className="space-y-1">
                          {sub.items.map(item => (
                            <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-navy mt-1">-</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  {/* Inline risk matrix */}
                  <div>
                    <h3 className="text-base font-semibold text-slate-800 mb-3">5x5 Risk Matrix</h3>
                    <div className="overflow-x-auto">
                      <table className="text-sm border-collapse">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 bg-navy text-white text-xs rounded-tl-lg">L \ I</th>
                            {I_LABELS.map(l => <th key={l} className="px-3 py-2 bg-navy text-white text-xs">{l}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {RISK_MATRIX.map((row, ri) => (
                            <tr key={ri}>
                              <td className="px-3 py-2 bg-slate-100 text-xs font-medium text-slate-700 whitespace-nowrap">{L_LABELS[ri]}</td>
                              {row.map((val, ci) => (
                                <td key={ci} className={`px-3 py-2 text-center text-xs font-semibold ${getCellColor(val)}`}>{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </section>
          ))}

          <div className="text-center text-sm text-slate-400 py-8">
            Built by Rose Achar & William Asare Yirenkyi
          </div>
        </main>
      </div>
    </div>
  );
}
