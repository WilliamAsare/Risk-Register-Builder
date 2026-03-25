const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { getDb } = require('./db/database');
const { SqliteSessionStore } = require('./db/sessionStore');

async function startServer() {
  // Wait for database to be ready
  const db = await getDb();

  // Make db available globally for routes
  global.__db = db;

  const authRoutes = require('./routes/auth');
  const registerRoutes = require('./routes/registers');
  const assetRoutes = require('./routes/assets');
  const threatRoutes = require('./routes/threats');
  const controlRoutes = require('./routes/controls');
  const riskRoutes = require('./routes/risks');
  const exportRoutes = require('./routes/exports');
  const historyRoutes = require('./routes/history');
  const commentRoutes = require('./routes/comments');
  const collaboratorRoutes = require('./routes/collaborators');

  const app = express();
  const PORT = process.env.PORT || 3001;
  const isProd = process.env.NODE_ENV === 'production';

  // Trust Railway's reverse proxy so secure cookies work over HTTPS
  app.set('trust proxy', true);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }));
  app.use(cors({
    origin: isProd ? true : (process.env.CLIENT_URL || 'http://localhost:5173'),
    credentials: true,
  }));
  app.use(express.json());
  app.use(morgan('[:date[iso]] :method :url :status :res[content-length] - :response-time ms'));

  const sessionSecret = process.env.SESSION_SECRET;
  if (isProd && !sessionSecret) {
    console.error('FATAL: SESSION_SECRET environment variable is required in production');
    process.exit(1);
  }

  app.use(session({
    store: new SqliteSessionStore({ checkPeriod: 86400000 }),
    secret: sessionSecret || 'risk-register-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/registers', registerRoutes);
  app.use('/api/registers/:id/assets', assetRoutes);
  app.use('/api/registers/:id/threats', threatRoutes);
  app.use('/api/registers/:id/controls', controlRoutes);
  app.use('/api/registers/:id/risks', riskRoutes);
  app.use('/api/registers/:id/risks', historyRoutes);
  app.use('/api/registers/:id/risks', commentRoutes);
  app.use('/api/registers/:id/collaborators', collaboratorRoutes);
  app.use('/api/registers/:id', exportRoutes);

  // Serve static files in production
  if (isProd) {
    app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    });
  }

  app.use((err, req, res, _next) => {
    const status = err.status || 500;
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${status}: ${err.message}`);
    const message = isProd ? 'Internal server error' : (err.message || 'Internal server error');
    res.status(status).json({ error: message });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
