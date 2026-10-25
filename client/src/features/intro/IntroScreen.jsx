import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ShieldCheck,
  Users,
  UserCheck,
  Sparkles,
  Bot,
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  Building,
  Megaphone,
  FileText,
  ArrowRight,
  Lock,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  Info,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ExternalLink,
  BookOpen,
  LogIn,
  Key
} from 'lucide-react';

export function IntroScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hcm_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hcm_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const copyToClipboard = (text, fieldKey) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQuickLogin = (email, password) => {
    navigate('/login', { state: { email, password } });
  };

  const accounts = [
    {
      role: 'Admin',
      roleBadge: 'System Administrator',
      badgeColor: 'bg-red-500/10 text-red-500 border-red-500/20',
      accentColor: 'border-l-4 border-l-red-500',
      email: 'wahajwahaj200@gmail.com',
      password: '12345678',
      avatarBg: 'bg-red-500 text-white',
      avatarText: 'AD',
      tagline: 'Full System Control & Company Setup',
      responsibilities: [
        'Organization Setup: Configure departments, designations, shifts & holidays',
        'User Management: Provision HR accounts, deactivate users, reset passwords',
        'Executive Analytics: View company-wide KPIs, turnover & attendance rates',
        'Audit & Compliance: Access immutable audit logs with actor timestamps and actions',
        'Announcements: Broadcast company-wide notices and organizational updates'
      ],
      quickLinks: [
        { name: 'Organization Setup', path: '/org' },
        { name: 'Users & HR Logins', path: '/users' },
        { name: 'Audit Trail', path: '/audit' },
        { name: 'Admin Dashboard', path: '/' }
      ]
    },
    {
      role: 'HR Manager',
      roleBadge: 'Human Resources',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      accentColor: 'border-l-4 border-l-amber-500',
      email: 'sarah@gmail.com',
      password: '12345678',
      avatarBg: 'bg-amber-500 text-white',
      avatarText: 'HR',
      tagline: 'Employee Lifecycle & Daily Operations',
      responsibilities: [
        'Employee Onboarding: Register new employees (auto-generates EMP-xxxx codes)',
        'Attendance Board: Monitor company-wide daily attendance and handle manual corrections',
        'Leave Approvals: Review, approve, or reject employee leave requests with remarks',
        'Payroll Lite: Generate monthly payroll draft, calculate deductions, review gross & net pay',
        'Company Announcements: Post operational notices for all staff'
      ],
      quickLinks: [
        { name: 'Employee Directory', path: '/employees' },
        { name: 'Attendance Board', path: '/attendance' },
        { name: 'Leave Inbox', path: '/leave' },
        { name: 'Payroll Lite', path: '/payroll' }
      ]
    },
    {
      role: 'Employee',
      roleBadge: 'Staff Member',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      accentColor: 'border-l-4 border-l-emerald-500',
      email: 'john@gmail.com',
      password: '12345678',
      avatarBg: 'bg-emerald-500 text-white',
      avatarText: 'EM',
      tagline: 'Self-Service Portal & AI Assistant',
      responsibilities: [
        'One-Click Attendance: Punch in & out with shift status tracking (On Time, Late, Half Day)',
        'Leave Management: Submit leave applications (Sick, Casual, Annual) with real-time balance checks',
        'Payslip Access: View and download generated monthly payslips as PDF documents',
        'Employee 360: View personal employment record, designation, and work profile',
        'AI Assistant: Ask natural language questions about your leave balance, policies, and attendance'
      ],
      quickLinks: [
        { name: 'Employee Dashboard', path: '/' },
        { name: 'My Attendance', path: '/attendance' },
        { name: 'Apply For Leave', path: '/leave' },
        { name: 'My Payslips', path: '/payslips' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/85 backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-bold text-lg select-none shadow-sm">
            ▣
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[var(--text)]">HCM Lite</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
                Evaluation Portal
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] hidden sm:block">Application Guide & Demonstration Logins</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)] text-[var(--text-muted)] transition-colors cursor-pointer"
            title="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {user ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-hover)] transition-all shadow-sm"
            >
              <span>Back to App ({user.role})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-hover)] transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Go to Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--surface)] to-[var(--bg)] border border-[var(--border)] p-6 sm:p-10 shadow-sm">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[var(--primary-soft)] blur-3xl opacity-60 pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 -mb-16 w-56 h-56 rounded-full bg-[var(--ai-soft)] blur-3xl opacity-50 pointer-events-none" />

          <div className="relative max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-semibold border border-[var(--primary)]/25">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Saylani Hackathon Project Evaluation</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] leading-tight">
              Welcome, Teacher & Evaluator!
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
              This guide is created specifically to help you inspect, test, and evaluate every layer of <strong className="text-[var(--text)]">HCM Lite</strong>. Below you will find ready-to-use login credentials for all three core roles (<strong className="text-[var(--text)]">Admin</strong>, <strong className="text-[var(--text)]">HR Manager</strong>, and <strong className="text-[var(--text)]">Employee</strong>), along with step-by-step testing instructions for each feature.
            </p>

            {/* Quick feature pill row */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-medium inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 3 RBAC Roles
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-medium inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Full Attendance & Leave
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-medium inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Payroll Lite & PDF Payslips
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-medium inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--ai)]" /> AI Assistant (Gemini LLM)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-medium inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Security & Audit Trails
              </span>
            </div>
          </div>
        </div>

        {/* Credentials Cards Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
                <Key className="w-5 h-5 text-[var(--primary)]" />
                <span>Demo Accounts & Credentials</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Click "Quick Sign In" on any role to immediately open the login screen with credentials ready, or use the 1-click copy buttons.
              </p>
            </div>

            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-1.5 bg-[var(--surface)] cursor-pointer self-start sm:self-auto transition-colors"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'Hide passwords' : 'Show passwords'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {accounts.map((acc) => (
              <div
                key={acc.role}
                className={`rounded-xl bg-[var(--surface)] border border-[var(--border)] ${acc.accentColor} p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
              >
                <div>
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${acc.avatarBg} flex items-center justify-center font-bold text-sm shadow-sm`}>
                        {acc.avatarText}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[var(--text)]">{acc.role}</h3>
                        <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${acc.badgeColor}`}>
                          {acc.roleBadge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mt-2.5 line-clamp-1">{acc.tagline}</p>

                  {/* Credentials Box */}
                  <div className="mt-4 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2.5">
                    {/* Email row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                        <span className="font-mono text-[11px] text-[var(--text)] truncate" title={acc.email}>
                          {acc.email}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(acc.email, `${acc.role}-email`)}
                        className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0 cursor-pointer"
                        title="Copy Email"
                      >
                        {copiedField === `${acc.role}-email` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Password row */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)]/60">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                        <span className="font-mono text-[11px] text-[var(--text)] font-semibold">
                          {showPasswords ? acc.password : '••••••••'}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(acc.password, `${acc.role}-pass`)}
                        className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0 cursor-pointer"
                        title="Copy Password"
                      >
                        {copiedField === `${acc.role}-pass` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Key Capabilities */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      Key Capabilities:
                    </span>
                    <ul className="text-xs space-y-1 text-[var(--text)]">
                      {acc.responsibilities.slice(0, 3).map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[var(--primary)] font-bold">›</span>
                          <span className="leading-snug">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA */}
                <button
                  onClick={() => handleQuickLogin(acc.email, acc.password)}
                  className="w-full py-2.5 px-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--primary)] text-[var(--text)] hover:text-white border border-[var(--border)] hover:border-[var(--primary)] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  <span>Sign in as {acc.role}</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Step-by-Step Walkthrough Tabs */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--primary)]" />
              <span>How to Use & Test the Application (Role by Role)</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Follow this step-by-step checklist to evaluate each functional module as per hackathon rubrics.
            </p>
          </div>

          {/* Role Navigation Tabs */}
          <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('admin')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>1. Admin Inspection Flow</span>
            </button>
            <button
              onClick={() => setActiveTab('hr')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'hr'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>2. HR Operations Flow</span>
            </button>
            <button
              onClick={() => setActiveTab('employee')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'employee'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>3. Employee Self-Service</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'ai'
                  ? 'border-[var(--ai)] text-[var(--ai)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>4. AI Assistant Prompts</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
            {activeTab === 'admin' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)]">Admin Evaluation Checklist</h3>
                    <p className="text-xs text-[var(--text-muted)]">Signed in as: wahajwahaj200@gmail.com</p>
                  </div>
                  <button
                    onClick={() => handleQuickLogin('wahajwahaj200@gmail.com', '12345678')}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Sign in as Admin now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <Building className="w-4 h-4 text-[var(--primary)]" />
                      <span>Step 1: Check Organization Setup (/org)</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Verify company configuration including working days, business hours (09:00 - 18:00), 15-minute grace period, departments (Engineering, HR, Sales), designations, and leave quotas.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <UserCheck className="w-4 h-4 text-[var(--primary)]" />
                      <span>Step 2: Users & Logins Management (/users)</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Only Admins have access to this screen. You can create a new HR login, deactivate active accounts, or trigger a secure password reset.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                      <span>Step 3: Real-Time Audit Log (/audit)</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Every sensitive system action (logins, password resets, employee creations, payroll finalization) creates an immutable record with actor, action, timestamp, and IP.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <Megaphone className="w-4 h-4 text-[var(--primary)]" />
                      <span>Step 4: Announcements & Analytics</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Broadcast system-wide notices in `/announcements` and review live headcounts, active leave counts, and attendance graphs on the main dashboard (`/`).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hr' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)]">HR Manager Operations Flow</h3>
                    <p className="text-xs text-[var(--text-muted)]">Signed in as: sarah@gmail.com</p>
                  </div>
                  <button
                    onClick={() => handleQuickLogin('sarah@gmail.com', '12345678')}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Sign in as HR now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <Users className="w-4 h-4 text-amber-500" />
                      <span>Step 1: Employee Management (/employees)</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Add a new employee using the "+ Add Employee" button. The system automatically assigns sequential code (e.g., EMP-0004), establishes salary structure, and creates their user credentials.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <CalendarCheck className="w-4 h-4 text-amber-500" />
                      <span>Step 2: Attendance Board (/attendance)</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      View company-wide check-ins for today. Filter by department or status (Present, Late, Half Day). HR can also record manual attendance corrections.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <CalendarDays className="w-4 h-4 text-amber-500" />
                      <span>Step 3: Leave Approvals (/leave)</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Review pending leave applications submitted by staff. One click to Approve or Reject with optional review remarks. Balances are automatically updated.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <CircleDollarSign className="w-4 h-4 text-amber-500" />
                      <span>Step 4: Payroll Lite Processing (/payroll)</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Generate monthly payroll draft. The engine automatically factors in unpaid leave deductions, computes gross and net payable amounts, and prepares payslips.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'employee' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)]">Employee Self-Service Flow</h3>
                    <p className="text-xs text-[var(--text-muted)]">Signed in as: john@gmail.com</p>
                  </div>
                  <button
                    onClick={() => handleQuickLogin('john@gmail.com', '12345678')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Sign in as Employee now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <CalendarCheck className="w-4 h-4 text-emerald-500" />
                      <span>Step 1: Check In / Check Out</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      On the dashboard (`/`), test the Attendance Action Card. Hit "Check In" to record your arrival time. The system will calculate if you arrived on time or late based on company grace periods.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <CalendarDays className="w-4 h-4 text-emerald-500" />
                      <span>Step 2: Submit a Leave Request (/leave)</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Select leave type (Annual, Casual, Sick), choose date range, and view your real-time available quota before submission. After submitting, check how it appears in HR's inbox!
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <CircleDollarSign className="w-4 h-4 text-emerald-500" />
                      <span>Step 3: Payslips & Salary Breakdown (/payslips)</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Employees can view all finalized payslips, inspect itemized earnings & deductions, and download clean printable PDF payslips directly.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text)]">
                      <Bot className="w-4 h-4 text-[var(--ai)]" />
                      <span>Step 4: Ask the AI Assistant</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Open the floating AI Assistant in the bottom right corner. Ask questions in natural English or Urdu about your leave balances, company policies, or attendance records.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--ai)]" />
                    <span>Testing the AI Assistant (Gemini LLM Integration)</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    The AI Assistant uses secure server-side tool calling and strictly respects the role and identity of the signed-in user.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-3">
                    <span className="text-xs font-semibold text-[var(--ai)] uppercase tracking-wide">
                      Try asking as an Employee:
                    </span>
                    <ul className="space-y-2 text-xs">
                      <li className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                        <span>"How many days of leave do I have remaining?"</span>
                        <Bot className="w-4 h-4 text-[var(--ai)] shrink-0" />
                      </li>
                      <li className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                        <span>"What time did I check in today?"</span>
                        <Bot className="w-4 h-4 text-[var(--ai)] shrink-0" />
                      </li>
                      <li className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                        <span>"What is the company leave policy for sick leave?"</span>
                        <Bot className="w-4 h-4 text-[var(--ai)] shrink-0" />
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-3">
                    <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
                      Try asking as Admin or HR:
                    </span>
                    <ul className="space-y-2 text-xs">
                      <li className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                        <span>"Summarize our current employee headcount by department."</span>
                        <Bot className="w-4 h-4 text-[var(--primary)] shrink-0" />
                      </li>
                      <li className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                        <span>"Who was late or absent today?"</span>
                        <Bot className="w-4 h-4 text-[var(--primary)] shrink-0" />
                      </li>
                      <li className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                        <span>"What are the office start time and grace period settings?"</span>
                        <Bot className="w-4 h-4 text-[var(--primary)] shrink-0" />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Technical Architecture Summary */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
            <Info className="w-4 h-4 text-[var(--primary)]" />
            <span>Architecture & Security Highlights</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-1.5">
              <span className="font-bold text-[var(--text)] block">Role-Based Access Control</span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                RBAC is enforced strictly on the Express backend middleware on every single API endpoint.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-1.5">
              <span className="font-bold text-[var(--text)] block">Encrypted Passwords</span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Passwords are salted and hashed using bcrypt (10 rounds). Plaintext passwords are never stored or logged.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-1.5">
              <span className="font-bold text-[var(--text)] block">Full Audit Logging</span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                State transitions (create, update, approve, reject, finalize, deactivate) are recorded in the MongoDB audit collection.
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-1.5">
              <span className="font-bold text-[var(--text)] block">Server-Side AI Key</span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                The Gemini AI API key stays on the backend. The frontend never has direct access, preventing leakages.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Banner */}
        <div className="rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold">Ready to inspect the live application?</h3>
            <p className="text-xs opacity-90">
              Pick any of the three roles above and sign in to explore all dashboards and features.
            </p>
          </div>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-lg bg-white text-[var(--primary)] font-bold text-xs hover:bg-slate-50 transition-colors shadow-sm inline-flex items-center gap-2 whitespace-nowrap"
          >
            <LogIn className="w-4 h-4" />
            <span>Go to Sign In Page</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default IntroScreen;
