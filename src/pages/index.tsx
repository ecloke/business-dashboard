import React from 'react';
import Head from 'next/head';
import Dashboard from '../components/Dashboard';

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>HubSpot Lead Analytics Dashboard - EPOS Malaysia</title>
        <meta name="description" content="Real-time HubSpot CRM lead analytics dashboard for Malaysian POS system company EPOS. Track lead sources, geographic distribution, and form performance." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Dashboard />
    </>
  );
}