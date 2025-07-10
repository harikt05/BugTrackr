const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users for assignment dropdown (lead only)
router.get('/users', authenticateToken, requireRole('lead'), async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE role = "member"');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all users in a project (lead only)
router.get('/project/:project_id', authenticateToken, requireRole('lead'), async (req, res) => {
  const { project_id } = req.params;
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role FROM users u
      JOIN bugs b ON b.assigned_to = u.id
      WHERE b.project_id = ?
      GROUP BY u.id
    `, [project_id]);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all teammates (member)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, u.role FROM users u
      JOIN bugs b ON b.assigned_to = u.id
      WHERE b.project_id IN (
        SELECT project_id FROM bugs WHERE assigned_to = ?
      )
      AND u.id != ?
    `, [req.user.id, req.user.id]);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// GET /team/members — get all users with role 'member'
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const [members] = await pool.query('SELECT name FROM users WHERE role = "member"');
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// routes/team.js or similar

router.get('/FindMember', async (req, res) => {
  try {
    const projectId = req.query.project;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const query = `
      SELECT assigned_to,status,title
      FROM bugs
      WHERE bugs.project_id = ?
    `;

    const [assignees] = await pool.query(query, [projectId]);
    res.json(assignees);
  } catch (err) {
    console.error('Error fetching assignees:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router; 