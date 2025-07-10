const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.get('/stats', async (req, res) => {
  
  try {
    const [totalBugs] = await db.query('SELECT COUNT(*) as count FROM bugs');
    const [openBugs] = await db.query("SELECT COUNT(*) as count FROM bugs WHERE status = 'open'");
    const [resolvedBugs] = await db.query("SELECT COUNT(*) as count FROM bugs WHERE status != 'open'");
    const [members] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'member'");

    const [recentBugs] = await db.query(
      `SELECT title, status, tags, assigned_to
       FROM bugs 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    res.json({
      totalBugs: totalBugs[0].count,
      openBugs: openBugs[0].count,
      resolvedBugs: resolvedBugs[0].count,
      teamMembers: members[0].count,
      recentBugs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
