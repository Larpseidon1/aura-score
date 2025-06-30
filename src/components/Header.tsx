'use client';

import { DashboardData, TimeRange } from '@/types';
import { formatCurrency, formatNumber, formatVolume, getTimeAgo } from '@/utils/formatters';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
  data: DashboardData;
  timeRange: TimeRange['value'];
  onTimeRangeChange: (range: TimeRange['value']) => void;
}

const timeRanges: TimeRange[] = [
  { label: '24H', value: '24h', days: 1 },
  { label: '7D', value: '7d', days: 7 },
  { label: '30D', value: '30d', days: 30 },
  { label: '90D', value: '90d', days: 90 },
  { label: 'All Time', value: 'all', days: 365 },
];

export function Header({ data, timeRange, onTimeRangeChange }: HeaderProps) {
  return (
    <div className="space-y-6">
      {/* Title and Last Updated */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/Shape_Mini_07_Black.png"
              alt="Hyperliquid Builders Icon"
              width={32}
              height={32}
              className="object-contain"
            />
            <h1 className="text-3xl font-bold" style={{ color: '#181818' }}>
              Hyperliquid Builders
            </h1>
          </div>
          <p className="text-gray-700 mt-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last updated {getTimeAgo(data.lastUpdated)}
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="mt-4 sm:mt-0">
          <div className="bg-gray-100 p-1 rounded-lg">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              data.growthRate >= 0 ? 'text-success' : 'text-error'
            }`}>
              {data.growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Active Builders */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
          <div>
            <p className="text-gray-700 text-sm font-medium">Active Builders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatNumber(data.activeBuilders)}
            </p>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
          <div>
            <p className="text-gray-700 text-sm font-medium">Total Volume (Notional)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${formatVolume(data.totalVolume)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 