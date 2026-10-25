import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiRequest } from '../../lib/api.js';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  Building,
  UserCheck,
  Megaphone,
  ShieldAlert,
  Bot,
  LogOut,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  BookOpen
} from 'lucide-react';
import { AiChatDrawer } from '../../features/ai/AiChatDrawer.jsx';

export function AppShell() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hcm_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hcm_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest('/notifications');
      setNotifications(res?.items || []);
      setUnreadCount(res?.unreadCount || 0);
    } catch (err) {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, link) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'POST' });
      fetchNotifications();
      if (link) {
        setShowNotifications(false);
        navigate(link);
      }
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      fetchNotifications();
    } catch (err) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || 'employee';

  const navLinks = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard, roles: ['admin', 'hr', 'employee'] },
    { label: 'Employees', to: '/employees', icon: Users, roles: ['admin', 'hr'] },
    { label: 'Attendance', to: '/attendance', icon: CalendarCheck, roles: ['admin', 'hr', 'employee'] },
    { label: 'Leave', to: '/leave', icon: CalendarDays, roles: ['admin', 'hr', 'employee'] },
    { label: 'Payroll', to: '/payroll', icon: CircleDollarSign, roles: ['admin', 'hr'] },
    { label: 'My payslips', to: '/payslips', icon: CircleDollarSign, roles: ['employee'] },
    { label: 'Organization', to: '/org', icon: Building, roles: ['admin', 'hr'] },
    { label: 'Users and logins', to: '/users', icon: UserCheck, roles: ['admin'] },
    { label: 'Announcements', to: '/announcements', icon: Megaphone, roles: ['admin', 'hr', 'employee'] },
    { label: 'Audit log', to: '/audit', icon: ShieldAlert, roles: ['admin'] },
  ].filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col md:flex-row transition-colors">
      {/* Desktop Left Sidebar (232px, white surface, 1px right border) */}
      <aside className="hidden md:flex flex-col w-[232px] bg-[var(--surface)] border-r border-[var(--border)] shrink-0 transition-colors">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--border)] gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[var(--primary)] flex items-center justify-center font-bold text-white text-xs select-none">
            ▣
          </div>
          <span className="font-semibold text-base text-[var(--text)] tracking-tight">HCM Lite</span>
        </div>

        {/* Navigation by role */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] font-normal'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 stroke-[1.75]" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3.5 border-t border-[var(--border)] flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-medium text-[var(--text)] truncate">{user?.email}</p>
            <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full text-[11px] font-medium bg-[var(--bg)] text-[var(--text-muted)] capitalize">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] p-1.5 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar (64px, white surface, 1px bottom border) */}
        <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="md:hidden p-2 text-[var(--text)] hover:bg-[var(--bg)] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 stroke-[1.75]" /> : <Menu className="w-5 h-5 stroke-[1.75]" />}
            </button>
            <span className="text-sm font-medium text-[var(--text)]">HCM Lite</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-full hover:bg-[var(--bg)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 stroke-[1.75]" /> : <Moon className="w-4 h-4 text-[var(--text-muted)] stroke-[1.75]" />}
            </button>

            {/* AI Assistant shortcut */}
            <button
              onClick={() => setShowAiChat(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--ai)] text-[var(--ai)] hover:bg-[var(--ai-soft)] transition-colors cursor-pointer"
            >
              <span>✦ Ask AI</span>
            </button>

            {/* Notifications icon + dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] relative rounded-full hover:bg-[var(--bg)] transition-colors"
              >
                <Bell className="w-4 h-4 stroke-[1.75]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--danger)]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--surface)] rounded-xl dropdown-shadow border border-[var(--border)] py-2 z-50 transition-colors">
                  <div className="px-4 py-2 border-b border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text)]">
                      Notifications ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[var(--primary)] font-medium hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                        You&apos;re all caught up.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleMarkAsRead(n._id, n.link)}
                          className={`p-3 text-xs cursor-pointer hover:bg-[var(--bg)] transition-colors ${
                            !n.readAt ? 'bg-[var(--primary-soft)]/50' : ''
                          }`}
                        >
                          <div className="font-medium text-[var(--text)]">{n.title}</div>
                          <p className="text-[var(--text-muted)] mt-0.5 text-[11px] leading-relaxed">{n.body}</p>
                          <span className="text-[10px] text-[var(--text-muted)] mt-1 block tabular-nums">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed w-full z-10 bg-[var(--surface)] border-b border-[var(--border)] p-4 space-y-1 transition-colors">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      isActive ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium' : 'text-[var(--text-muted)] hover:bg-[var(--bg)] font-normal'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--danger)] font-medium"
            >
              <LogOut className="w-5 h-5 stroke-[1.75]" />
              <span>Log out</span>
            </button>
          </div>
        )}

        {/* Page Content Outlet (Centered, max-width 1200 px) */}
        <main
          className="flex-1 p-6 md:p-8 max-w-[1200px] w-full mx-auto"
            >
              <Outlet
              onclick = {() => setMobileMenuOpen(false)}
             />
        </main>

        {/* AI Assistant Slide-over Drawer */}
        <AiChatDrawer isOpen={showAiChat} onClose={() => setShowAiChat(false)} />
      </div>
    </div>
  );
}
