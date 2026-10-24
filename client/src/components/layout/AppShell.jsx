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
  Moon
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
    { label: 'My Payslips', to: '/payslips', icon: CircleDollarSign, roles: ['employee'] },
    { label: 'Organization', to: '/org', icon: Building, roles: ['admin', 'hr'] },
    { label: 'Users & Logins', to: '/users', icon: UserCheck, roles: ['admin'] },
    { label: 'Announcements', to: '/announcements', icon: Megaphone, roles: ['admin', 'hr', 'employee'] },
    { label: 'Audit Log', to: '/audit', icon: ShieldAlert, roles: ['admin'] }
  ].filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col md:flex-row">
      {/* Desktop Left Sidebar (240px, navy #1F2A44) */}
      <aside className="hidden md:flex flex-col w-60 bg-[#1F2A44] text-white shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10 gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#12A087] flex items-center justify-center font-bold text-white text-sm">
            H
          </div>
          <span className="font-bold text-lg tracking-tight">HCM Lite</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#12A087] text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-[#12A087]">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#E3E7EE] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1F2A44] hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-sm font-semibold text-[#1F2A44]">Saylani Hackathon</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 text-[#6B7385] hover:text-[#1F2A44] rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* AI Assistant shortcut */}
            <button
              onClick={() => setShowAiChat(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#5B4FCF]/10 text-[#5B4FCF] hover:bg-[#5B4FCF]/20 transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>✦ Ask AI</span>
            </button>

            {/* Notifications icon + dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-[#6B7385] hover:text-[#1F2A44] relative rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#E3E7EE] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#E3E7EE] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F2A44] uppercase tracking-wider">
                      Notifications ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#12A087] font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E3E7EE]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#6B7385]">
                        No notifications right now.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleMarkAsRead(n._id, n.link)}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                            !n.readAt ? 'bg-[#12A087]/5' : ''
                          }`}
                        >
                          <div className="font-semibold text-[#1F2A44]">{n.title}</div>
                          <p className="text-[#6B7385] mt-0.5 text-[11px] leading-relaxed">{n.body}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
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

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1F2A44] text-white p-4 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-[#12A087] text-white' : 'text-gray-300'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* AI Assistant Slide-over Drawer */}
        <AiChatDrawer isOpen={showAiChat} onClose={() => setShowAiChat(false)} />
      </div>
    </div>
  );
}
