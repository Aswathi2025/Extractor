import { NavLink, Outlet } from 'react-router-dom';
import UserMenu from './UserMenu';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'bi-grid-1x2', end: true },
  { to: '/admin/jobs', label: 'Jobs', icon: 'bi-briefcase' },
  { to: '/admin/skills', label: 'Skills', icon: 'bi-tools' },
  { to: '/admin/questions', label: 'Questions', icon: 'bi-patch-question' },
  { to: '/admin/users', label: 'Users', icon: 'bi-people' },
  { to: '/admin/applications', label: 'Applications', icon: 'bi-file-earmark-text' },
];

const AdminLayout = () => {

  return (
    <div className="w-100" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Stylish Sidebar with Glassmorphism */}
      <aside className="glass-panel d-flex flex-column flex-shrink-0" style={{ width: '260px', minWidth: '260px', minHeight: '100vh', zIndex: 10 }}>
        <div className="px-4 py-4 mb-2 d-flex align-items-center gap-3">
          <div className="rounded text-white d-flex align-items-center justify-content-center shadow-soft" style={{width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--blue-600) 0%, var(--blue-500) 100%)'}}>
            <i className="bi bi-lightning-charge-fill"></i>
          </div>
          <span className="fs-4 fw-bold tracking-tight" style={{color: 'var(--blue-900)'}}>Extractor</span>
        </div>
        
        <nav className="nav flex-column px-3 gap-2 flex-grow-1 mt-3">
          <div className="small fw-bold text-uppercase mb-2 px-2" style={{color: 'var(--blue-500)', fontSize: '0.7rem', letterSpacing: '1.5px'}}>Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link px-3 py-2 d-flex align-items-center gap-3 ${isActive ? 'active' : ''}`}
            >
              <i className={`bi ${item.icon} fs-5`}></i>
              <span className="fw-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-top mt-auto" style={{ borderColor: 'var(--border-light)' }}>
          <UserMenu roleLabel="Admin" />
        </div>
      </aside>

      {/* Main area */}
      <div className="d-flex flex-column flex-grow-1" style={{ overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
        <main className="flex-grow-1 overflow-auto p-5 fade-in-up">
          <div className="container-fluid max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
