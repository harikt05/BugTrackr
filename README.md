# BugTrackr - Full-Stack Bug Tracking Application

A comprehensive bug tracking system built for corporate/internal team collaboration with role-based access control.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access (Team Lead vs Team Member)
- Secure password hashing with bcrypt

### Project Management
- Create and manage projects (Team Leads only)
- Project assignment and selection
- Role-based project visibility

### Bug Tracking
- Submit bugs with detailed descriptions
- Tag system (frontend, backend, urgent, etc.)
- Status management (Open, In Progress, Resolved)
- Bug assignment (Team Leads only)
- Advanced filtering by status, assignee, tags

### Team Management
- Team member overview
- Workload tracking
- Member assignment details
- Role-based team views

### UI/UX
- Responsive Bootstrap design
- Modern corporate interface
- Real-time notifications
- Intuitive navigation

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express
- **MySQL** database with mysql2
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **Vanilla JavaScript** (ES6+)
- **Bootstrap 5** for UI
- **Responsive design**
- **Local storage** for session management

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd BugTracker
```

### 2. Backend Setup

```bash
cd server
npm install
```

### 3. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE bugtrackr;
```

2. Run the schema:
```sql
-- Copy and run the contents of server/schema.sql
```

### 4. Environment Configuration

Create `server/.env` file:
```env
# MySQL Database
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=bugtrackr
DB_PORT=3306

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Server Port
PORT=5000
```

### 5. Start the Backend

```bash
cd server
npm start
```

The API will be available at `http://localhost:5000`

### 6. Frontend Setup

Open `client/index.html` in your browser or serve it with a local server:

```bash
cd client
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server -p 8000
```

Access the application at `http://localhost:8000`

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects/all` - Get all projects (Lead only)
- `GET /api/projects/my` - Get user's projects
- `POST /api/projects` - Create project (Lead only)

### Bugs
- `GET /api/bugs` - Get bugs with filters
- `POST /api/bugs` - Submit new bug
- `PATCH /api/bugs/:id/status` - Update bug status
- `PATCH /api/bugs/:id/assign` - Assign bug (Lead only)

### Team
- `GET /api/team/users` - Get all users (Lead only)
- `GET /api/team/project/:id` - Get project team (Lead only)
- `GET /api/team/my` - Get user's teammates

## 👥 User Roles

### Team Lead
- Create and manage projects
- Assign bugs to team members
- View all projects and team members
- Full access to all features

### Team Member
- Submit bugs
- Update assigned bug status
- View assigned projects and bugs
- Limited access based on assignments

## 🎨 UI Features

### Dashboard
- Project selection dropdown
- Bug statistics cards
- Advanced filtering options
- Recent bugs table
- Role-based project creation

### Bug Submission
- Project selection
- Detailed bug description
- Tag selection
- Assignment (Lead only)

### Team View
- Team member cards
- Workload statistics
- Member assignment details
- Role-based visibility

## 🔧 Customization

### Adding New Tags
Edit the tag options in:
- `client/pages/submitBug.html` (line ~30)
- `client/pages/dashboard.html` (line ~60)

### Modifying Status Options
Update the status enum in:
- `server/schema.sql`
- Frontend status filters

### Styling
Customize the appearance by modifying:
- `client/assets/style.css`
- Bootstrap classes in HTML files

## 🚀 Deployment

### Backend (Replit/Heroku)
1. Set environment variables
2. Configure MySQL connection
3. Deploy Node.js app

### Frontend (Vercel/Netlify)
1. Upload `client` folder
2. Configure build settings
3. Set API base URL

### Database
- Use MySQL hosting (PlanetScale, AWS RDS, etc.)
- Update connection settings in `.env`

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- SQL injection prevention
- CORS configuration

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with details

---

**BugTrackr** - Streamline your bug tracking workflow! 🐛✨ 