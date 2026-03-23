const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getRisksWithControls } = require('../db/queries');

const db = () => global.__db;
const { generatePDF } = require('../services/pdfExport');
const { generateExcel } = require('../services/excelExport');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

function getFullRegister(registerId, userId) {
  const register = db().prepare(
    'SELECT * FROM registers WHERE id = ? AND user_id = ?'
  ).get(registerId, userId);
  if (!register) return null;

  register.assets = db().prepare('SELECT * FROM assets WHERE register_id = ?').all(register.id);
  register.threats = db().prepare('SELECT * FROM threats WHERE register_id = ?').all(register.id);
  register.controls = db().prepare('SELECT * FROM controls WHERE register_id = ?').all(register.id);
  register.risks = getRisksWithControls(register.id);

  return register;
}

router.get('/export/pdf', asyncHandler((req, res) => {
  const register = getFullRegister(req.params.id, req.session.userId);
  if (!register) return res.status(404).json({ error: 'Register not found' });

  const user = db().prepare('SELECT id, name, organization FROM users WHERE id = ?').get(req.session.userId);
  const pdfBuffer = generatePDF(register, user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${register.name.replace(/[^a-zA-Z0-9]/g, '_')}_Risk_Register.pdf"`);
  res.send(Buffer.from(pdfBuffer));
}));

router.get('/export/excel', asyncHandler(async (req, res) => {
  const register = getFullRegister(req.params.id, req.session.userId);
  if (!register) return res.status(404).json({ error: 'Register not found' });

  const workbook = await generateExcel(register);
  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${register.name.replace(/[^a-zA-Z0-9]/g, '_')}_Risk_Register.xlsx"`);
  res.send(Buffer.from(buffer));
}));

module.exports = router;
