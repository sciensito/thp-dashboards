import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileBarChart,
  Settings,
  LogOut,
  Database,
  Menu,
  X,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboards', href: '/', icon: LayoutDashboard },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Salesforce', href: '/salesforce', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-neutral-900">SF Dashboards</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-neutral-600">
                  {user?.email?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="flex items-center h-16 px-4 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
