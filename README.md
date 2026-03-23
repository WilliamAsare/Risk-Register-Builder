# Risk Register Builder

A professional, full-stack web application for creating, managing, and visualizing risk registers. Built for IT auditors, CISOs, GRC analysts, and compliance professionals who need a modern alternative to Excel-based risk registers.

![Dashboard](./screenshots/dashboard.png)
![Heat Map](./screenshots/heatmap.png)

## Features

- **Guided Risk Wizard** - Step-by-step workflow: identify assets, threats, controls, then assess risks with clickable rating grids
- **Interactive Heat Map** - 5x5 risk matrix with toggle between inherent and residual views, tooltips, and click-to-filter
- **Framework Templates** - Pre-populated data for NIST CSF 2.0, ISO 27001, and SOX ITGC
- **PDF Export** - Professional multi-page reports with cover page, executive summary, heat map visualization, risk details, and appendices
- **Excel Export** - Multi-sheet workbook with conditional formatting, frozen headers, and color-coded risk scores
- **Risk Assessment** - Auto-calculated inherent and residual risk scores with visual before/after comparison
- **Dashboard** - Overview of all registers with summary stats, risk distribution bars, and quick actions
- **Full CRUD** - Create, read, update, and delete risks, assets, threats, and controls with inline editing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite (sql.js) |
| PDF Export | jsPDF + jsPDF-AutoTable |
| Excel Export | ExcelJS |
| Auth | Express sessions + bcrypt |
| Notifications | react-hot-toast |

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/risk-register-builder.git
cd risk-register-builder

# Install all dependencies
npm run install:all

# Seed the database with demo data
npm run seed

# Start development servers
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Demo Account

```
Email: demo@riskregister.app
Password: demo123
```

The demo account includes a pre-populated NIST CSF risk register with 15 realistic risk entries.

## Docker

```bash
# Build and run
docker-compose up -d

# Access at http://localhost:3001
```

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Registers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registers` | List all registers |
| POST | `/api/registers` | Create register |
| GET | `/api/registers/:id` | Get register with all data |
| PUT | `/api/registers/:id` | Update register |
| DELETE | `/api/registers/:id` | Delete register |
| GET | `/api/registers/:id/stats` | Get aggregated stats |

### CRUD Resources (Assets, Threats, Controls, Risks)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registers/:id/{resource}` | List items |
| POST | `/api/registers/:id/{resource}` | Create item |
| PUT | `/api/registers/:id/{resource}/:itemId` | Update item |
| DELETE | `/api/registers/:id/{resource}/:itemId` | Delete item |

### Risk-Control Linking
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/registers/:id/risks/:riskId/controls` | Link control |
| DELETE | `/api/registers/:id/risks/:riskId/controls/:controlId` | Unlink control |

### Exports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registers/:id/export/pdf` | Download PDF report |
| GET | `/api/registers/:id/export/excel` | Download Excel workbook |

## Project Structure

```
risk-register-builder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── context/        # Auth context
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # API client, risk calculations
│   └── ...
├── server/                 # Express backend
│   ├── db/                 # Schema, seed, database connection
│   ├── routes/             # API route handlers
│   ├── middleware/          # Auth middleware
│   └── services/           # PDF & Excel export services
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built by **William Asare Yirenkyi** | [LinkedIn](https://linkedin.com/in/williamyirenkyi) | [Portfolio](https://williamyirenkyi.com)
