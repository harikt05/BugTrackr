// BugTrackr Frontend App

// Simple router for page navigation
const pages = {
  login: 'pages/login.html',
  register: 'pages/register.html',
  dashboard: 'pages/dashboard.html',
  submitBug: 'pages/submitBug.html',
  team: 'pages/team.html',
  memberDashboard: 'pages/memberDashboard.html'
  
  

  
};

// Global state
let currentUser =JSON.parse(localStorage.getItem('user')) || null;
let currentProject = null;
let projects = [];
let bugs = [];
let teamMembers = [];


function loadPage(page) {
  console.log(`🧭 loadPage called with: ${page}`);
  fetch(pages[page])
    .then(res => res.text())
    .then(html => {
      document.getElementById('mainContent').innerHTML = html;
      // Initialize Lucide icons after content loads
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      
      if (page === 'login') setupLogin();
      if (page === 'register') setupRegister();
      if (page === 'dashboard') setupDashboard();
      if (page === 'submitBug') setupSubmitBug();
      if (page === 'team') setupTeam();
      if (page === 'memberDashboard') setupMemberDashboard();

      
      

    });
}
function setupSidebar(role) {
  let sidebarItems = [];

  if (role === 'lead') {
    sidebarItems = [
      { name: 'Dashboard', icon: 'layout-dashboard', page: 'dashboard' },
      { name: 'Submit Bug', icon: 'plus-circle', page: 'submitBug' },
      { name: 'Team', icon: 'users', page: 'team' },
    ];}
   else if (role === 'member') {
    sidebarItems = [
      { name: 'Dashboard', icon: 'layout-dashboard', page: 'memberDashboard' },
    ];
  }

  let sidebar = `<div class="space-y-1">`;
  sidebarItems.forEach(item => {
    sidebar += `
      <a href="#" onclick="loadPage('${item.page}')" class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors duration-200">
        <i data-lucide="${item.icon}" class="w-5 h-5 mr-3 text-surface-400 group-hover:text-surface-500"></i>
        ${item.name}
      </a>
    `;
  });
  sidebar += `</div>`;

  document.getElementById('sidebar').innerHTML = sidebar;
  document.getElementById('mobileSidebar').innerHTML = sidebar;

  if (typeof lucide !== 'undefined') lucide.createIcons();
}


function showRole(role) {
  const roleElement = document.getElementById('userRole');
  if (roleElement) {
    roleElement.textContent = role ? `${role.charAt(0).toUpperCase() + role.slice(1)}` : '';
  }
}

// Auth state
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    loadPage('login');
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    showRole('');
    return;
  }

  currentUser = user;
  setupSidebar(user.role);
  showRole(user.role);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.classList.remove('hidden');

  if (currentUser.role === "lead") {
    loadPage("dashboard");}
  else if (currentUser.role === "member") {
    loadPage("memberDashboard");
  }
 

}
// Logout functionality
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = function() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      currentUser = null;
      checkAuth();
    };
  }
});

// API helper
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const response = await fetch(`http://localhost:5500/api${endpoint}`, {
    ...defaultOptions,
    ...options
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}

// Login/Register setup
function setupLogin() {
  const form = document.getElementById('loginForm');
  if (form) {
    form.onsubmit = async function (e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('http://localhost:5500/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        

        if (!res.ok || !data.token || !data.user) {
          throw new Error(data.message || 'Login failed');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        const role = data.user.role;
        if (role === 'lead') {
          console.log("🧑‍💻 Role is: ", role);

          loadPage('dashboard');}
        else if (role === 'member') {
          console.log("🧑‍💻 Role is: ", role);
          loadPage('memberDashboard');
        }

      } catch (err) {
        console.error('❌ Login error:', err);
        alert(err.message);
      }
    };
  }
}

function setupRegister() {
  const form = document.getElementById('registerForm');
  if (form) {
    form.onsubmit = async function (e) {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
      try {
        const res = await fetch('http://localhost:5500/api/auth/register'
        , {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) throw new Error(data.message || 'Registration failed');
        alert('Registration successful! Please log in.');
        loadPage('login');
      } catch (err) {
        alert(err.message);
      }
    };
  }
}

// Dashboard setup
async function setupDashboard() {
  if (!protectPage()) return;
    await loadProjects();
    setupProjectSelect();
    setupFilters();
    setupCreateProject();
    addLogoutButton();
    loadDashboardData();
  
}



async function loadProjects() {
  try {
    const endpoint = currentUser.role === 'lead' ? '/projects/all' : '/projects/my';
    const projects = await apiCall(endpoint);

    const select = document.getElementById('project');
    select.innerHTML = '<option value="">Select Project</option>';
    projects.forEach(project => {
      const opt = document.createElement('option');
      opt.value = project.id;
      opt.textContent = project.title;
      select.appendChild(opt);
    });
  } catch (err) {
    showNotification('Error loading projects', 'error');
  }
}


function setupProjectSelect() {
  const select = document.getElementById('projectSelect');
  if (!select) return;
  
  select.onchange = function() {
    currentProject = projects.find(p => p.id == this.value);
    if (currentProject) {
      loadBugs();
      updateStats();
    }
  };
}

function setupFilters() {
  const statusFilter = document.getElementById('statusFilter');
  const assigneeFilter = document.getElementById('assigneeFilter');
  const tagFilter = document.getElementById('tagFilter');
  
  if (statusFilter) statusFilter.onchange = loadBugs;
  if (assigneeFilter) assigneeFilter.onchange = loadBugs;
  if (tagFilter) tagFilter.onchange = loadBugs;
}

function setupCreateProject() {
  const btn = document.getElementById('createProjectBtn');
  if (btn && currentUser.role === 'lead') {
    btn.classList.remove('hidden');
    btn.onclick = () => {
      if (typeof window.showCreateProjectModal === 'function') {
        window.showCreateProjectModal();
      }
    };
  }
}

async function createProject() {
  const title = document.getElementById('projectTitle').value;
  const description = document.getElementById('projectDescription').value;
  
  if (!title) {
    showNotification('Project title is required', 'error');
    return;
  }
  
  try {
    await apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify({ title, description })
    });
    
    showNotification('Project created successfully!', 'success');
    if (typeof window.closeCreateProjectModal === 'function') {
      window.closeCreateProjectModal();
    }
    await loadProjects();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

async function loadBugs() {
  if (!currentProject) return;
  
  try {
    const statusFilter = document.getElementById('statusFilter')?.value;
    const assigneeFilter = document.getElementById('assigneeFilter')?.value;
    const tagFilter = document.getElementById('tagFilter')?.value;
    
    let endpoint = `/bugs/project/${currentProject.id}`;
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (assigneeFilter) params.append('assignee', assigneeFilter);
    if (tagFilter) params.append('tag', tagFilter);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    bugs = await apiCall(endpoint);
    renderBugsTable();
    updateStats();
  } catch (err) {
    showNotification('Failed to load bugs', 'error');
  }
}

function renderBugsTable() {
  const tbody = document.getElementById('bugsTableBody');
  if (!tbody) return;
  
  if (!bugs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center text-surface-500">
          <div class="flex flex-col items-center">
            <i data-lucide="inbox" class="w-12 h-12 text-surface-300 mb-4"></i>
            <p class="text-lg font-medium text-surface-900 mb-2">No bugs found</p>
            <p class="text-surface-600">No bugs match your current filters</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = bugs.map(bug => `
    <tr class="hover:bg-surface-50 transition-colors duration-200">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-surface-900">${bug.title}</div>
        <div class="text-sm text-surface-500">${bug.description.substring(0, 50)}${bug.description.length > 50 ? '...' : ''}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bug.status)}">
          ${bug.status}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
        ${bug.assignee || 'Unassigned'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${renderTags(bug.tags)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
        ${new Date(bug.created_at).toLocaleDateString()}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        ${canUpdateBug(bug) ? `
          <select onchange="updateBugStatus(${bug.id}, this.value)" class="text-sm border border-surface-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="open" ${bug.status === 'open' ? 'selected' : ''}>Open</option>
            <option value="in progress" ${bug.status === 'in progress' ? 'selected' : ''}>In Progress</option>
            <option value="resolved" ${bug.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          </select>
        ` : ''}
      </td>
    </tr>
  `).join('');
  
  // Reinitialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800';
    case 'in progress': return 'bg-yellow-100 text-yellow-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    default: return 'bg-surface-100 text-surface-800';
  }
}

function renderTags(tags) {
  if (!tags || !tags.length) return '-';
  const tagList = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
  return tagList.map(tag =>
    `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mr-1">${tag}</span>`
  ).join('');
}


function canUpdateBug(bug) {
  return currentUser.role === 'lead' || bug.assignee === currentUser.name;
}

async function updateBugStatus(bugId, status) {
  try {
    await apiCall(`/bugs/${bugId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    showNotification('Bug status updated successfully!', 'success');
    loadBugs();
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

function updateStats() {
  const openBugs = bugs.filter(b => b.status === 'open').length;
  const inProgressBugs = bugs.filter(b => b.status === 'in progress').length;
  const resolvedBugs = bugs.filter(b => b.status === 'resolved').length;
  const totalBugs = bugs.length;
  
  document.getElementById('openBugs').textContent = openBugs;
  document.getElementById('inProgressBugs').textContent = inProgressBugs;
  document.getElementById('resolvedBugs').textContent = resolvedBugs;
  document.getElementById('totalBugs').textContent = totalBugs;
}

// Submit Bug setup
async function setupSubmitBug() {
  if (!protectPage()) return;
  await loadProjects();
  await loadAssignees();
  setupBugForm();
  setupProjectCreateForm(); 
  addLogoutButton();
}
async function loadAssignees() {
  try {
    const res = await apiCall('/team/members'); // Returns [{ name: "Alice" }, { name: "Bob" }, ...]
    const select = document.getElementById('assignee');
    select.innerHTML = '<option value="">Select Assignee</option>';

    res.forEach(member => {
      const opt = document.createElement('option');
      opt.value = member.name;          // Value is the name string
      opt.textContent = member.name;    // Visible label
      select.appendChild(opt);
    });
  } catch (err) {
    showNotification('Failed to load team members', 'error');
  }
}



function setupBugForm() {
  const form = document.getElementById('bugForm');
  if (!form) return;

  form.onsubmit = async function (e) {
    e.preventDefault();

    const title = document.getElementById('bugTitle').value;
    const projectId = document.getElementById('project').value;
    const assignee = document.getElementById('assignee').value;
    const description = document.getElementById('description').value;
    const rawTags = document.getElementById('tags').value;
const tags = rawTags.split(',').map(tag => tag.trim()).filter(Boolean);


    if (!title || !projectId || !description || !tags) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      const res = await apiCall('/bugs', {
        method: 'POST',
        body: JSON.stringify({
          title,
          project_id: projectId,
          assigned_to: assignee || null,  // ✅ spelling fixed
          description,
         
          tags// ✅ will be stored as empty string in backend
        })
      });

      showNotification('Bug submitted successfully!', 'success');

      const successDiv = document.getElementById('submitSuccess');
      const successText = document.getElementById('submitSuccessText');
      if (successDiv && successText) {
        successText.textContent = 'Bug submitted successfully!';
        successDiv.classList.remove('hidden');
      }

      form.reset();

      setTimeout(() => {
        if (successDiv) successDiv.classList.add('hidden');
      }, 3000);

    } catch (err) {
      console.error('❌ Submit Error:', err); // ✅ log error for debugging
      const errorDiv = document.getElementById('submitError');
      const errorText = document.getElementById('submitErrorText');
      if (errorDiv && errorText) {
        errorText.textContent = err.message;
        errorDiv.classList.remove('hidden');
      }
    }
  };
}

// Team setup
async function setupTeam() {
  if (!protectPage()) return;
  
  await loadAllProjectsForTeam();    // Show project list
  await loadTeamBugs();   
  addLogoutButton();
}

function setupTeamProjectSelect() {
  const select = document.getElementById('teamProjectSelect');
  if (!select) return;
  
 
}
function renderTeamMembers() {
  const container = document.getElementById('teamMembers');
  if (!container) return;
  
  if (!teamMembers.length) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="flex flex-col items-center">
          <i data-lucide="users" class="w-16 h-16 text-surface-300 mb-4"></i>
          <p class="text-lg font-medium text-surface-900 mb-2">No team members</p>
          <p class="text-surface-600">No team members found for this project</p>
        </div>  
      </div>
    `;
    return;
  }
  
  container.innerHTML = teamMembers.map(member => `
    <div class="bg-surface-50 rounded-xl p-6 hover:shadow-md transition-all duration-200">
      <div class="flex items-center">
        <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <i data-lucide="user" class="w-6 h-6 text-primary-600"></i>
        </div>
        <div class="ml-4 flex-1">
          <h4 class="text-lg font-medium text-surface-900">${member.name}</h4>
          <p class="text-sm text-surface-600">${member.email}</p>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-2">
            ${member.role}
          </span>
        </div>
      </div>
    </div>
  `).join('');
  
  // Reinitialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

async function loadTeamWorkload() {
  try {
    const projectId = document.getElementById('teamProjectSelect').value;
    const endpoint = projectId ? `/bugs/project/${projectId}` : '/bugs';

    const bugs = await apiCall(endpoint);
    renderTeamBugTable(bugs);
  } catch (err) {
    showNotification('Failed to load bugs', 'error');
  }
}


function renderWorkloadTable(projectBugs) {
  const tbody = document.getElementById('workloadTable');
  if (!tbody) return;
  
  if (!teamMembers.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-surface-500">
          <div class="flex flex-col items-center">
            <i data-lucide="bar-chart-3" class="w-12 h-12 text-surface-300 mb-4"></i>
            <p class="text-lg font-medium text-surface-900 mb-2">No workload data</p>
            <p class="text-surface-600">No team members found for this project</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = teamMembers.map(member => {
    const memberBugs = projectBugs.filter(bug => bug.assignee === member.name);
    const openBugs = memberBugs.filter(bug => bug.status === 'open').length;
    const inProgressBugs = memberBugs.filter(bug => bug.status === 'in progress').length;
    const resolvedBugs = memberBugs.filter(bug => bug.status === 'resolved').length;
    const totalBugs = memberBugs.length;
    
    return `
      <tr class="hover:bg-surface-50 transition-colors duration-200">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <i data-lucide="user" class="w-4 h-4 text-primary-600"></i>
            </div>
            <div class="ml-3">
              <div class="text-sm font-medium text-surface-900">${member.name}</div>
              <div class="text-sm text-surface-500">${member.email}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            ${member.role}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">${openBugs}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">${inProgressBugs}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-surface-900">${resolvedBugs}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-surface-900">${totalBugs}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="viewMemberDetails(${member.id})" class="text-primary-600 hover:text-primary-900 transition-colors duration-200">
            View Details
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  // Reinitialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function updateTeamStats() {
  document.getElementById('totalMembers').textContent = teamMembers.length;
  // You can add more stats calculations here
}

function populateProjectSelects() {
  const selects = ['projectSelect', 'bugProject', 'teamProjectSelect'];
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '<option value="">Select a project...</option>' +
        projects.map(project => `<option value="${project.id}">${project.title}</option>`).join('');
    }
  });
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
  
  let bgColor, textColor, icon;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-50';
      textColor = 'text-green-800';
      icon = 'check-circle';
      break;
    case 'error':
      bgColor = 'bg-red-50';
      textColor = 'text-red-800';
      icon = 'alert-circle';
      break;
    default:
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-800';
      icon = 'info';
  }
  
  notification.className += ` ${bgColor} border ${type === 'success' ? 'border-green-200' : type === 'error' ? 'border-red-200' : 'border-blue-200'}`;
  
  notification.innerHTML = `
    <div class="flex">
      <i data-lucide="${icon}" class="h-5 w-5 ${textColor} mr-2"></i>
      <p class="text-sm ${textColor}">${message}</p>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
  
  // Initialize icon
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

async function viewMemberDetails(memberId) {
  try {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    // Update modal content
    document.getElementById('memberName').textContent = member.name;
    document.getElementById('memberEmail').textContent = member.email;
    document.getElementById('memberRole').textContent = member.role;
    
    // Load member's bugs
    const memberBugs = await apiCall(`/bugs/assignee/${member.name}`);
    const bugsContainer = document.getElementById('memberBugs');
    
    if (memberBugs.length === 0) {
      bugsContainer.innerHTML = `
        <div class="text-center py-4">
          <i data-lucide="inbox" class="w-8 h-8 text-surface-300 mx-auto mb-2"></i>
          <p class="text-sm text-surface-500">No current assignments</p>
        </div>
      `;
    } else {
      bugsContainer.innerHTML = memberBugs.map(bug => `
        <div class="border border-surface-200 rounded-lg p-3">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="text-sm font-medium text-surface-900">${bug.title}</p>
              <p class="text-xs text-surface-500">${bug.description.substring(0, 60)}${bug.description.length > 60 ? '...' : ''}</p>
            </div>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bug.status)} ml-2">
              ${bug.status}
            </span>
          </div>
        </div>
      `).join('');
    }
    
    // Show modal
    if (typeof window.showMemberModal === 'function') {
      window.showMemberModal();
    }
    
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (err) {
    showNotification('Failed to load member details', 'error');
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
});

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function showDashboardIfAuthenticated() {
  if (isAuthenticated()) {
    const user = JSON.parse(localStorage.getItem('user'));
    loadPage('dashboard'); // ✅ Load same dashboard for both roles

  } else {
    loadPage('login');
  }
}


document.addEventListener('DOMContentLoaded', showDashboardIfAuthenticated);

// --- Page Protection ---
function protectPage() {
  if (!isAuthenticated()) {
    loadPage('login');
    return false;
  }
  return true;
}

// --- Logout ---
function addLogoutButton() {
  // Add logout button to sidebar if not present
  let sidebar = document.querySelector('.sidebar-menu');
  if (sidebar && !document.getElementById('logoutBtn')) {
    let li = document.createElement('li');
    li.className = 'nav-item';
    li.innerHTML = `<a class="nav-link" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
    sidebar.appendChild(li);
    document.getElementById('logoutBtn').onclick = function() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      loadPage('login');
    };
  }
} 
async function loadDashboardData() {
  try {
    console.log('📡 Fetching dashboard stats...');
    const res = await fetch('http://localhost:5500/api/dashboard/stats');

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log('📦 Dashboard stats received:', data);

    document.getElementById('totalBugs').textContent = data.totalBugs || 0;
    document.getElementById('openBugs').textContent = data.openBugs || 0;
    document.getElementById('resolvedBugs').textContent = data.resolvedBugs || 0;
    document.getElementById('teamMembers').textContent = data.teamMembers || 0;

    const tbody = document.getElementById('recentBugsTableBody');
    tbody.innerHTML = '';

    data.recentBugs.forEach(bug => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${bug.title}</td>
        <td><span class="badge ${bug.status === 'open' ? 'bg-warning text-dark' :
                                bug.status === 'resolved' ? 'bg-success' :
                                'bg-secondary'}">${bug.status}</span></td>
        <td>${renderTags(bug.tags)}</td>

        <td>${bug.assigned_to|| 'N/A'}</td>
      
        
      `;
      tbody.appendChild(row);
    });

  } catch (err) {
    console.error('❌ Dashboard loading error:', err);
    const tbody = document.getElementById('recentBugsTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6">Failed to load dashboard data.</td></tr>`;
    }
  }
}
async function loadAllProjectsForTeam() {
  const res = await apiCall('/projects/all');
  const select = document.getElementById('teamProjectSelect');
  select.innerHTML = '<option value="">All Projects</option>';

  projects = res;
  projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.title;
    select.appendChild(opt);
  });

  select.onchange = loadTeamBugs;
}
async function loadTeamBugs() {
  const projectId = document.getElementById('teamProjectSelect').value;
  const tbody = document.getElementById('workloadTable');

  if (!projectId) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center">Please select a project</td></tr>`;
    return;
  }

  try {
    const assignees = await apiCall(`/team/FindMember?project=${projectId}`);
    
    if (!assignees.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-center">No members assigned to this project.</td></tr>`;
      return;
    }

    tbody.innerHTML = assignees.map(user => `
      <tr>
        <td>${user.assigned_to}</td>
        <td>${user.title}</td>
        <td>${user.status}</td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error loading team members:', error);
    tbody.innerHTML = `<tr><td colspan="3" class="text-danger text-center">Failed to load members</td></tr>`;
  }
}

function setupProjectCreateForm() {
  const form = document.getElementById('createProjectForm');
  const card = document.getElementById('createProjectCard');

  // Show form only to leads
  if (currentUser?.role === 'lead') {
    card.style.display = 'block';
  }

  if (form) {
    form.onsubmit = async function (e) {
      e.preventDefault();

      const title = document.getElementById('projectTitle').value.trim();
      const description = document.getElementById('projectDescription').value.trim();

      if (!title) {
        showNotification('Project title is required', 'error');
        return;
      }

      try {
        await apiCall('/projects', {
          method: 'POST',
          body: JSON.stringify({
            title,
            description,
            lead_id: currentUser.id  // Automatically associate lead
          })
        });

        showNotification('✅ Project created successfully!', 'success');
        form.reset();
        await loadProjects(); // Refresh dropdown with new project
      } catch (err) {
        showNotification(err.message, 'error');
      }
    };
  }
}
async function setupMemberDashboard() {
  addLogoutButton();

  try {
    const bugs = await apiCall('/bugs/my');

    const total = bugs.length;
    const open = bugs.filter(b => b.status === 'open').length;
    const resolved = bugs.filter(b => b.status === 'resolved').length;

    document.getElementById('MembertotalBugs').textContent = total;
    document.getElementById('MemberopenBugs').textContent = open;
    document.getElementById('MemberresolvedBugs').textContent = resolved;

    const tableBody = document.getElementById('memberBugsTableBody');
    tableBody.innerHTML = '';

    const priorityOrder = { high: 1, medium: 2, low: 3 };
bugs.sort((a, b) => {
  const priorityDiff = (priorityOrder[a.tags] || 4) - (priorityOrder[b.tags] || 4);
  if (priorityDiff === 0) {
    // If same priority, sort by most recent (higher ID first)
    return b.id - a.id;
  }
  return priorityDiff;
});


    bugs.forEach(bug => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-6 py-4">${bug.title}</td>
        <td class="px-6 py-4">${bug.description}</td>
        <td class="px-6 py-4">${bug.lead_name || 'N/A'}</td>
        <td class="px-6 py-4">${bug.tags}</td>
        <td class="px-6 py-4">
          ${bug.status !== 'resolved' ? `
            <button class="px-3 py-1 text-sm bg-success text-white rounded resolve-btn" data-id="${bug.id}">
              Mark Resolved
            </button>
          ` : '<span class="text-success fw-bold">✔</span>'}
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // ✅ Fix: This was broken before
    document.querySelectorAll('.resolve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bugId = btn.getAttribute('data-id');
        try {
          await apiCall(`/bugs/${bugId}/resolve`, { method: 'PUT' });
          showNotification('Bug marked as resolved ✅', 'success');
          loadPage('memberDashboard');
        } catch (err) {
          showNotification('Failed to resolve bug ❌', 'error');
        }
      });
    });

  } catch (err) {
    showNotification(err.message, 'error');
  }
}
