import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DateRange } from '../lib/types';
import { getLastNDaysRange, getCurrentMonthRange, getLastMonthRange, formatDateRange } from '../lib/dateUtils';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  loading?: boolean;
}

const presetRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', days: 0, isCurrentMonth: true },
  { label: 'Last month', days: 0, isLastMonth: true }
];

export default function DateRangeFilter({ dateRange, onDateRangeChange, loading = false }: DateRangeFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [tempDateRange, setTempDateRange] = useState<DateRange>(dateRange);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update temp date range when props change
  useEffect(() => {
    setTempDateRange(dateRange);
  }, [dateRange]);

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    let dateRange: DateRange;

    if (preset.isCurrentMonth) {
      dateRange = getCurrentMonthRange();
    } else if (preset.isLastMonth) {
      dateRange = getLastMonthRange();
    } else {
      // Use centralized "Last X Days" calculation
      dateRange = getLastNDaysRange(preset.days);
    }

    console.log(`[DateFilter] ${preset.label}: ${dateRange.start.toISOString().split('T')[0]} to ${dateRange.end.toISOString().split('T')[0]}`);
    
    onDateRangeChange(dateRange);
    setIsDropdownOpen(false);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    const newDate = new Date(value);
    if (type === 'start') {
      newDate.setHours(0, 0, 0, 0);
      setTempDateRange({ ...tempDateRange, start: newDate });
    } else {
      newDate.setHours(23, 59, 59, 999);
      setTempDateRange({ ...tempDateRange, end: newDate });
    }
  };

  const applyDateRange = () => {
    onDateRangeChange(tempDateRange);
    setIsDropdownOpen(false);
  };

  const cancelDateRange = () => {
    setTempDateRange(dateRange);
    setIsDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="modern-card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 skeleton rounded"></div>
            <div className="w-32 h-4 skeleton"></div>
          </div>
          <div className="w-48 h-10 skeleton rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-card mb-6" style={{ position: 'relative', overflow: 'visible' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl">📅</div>
          <div>
            <h3 className="text-primary font-semibold text-lg">Date Range</h3>
            <p className="text-secondary text-sm">
              {formatDateRange(dateRange)}
            </p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            ref={buttonRef}
            onClick={() => {
              if (!isDropdownOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({
                  top: rect.bottom + 8,
                  right: Math.max(24, window.innerWidth - rect.right)
                });
              }
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="flex items-center gap-2 min-w-[200px] justify-between px-4 py-2 rounded-lg transition-all duration-200 hover:transform hover:translateY(-1px)"
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <span className="text-sm font-medium">
              Select Date Range
            </span>
            <svg 
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="var(--text-secondary)" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && createPortal(
            <div 
              style={{
                position: 'fixed',
                top: dropdownPosition.top,
                right: dropdownPosition.right,
                width: '320px',
                borderRadius: '8px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)',
                zIndex: 999999
              }}
            >
              {/* Preset Ranges */}
              <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                  Quick Select
                </h4>
                <div className="space-y-2">
                  {presetRanges.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:opacity-80"
                      style={{
                        color: 'var(--text-primary)',
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="p-3">
                <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                  Custom Range
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={tempDateRange.start.toISOString().split('T')[0]}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded border"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={tempDateRange.end.toISOString().split('T')[0]}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded border"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  
                  {/* Apply/Cancel buttons */}
                  <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={applyDateRange}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:transform hover:translateY(-1px)"
                      style={{
                        background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                        border: '1px solid var(--accent-blue)'
                      }}
                    >
                      Apply
                    </button>
                    <button
                      onClick={cancelDateRange}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:transform hover:translateY(-1px)"
                      style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && createPortal(
        <div
          className="fixed inset-0"
          style={{ zIndex: 999998 }}
          onClick={() => setIsDropdownOpen(false)}
        />,
        document.body
      )}
    </div>
  );
}