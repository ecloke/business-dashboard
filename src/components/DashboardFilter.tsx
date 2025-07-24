import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DashboardData } from '../lib/types';

interface DashboardFilterProps {
  data: DashboardData | null;
  onFilterChange: (selectedFormTypes: string[]) => void;
  loading?: boolean;
}

export default function DashboardFilter({ data, onFilterChange, loading = false }: DashboardFilterProps) {
  const [selectedFormTypes, setSelectedFormTypes] = useState<string[]>([]);
  const [availableFormTypes, setAvailableFormTypes] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Extract available form types from data
  useEffect(() => {
    if (data && data.formBreakdown) {
      const formTypes = Object.keys(data.formBreakdown).sort();
      setAvailableFormTypes(formTypes);
      
      // Initialize with all form types selected (show all by default)
      if (selectedFormTypes.length === 0) {
        setSelectedFormTypes(formTypes);
        onFilterChange(formTypes);
      }
    }
  }, [data]);

  const handleFormTypeToggle = (formType: string) => {
    const newSelection = selectedFormTypes.includes(formType)
      ? selectedFormTypes.filter(type => type !== formType)
      : [...selectedFormTypes, formType];
    
    setSelectedFormTypes(newSelection);
    onFilterChange(newSelection);
  };

  const handleSelectAll = () => {
    setSelectedFormTypes(availableFormTypes);
    onFilterChange(availableFormTypes);
  };

  const handleClearAll = () => {
    setSelectedFormTypes([]);
    onFilterChange([]);
  };

  if (loading || !data) {
    return (
      <div className="modern-card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 skeleton rounded"></div>
            <div className="w-32 h-4 skeleton"></div>
          </div>
          <div className="w-40 h-10 skeleton rounded-lg"></div>
        </div>
      </div>
    );
  }

  const selectedCount = selectedFormTypes.length;
  const totalCount = availableFormTypes.length;

  return (
    <div className="modern-card mb-6" style={{ position: 'relative', overflow: 'visible', zIndex: 10000 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl">🎯</div>
          <div>
            <h3 className="text-primary font-semibold text-lg">Filter by Form Type</h3>
            <p className="text-secondary text-sm">
              {selectedCount === totalCount 
                ? `Showing all ${totalCount} form types` 
                : `${selectedCount} of ${totalCount} form types selected`}
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1000000 }}>
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
              {selectedCount === 0 
                ? 'No filters selected'
                : selectedCount === totalCount 
                ? 'All form types'
                : `${selectedCount} selected`}
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
                maxHeight: '384px',
                overflowY: 'auto',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)',
                zIndex: 999999
              }}
            >
              {/* Header with Select All/Clear All */}
              <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    Select Form Types
                  </h4>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs font-medium px-2 py-1 rounded transition-colors hover:opacity-80"
                      style={{ 
                        color: 'var(--accent-blue)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="text-xs font-medium px-2 py-1 rounded transition-colors hover:opacity-80"
                      style={{ 
                        color: 'var(--accent-orange)',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Type Options */}
              <div className="p-2">
                {availableFormTypes.map(formType => {
                  const count = data?.formBreakdown[formType] || 0;
                  const isSelected = selectedFormTypes.includes(formType);
                  
                  return (
                    <label
                      key={formType}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:transform hover:translateY(-1px)"
                      style={{
                        border: '1px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-glass)';
                        e.currentTarget.style.border = '1px solid var(--border)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.border = '1px solid transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleFormTypeToggle(formType)}
                        className="w-4 h-4 rounded"
                        style={{
                          border: '2px solid var(--border)',
                          background: 'var(--bg-card)',
                          accentColor: 'var(--accent-blue)'
                        }}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formType}
                        </span>
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          {count} leads
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>

      {/* Selected filters display */}
      {selectedCount > 0 && selectedCount < totalCount && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex flex-wrap gap-2">
            {selectedFormTypes.map(formType => (
              <span
                key={formType}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full transition-colors hover:transform hover:scale-105"
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: 'var(--accent-blue)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                <span className="font-medium">{formType}</span>
                <button
                  onClick={() => handleFormTypeToggle(formType)}
                  className="ml-1 transition-all duration-200 rounded-full w-4 h-4 flex items-center justify-center hover:scale-110 hover:opacity-80"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: 'rgba(239, 68, 68, 0.8)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '11px',
                    fontWeight: '600',
                    lineHeight: '1'
                  }}
                  title={`Remove ${formType} filter`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

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