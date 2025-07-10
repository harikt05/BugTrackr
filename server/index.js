const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const bugsRouter = require('./routes/bugs');
const teamRouter = require('./routes/team');
const path = require('path');
const dashboardRoutes = require('./routes/dashboard');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);


const PORT = process.env.PORT || 5500;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BugTrackr API running' });
});

app.use(express.static(path.join(__dirname, '..', 'client')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'pages', 'dashboard.html'));

});

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/bugs', bugsRouter);
app.use('/api/team', teamRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
