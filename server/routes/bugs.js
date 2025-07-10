const express = require('express');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Submit a bug (any project member)
router.post('/', authenticateToken, async (req, res) => {
  let { title, description, project_id, tags, assigned_to } = req.body;
  if (!title || !project_id) return res.status(400).json({ message: 'Title and project required.' });

  try {
    if (Array.isArray(tags)) {
      tags = tags.join(',');
    }

    await pool.query(
      'INSERT INTO bugs (title, description, project_id, tags, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, project_id, tags || '', 'open', assigned_to || null]
    );
    

    res.status(201).json({ message: 'Bug submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Get bugs with filters (status, assignee, tag, project)
router.get('/', authenticateToken, async (req, res) => {
  const { status, assigned_to, tag, project_id } = req.query;
  let query = 'SELECT * FROM bugs WHERE 1=1';
  const params = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (assigned_to) { query += ' AND assigned_to = ?'; params.push(assigned_to); }
  if (tag) { query += ' AND FIND_IN_SET(?, tags)'; params.push(tag); }
  if (project_id) { query += ' AND project_id = ?'; params.push(project_id); }
  try {
    const [bugs] = await pool.query(query, params);
    res.json(bugs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update bug status (assignee or lead only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const bugId = req.params.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: 'Status required.' });
  try {
    const [bugs] = await pool.query('SELECT * FROM bugs WHERE id = ?', [bugId]);
    if (bugs.length === 0) return res.status(404).json({ message: 'Bug not found.' });
    const bug = bugs[0];
    // Only assignee or lead can update
    if (req.user.role !== 'lead' && bug.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    await pool.query('UPDATE bugs SET status = ? WHERE id = ?', [status, bugId]);
    res.json({ message: 'Status updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Assign bug (lead only)
router.patch('/:id/assign', authenticateToken, requireRole('lead'), async (req, res) => {
  const bugId = req.params.id;
  const { assigned_to } = req.body;
  if (!assigned_to) return res.status(400).json({ message: 'Assignee required.' });
  try {
    await pool.query('UPDATE bugs SET assigned_to = ? WHERE id = ?', [assigned_to, bugId]);
    res.json({ message: 'Bug assigned.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// Get bugs assigned to current member with lead name
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 1: Get the name of the logged-in user
    const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const assignedName = userRows[0].name;

    // Step 2: Get bugs assigned to that name
    const query = `
      SELECT b.id, b.title, b.description, b.status, b.tags,
             u.name AS lead_name
      FROM bugs b
      JOIN projects p ON b.project_id = p.id
      JOIN users u ON p.lead_id = u.id
      WHERE b.assigned_to = ?
    `;
    const [bugs] = await pool.query(query, [assignedName]);

    res.json(bugs);
  } catch (err) {
    console.error('Error fetching member bugs:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Member marks bug as resolved// PUT /api/bugs/:id/resolve
router.put('/:id/resolve', authenticateToken, async (req, res) => {
  // console.log("🔍 Member marks bug as resolved");
  const bugId = req.params.id;

  try {
    const [result] = await pool.query(
      'UPDATE bugs SET status = ? WHERE id = ?',
      ['resolved', bugId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    res.json({ message: 'Bug marked as resolved' });
  } catch (err) {
    console.error('Error resolving bug:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 