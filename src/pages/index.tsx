import React, { useState } from 'react';
import Head from 'next/head';
import Dashboard from '../components/Dashboard';
import MarketingROIDashboard from '../components/MarketingROIDashboard';
import SidebarNavigation from '../components/SidebarNavigation';
import { DashboardType } from '../lib/types';

export default function DashboardPage() {
  const [activeDashboard, setActiveDashboard] = useState<DashboardType>('leads-overview');

  return (
    <>
      <Head>
        <title>Business Analytics Dashboard - EPOS Malaysia</title>
        <meta name="description" content="Comprehensive business analytics dashboard with HubSpot CRM leads and marketing ROI insights for Malaysian POS system company EPOS." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <SidebarNavigation 
          activeTab={activeDashboard} 
          onTabChange={setActiveDashboard} 
        />
        
        {/* Main Content Area */}
        <div className="pl-4 pr-4 py-8 md:pl-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {activeDashboard === 'leads-overview' && <Dashboard />}
            {activeDashboard === 'marketing-roi' && <MarketingROIDashboard />}
          </div>
        </div>
      </div>
    </>
  );
}