/**
 * CENTRALIZED DATE UTILITIES
 * 
 * This file contains ALL date calculation logic to ensure consistency
 * across the entire application. No more scattered date calculations!
 */

import { DateRange } from './types';

/**
 * Get date range for "Last X Days" filters
 * 
 * "Last 7 days" means: Today + 6 previous days = exactly 7 days
 * If today is Aug 6, 2025: July 31, Aug 1, 2, 3, 4, 5, 6
 * 
 * FIXED: Use UTC calculations to avoid timezone issues
 */
export function getLastNDaysRange(days: number): DateRange {
  const now = new Date();
  
  // Work in UTC to avoid timezone issues - construct proper UTC date
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  // Calculate start date: go back exactly (days-1) days from today
  // For "Last 7 days": today is day 1, so go back 6 days
  const startUTC = new Date(Date.UTC(
    now.getUTCFullYear(), 
    now.getUTCMonth(), 
    now.getUTCDate() - (days - 1)
  ));
  
  // End date is today at end of day UTC
  const endUTC = new Date(Date.UTC(
    now.getUTCFullYear(), 
    now.getUTCMonth(), 
    now.getUTCDate(), 
    23, 59, 59, 999
  ));
  
  return { start: startUTC, end: endUTC };
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): DateRange {
  const now = new Date();
  
  // Use UTC to avoid timezone issues
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  
  return { start, end };
}

/**
 * Get date range for last month
 */
export function getLastMonthRange(): DateRange {
  const now = new Date();
  
  // Use UTC to avoid timezone issues
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
  
  return { start, end };
}

/**
 * TEST AND VALIDATE date ranges
 * This function helps verify our date calculations are correct
 */
export function testDateRanges() {
  console.log('📅 TESTING DATE RANGE CALCULATIONS');
  console.log('==================================');
  
  // Test with a known date (Aug 6, 2025)
  const testDate = new Date('2025-08-06T12:00:00.000Z');
  
  // Temporarily override Date constructor for testing
  const originalDate = global.Date;
  global.Date = function(...args: any[]) {
    if (args.length === 0) {
      return new originalDate(testDate);
    }
    return new originalDate(...args);
  } as any;
  Object.setPrototypeOf(global.Date, originalDate);
  Object.getOwnPropertyNames(originalDate).forEach(prop => {
    (global.Date as any)[prop] = (originalDate as any)[prop];
  });
  
  console.log('Test date (today):', testDate.toISOString().split('T')[0]);
  console.log('');
  
  // Test Last 7 days
  const last7 = getLastNDaysRange(7);
  console.log('Last 7 days:');
  console.log('  Start:', last7.start.toISOString());
  console.log('  End:', last7.end.toISOString());
  console.log('  Start date:', last7.start.toISOString().split('T')[0]);
  console.log('  End date:', last7.end.toISOString().split('T')[0]);
  console.log('  Expected: 2025-07-31 to 2025-08-06 (exactly 7 days)');
  
  // Verify day count
  const startDate = new Date(last7.start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(last7.end);
  endDate.setHours(0, 0, 0, 0);
  const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  console.log('  Actual day count:', dayCount);
  
  // Test Last 30 days
  const last30 = getLastNDaysRange(30);
  console.log('');
  console.log('Last 30 days:');
  console.log('  Start:', last30.start.toISOString().split('T')[0]);
  console.log('  End:', last30.end.toISOString().split('T')[0]);
  
  // Test Last 90 days
  const last90 = getLastNDaysRange(90);
  console.log('');
  console.log('Last 90 days:');
  console.log('  Start:', last90.start.toISOString().split('T')[0]);
  console.log('  End:', last90.end.toISOString().split('T')[0]);
  
  // Restore original Date
  global.Date = originalDate;
  
  console.log('==================================');
}

/**
 * Convert date range to API query parameters
 */
export function dateRangeToParams(dateRange: DateRange): { start: string; end: string } {
  return {
    start: dateRange.start.toISOString().split('T')[0],
    end: dateRange.end.toISOString().split('T')[0]
  };
}

/**
 * Format date range for display
 */
export function formatDateRange(dateRange: DateRange): string {
  const start = dateRange.start.toLocaleDateString('en-MY');
  const end = dateRange.end.toLocaleDateString('en-MY');
  return `${start} - ${end}`;
}

/**
 * Calculate number of days in a date range
 */
export function getDayCount(dateRange: DateRange): number {
  const startDate = new Date(dateRange.start);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(dateRange.end);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  
  return diffDays;
}