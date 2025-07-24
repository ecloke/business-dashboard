import React from 'react';

interface MarketingMetricCardProps {
  title: string;
  value: number | string;
  icon: string;
  format?: 'currency' | 'number' | 'percentage';
  loading?: boolean;
  subtitle?: string;
}

export default function MarketingMetricCard({ 
  title, 
  value, 
  icon, 
  format = 'number', 
  loading = false,
  subtitle 
}: MarketingMetricCardProps) {
  
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('en-MY', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        })}`;
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
      default:
        return val.toLocaleString();
    }
  };

  if (loading) {
    return (
      <div className="modern-card text-center">
        <div className="skeleton w-8 h-8 mx-auto mb-3 rounded"></div>
        <div className="skeleton w-20 h-6 mx-auto mb-2"></div>
        <div className="skeleton w-16 h-4 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="modern-card text-center hover:transform hover:translateY(-2px) transition-all duration-200">
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-2xl font-bold text-primary mb-1">
        {formatValue(value)}
      </div>
      <div className="text-secondary text-sm font-medium">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-secondary mt-1 opacity-75">
          {subtitle}
        </div>
      )}
    </div>
  );
}