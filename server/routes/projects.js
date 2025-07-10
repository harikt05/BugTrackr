const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create project (lead only)
router.post('/', authenticateToken, requireRole('lead'), async (req, res) => {
  const { title, description } = req.body;
  const lead_id = req.user.id;
  if (!title) return res.status(400).json({ message: 'Title required.' });
  try {
    await pool.query('INSERT INTO projects (title, description, lead_id) VALUES (?, ?, ?)', [title, description, lead_id]);
    res.status(201).json({ message: 'Project created.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all projects (lead)
router.get('/all', authenticateToken, requireRole('lead'), async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM projects WHERE lead_id = ?', [req.user.id]);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get projects assigned to member (by bugs assigned)
router.get('/my', authenticateToken, async (req, res) => {
  if (req.user.role === 'lead') {
    // For leads, return all their projects
    const [projects] = await pool.query('SELECT * FROM projects WHERE lead_id = ?', [req.user.id]);
    return res.json(projects);
  }
  try {
    const [projects] = await pool.query(`
      SELECT DISTINCT p.* FROM projects p
      JOIN bugs b ON b.project_id = p.id
      WHERE b.assigned_to = ?
    `, [req.user.id]);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 