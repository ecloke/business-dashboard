import React from 'react';
import { DashboardData } from '../lib/types';

interface MetricsCardsProps {
  data: DashboardData | null;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  gradientClass: string;
  icon: string;
  loading?: boolean;
}

function MetricCard({ title, value, subtitle, gradientClass, icon, loading = false }: MetricCardProps) {
  if (loading) {
    return (
      <div className={`modern-card gradient-card ${gradientClass} fade-in`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="w-24 h-4 skeleton mb-2"></div>
            <div className="w-16 h-8 skeleton mb-1"></div>
            <div className="w-20 h-3 skeleton"></div>
          </div>
          <div className="w-12 h-12 skeleton rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modern-card gradient-card ${gradientClass} fade-in group cursor-pointer`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-white/80 text-sm font-medium mb-2 group-hover:text-white transition-colors">
            {title}
          </h3>
          <div className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">
            {value}
          </div>
          <p className="text-white/70 text-xs font-medium group-hover:text-white/90 transition-colors">
            {subtitle}
          </p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white text-xl group-hover:bg-white/30 transition-colors backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function MetricsCards({ data, loading = false }: MetricsCardsProps) {
  // Calculate metrics from data
  const todaysLeads = data?.todaysLeads || 0;
  const totalLeads = data?.totalCount || 0;
  const topOriginalSource = getTopOriginalTrafficSource(data);
  const wonLeads = data?.leadStatusBreakdown?.['Won'] || data?.wonLeads || 0;
  const lostLeads = data?.leadStatusBreakdown?.['Lost'] || data?.lostLeads || 0;
  const topProduct = getTopProduct(data);

  const metrics = [
    {
      title: "Total Leads",
      value: totalLeads,
      subtitle: "All leads tracked",
      gradientClass: "gradient-card",
      icon: "📈"
    },
    {
      title: "Today's Leads",
      value: todaysLeads,
      subtitle: "New leads today",
      gradientClass: "gradient-card-2",
      icon: "📊"
    },
    {
      title: "Top Traffic Source",
      value: `${topOriginalSource.percentage}%`,
      subtitle: `${topOriginalSource.name} (${topOriginalSource.count} leads)`,
      gradientClass: "gradient-card-3",
      icon: "🚀"
    },
    {
      title: "Won Leads",
      value: wonLeads,
      subtitle: "Successful conversions",
      gradientClass: "gradient-card-4",
      icon: "✅"
    },
    {
      title: "Top Product",
      value: topProduct.count,
      subtitle: topProduct.name,
      gradientClass: "gradient-card-5",
      icon: "🏆"
    }
  ];

  return (
    <div className="grid-5 mb-8">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          gradientClass={metric.gradientClass}
          icon={metric.icon}
          loading={loading}
        />
      ))}
    </div>
  );
}

/**
 * Get the top performing original traffic source
 */
function getTopOriginalTrafficSource(data: DashboardData | null): {
  name: string;
  count: number;
  percentage: number;
} {
  if (!data || !data.originalSourceBreakdown || Object.keys(data.originalSourceBreakdown).length === 0) {
    return { name: 'Unknown', count: 0, percentage: 0 };
  }

  const sources = Object.entries(data.originalSourceBreakdown);
  if (sources.length === 0) {
    return { name: 'No data', count: 0, percentage: 0 };
  }

  // Find the source with the highest count
  const topSource = sources.reduce((max, current) => {
    return current[1] > max[1] ? current : max;
  });

  const [name, count] = topSource;
  const percentage = data.totalCount > 0 ? Math.round((count / data.totalCount) * 100) : 0;

  return {
    name: formatSourceName(name),
    count,
    percentage
  };
}

/**
 * Get the top product/message
 */
function getTopProduct(data: DashboardData | null): {
  name: string;
  count: number;
} {
  if (!data || !data.topProducts || !Array.isArray(data.topProducts) || data.topProducts.length === 0) {
    return { name: 'No data', count: 0 };
  }

  const topProduct = data.topProducts[0];
  return {
    name: topProduct?.name || 'Unknown',
    count: topProduct?.count || 0
  };
}

/**
 * Format source names for better display
 */
function formatSourceName(source: string): string {
  const sourceMap: Record<string, string> = {
    'Paid Social': 'Facebook',
    'Direct Traffic': 'Direct',
    'Paid Search': 'Google',
    'Organic Search': 'Organic',
    'Other': 'Other'
  };

  return sourceMap[source] || source;
}