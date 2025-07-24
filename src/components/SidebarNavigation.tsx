import React, { useState } from 'react';
import { DashboardType } from '../lib/types';

interface SidebarNavigationProps {
  activeTab: DashboardType;
  onTabChange: (tab: DashboardType) => void;
}

export default function SidebarNavigation({ activeTab, onTabChange }: SidebarNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'leads-overview' as DashboardType,
      label: 'Leads Overview',
      icon: '📈',
      gradient: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
    },
    {
      id: 'marketing-roi' as DashboardType,
      label: 'Marketing ROI',
      icon: '💰',
      gradient: 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))'
    }
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleMenuClick = (tabId: DashboardType) => {
    onTabChange(tabId);
    setIsOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-[10001] p-3 rounded-xl transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl group"
        style={{
          background: isOpen 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
            : 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          backdropFilter: 'blur(16px)',
          boxShadow: isOpen 
            ? '0 20px 40px rgba(102, 126, 234, 0.3)' 
            : '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
        title="Toggle Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span 
            className={`block w-5 h-0.5 transition-all duration-300 ${
              isOpen 
                ? 'rotate-45 translate-y-1.5 bg-white' 
                : 'bg-white'
            }`}
          />
          <span 
            className={`block w-5 h-0.5 transition-all duration-300 my-1 ${
              isOpen 
                ? 'opacity-0 bg-white' 
                : 'bg-white'
            }`}
          />
          <span 
            className={`block w-5 h-0.5 transition-all duration-300 ${
              isOpen 
                ? '-rotate-45 -translate-y-1.5 bg-white' 
                : 'bg-white'
            }`}
          />
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 z-[10000] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(145deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
          borderRight: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📊</div>
            <div>
              <h2 className="text-primary font-bold text-xl">Business Dashboard</h2>
              <p className="text-secondary text-sm">Analytics & Insights</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:transform hover:translateX-2 group ${
                activeTab === item.id
                  ? 'text-white shadow-lg scale-105'
                  : 'text-secondary hover:text-primary'
              }`}
              style={{
                background: activeTab === item.id 
                  ? item.gradient
                  : 'transparent',
                border: activeTab === item.id 
                  ? 'none'
                  : '1px solid transparent',
              }}
            >
              <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </span>
              <div className="flex-1 text-left">
                <div className="font-medium">{item.label}</div>
                <div className={`text-xs ${activeTab === item.id ? 'text-white/70' : 'text-secondary'}`}>
                  {item.id === 'leads-overview' ? 'Lead management & tracking' : 'ROI & performance metrics'}
                </div>
              </div>
              {activeTab === item.id && (
                <div className="w-2 h-2 rounded-full bg-white opacity-70" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="text-center text-xs text-secondary">
            <div className="mb-1">Dashboard v2.0</div>
            <div>Powered by Next.js & Firebase</div>
          </div>
        </div>
      </div>
    </>
  );
}