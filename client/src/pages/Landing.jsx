import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const features = [
  {
    title: 'Guided Risk Wizard',
    desc: 'Step-by-step workflow to identify assets, threats, controls, and assess risks with pre-populated framework data.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Interactive Heat Map',
    desc: 'Visualize your risk landscape with a 5x5 risk matrix. Toggle between inherent and residual views to see control effectiveness.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    title: 'Professional Exports',
    desc: 'Generate CISO-ready PDF reports and formatted Excel workbooks with one click. Perfect for audit submissions.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Framework Templates',
    desc: 'Start with NIST CSF 2.0, ISO 27001, or SOX ITGC templates pre-loaded with relevant assets, threats, and controls.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-navy">RiskRegister</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/guide">
              <Button variant="ghost" size="sm">Guide</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-navy-50 text-navy px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Free & Open Source
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            Build Professional Risk Registers <br />
            <span className="text-navy">Without the Spreadsheet Pain</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            A guided wizard to identify risks, assess impact, map controls, and generate
            audit-ready reports. Built for IT auditors, CISOs, and GRC professionals.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg">Create Free Risk Register</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Heat map preview */}
      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-800">Risk Heat Map Preview</h3>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Low 1-3</span>
                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Medium 4-7</span>
                <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">High 8-15</span>
                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Critical 16-25</span>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1">
              <div className="text-xs text-slate-500 flex items-center justify-end pr-2 font-medium">5</div>
              {[5,10,15,20,25].map(s => <HeatCell key={s} score={s} />)}
              <div className="text-xs text-slate-500 flex items-center justify-end pr-2 font-medium">4</div>
              {[4,8,12,16,20].map(s => <HeatCell key={`4-${s}`} score={s} />)}
              <div className="text-xs text-slate-500 flex items-center justify-end pr-2 font-medium">3</div>
              {[3,6,9,12,15].map(s => <HeatCell key={`3-${s}`} score={s} />)}
              <div className="text-xs text-slate-500 flex items-center justify-end pr-2 font-medium">2</div>
              {[2,4,6,8,10].map(s => <HeatCell key={`2-${s}`} score={s} />)}
              <div className="text-xs text-slate-500 flex items-center justify-end pr-2 font-medium">1</div>
              {[1,2,3,4,5].map(s => <HeatCell key={`1-${s}`} score={s} />)}
              <div />
              {['1','2','3','4','5'].map(n => (
                <div key={n} className="text-xs text-slate-500 text-center font-medium pt-1">{n}</div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs text-slate-400">
              <span className="ml-6">Likelihood (rows) / Impact (columns)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-12">Everything You Need for Risk Assessment</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <div key={i} className="flex gap-4 p-4">
                <div className="w-12 h-12 bg-navy-50 rounded-lg flex items-center justify-center text-navy shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200">
        <div className="max-w-5xl mx-auto text-center text-sm text-slate-500">
          <p>Built by Rose Achar & William Asare Yirenkyi</p>
          <p className="mt-1">Open source under MIT License</p>
        </div>
      </footer>
    </div>
  );
}

function HeatCell({ score }) {
  const bg = score >= 16 ? 'bg-red-500' : score >= 8 ? 'bg-orange-400' : score >= 4 ? 'bg-yellow-400' : 'bg-green-400';
  return (
    <div className={`${bg} rounded h-12 flex items-center justify-center text-white text-sm font-bold opacity-80 hover:opacity-100 transition-opacity`}>
      {score}
    </div>
  );
}
