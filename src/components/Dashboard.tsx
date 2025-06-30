'use client';

import { useState, useEffect } from 'react';
import { HeroHeader } from './HeroHeader';
import { Header } from './Header';
import { RevenueChart } from './RevenueChart';
import { StatsCards } from './StatsCards';
import { BuilderLeaderboard } from './BuilderLeaderboard';
import { InfrastructureComparison } from './InfrastructureComparison';
import { LoadingSpinner } from './LoadingSpinner';
import { Footer } from './Footer';
import { DashboardData, TimeRange } from '@/types';

interface CryptoProject {
  name: string;
  category: 'L1' | 'L2' | 'L3' | 'Application' | 'dApp' | 'Stablecoins';
  secondaryCategory?: string;
  amountRaised: number;
  dailyRevenue?: number;
  dailyAppFees?: number;
  annualizedRevenue?: number;
  annualizedAppFees?: number;
}

interface ProjectWithAuraScore extends CryptoProject {
  auraScore: number;
}

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange['value']>('all');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [auraRanks, setAuraRanks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate aura score for a project (same logic as InfrastructureComparison)
  const calculateAuraScore = (project: CryptoProject): ProjectWithAuraScore => {
    const annualizedRevenue = project.annualizedRevenue || 0;
    const annualizedAppFees = project.annualizedAppFees || 0;
    const amountRaised = project.amountRaised;

    // Calculate weighted revenue based on project type
    let weightedAnnualRevenue = 0;
    
    if (project.category === 'Application' || project.category === 'dApp' || project.category === 'Stablecoins') {
      // Apps: 100% weight for native revenue (they generate their own fees directly)
      weightedAnnualRevenue = annualizedRevenue * 1.0;
    } else {
      // L1/L2 Infrastructure: Native revenue gets 100% weight, ecosystem fees get 70% weight
      // This favors projects that generate revenue themselves vs just collecting from ecosystem
      const nativeRevenue = annualizedRevenue * 1.0;        // 100% weight for direct chain revenue
      const ecosystemRevenue = annualizedAppFees * 0.7;      // 70% weight for ecosystem app fees
      weightedAnnualRevenue = nativeRevenue + ecosystemRevenue;
    }

    let auraScore = 0;

    if (amountRaised === 0) {
      // Bootstrapped projects - if they have revenue, they get max positive aura (meme infinity)
      if (weightedAnnualRevenue > 0) {
        auraScore = Infinity;
      } else {
        auraScore = 0;
      }
    } else {
      // Calculate a dramatic aura score for funded projects using weighted revenue
      const rawRatio = weightedAnnualRevenue / amountRaised;
      
      if (rawRatio <= 0) {
        // No revenue = ultra cursed aura 
        auraScore = -1000;
      } else if (rawRatio < 0.001) {
        // Extremely low revenue = deeply cursed aura
        auraScore = Math.log10(rawRatio * 1000) * 200 - 800; // Results in -800 to -200 range
      } else if (rawRatio < 0.01) {
        // Very low revenue = cursed to weak aura
        auraScore = Math.log10(rawRatio * 100) * 150 - 200; // Results in -200 to 100 range
      } else if (rawRatio < 0.1) {
        // Low revenue = weak to decent aura
        auraScore = Math.log10(rawRatio * 10) * 200 + 200; // Results in 0-400 range
      } else if (rawRatio < 1) {
        // Medium revenue = solid aura
        auraScore = Math.log10(rawRatio) * 300 + 700; // Results in 400-700 range
      } else if (rawRatio < 10) {
        // High revenue = powerful aura
        auraScore = Math.log2(rawRatio) * 400 + 700; // Results in 700-2000 range
      } else if (rawRatio < 100) {
        // Very high revenue = legendary aura
        auraScore = Math.log2(rawRatio / 10) * 600 + 2000; // Results in 2000-5000 range
      } else {
        // Insane revenue = godlike aura (but not infinite)
        auraScore = Math.log2(rawRatio / 100) * 1000 + 5000; // Results in 5000+ range
      }
      
      // Round to whole numbers for dramatic impact
      auraScore = Math.round(auraScore);
    }

    return {
      ...project,
      auraScore
    };
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch both builder revenue data and aura comparison data
        const [revenueResponse, comparisonResponse] = await Promise.all([
          fetch(`/api/builders/revenue?timeRange=${timeRange}`),
          fetch('/api/comparison')
        ]);
        
        if (!revenueResponse.ok) {
          throw new Error('Failed to fetch revenue data');
        }
        if (!comparisonResponse.ok) {
          throw new Error('Failed to fetch comparison data');
        }
        
        const revenueData = await revenueResponse.json();
        const comparisonData = await comparisonResponse.json();
        
        setDashboardData(revenueData);
        
        // Create mapping from project names to aura ranks
        const ranks: Record<string, number> = {};
        if (comparisonData.projects) {
          // Calculate aura scores for all projects first
          const projectsWithAura = comparisonData.projects.map(calculateAuraScore);
          
          // Sort projects by aura score (descending) to get proper rankings
          const sortedProjects = projectsWithAura.sort((a: ProjectWithAuraScore, b: ProjectWithAuraScore) => {
            // Sort by aura score (descending), with Infinity (bootstrapped with revenue) at top
            if (a.auraScore === Infinity && b.auraScore === Infinity) return 0;
            if (a.auraScore === Infinity) return -1;
            if (b.auraScore === Infinity) return 1;
            return b.auraScore - a.auraScore;
          });
          
          // Assign ranks based on sorted order
          sortedProjects.forEach((project: ProjectWithAuraScore, index: number) => {
            ranks[project.name] = index + 1;
          });
        }
        setAuraRanks(ranks);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  if (loading) {
    return <LoadingSpinner variant="sky" />;
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error || 'No data available'}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if we have real data for pvp.trade
  const hasRealData = dashboardData.builders.some(builder => 
    builder.builderCode === 'PVP001' && builder.builderName === 'pvp.trade'
  );

  return (
    <>
      {/* Responsive Background with Optimized Loading */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: `
            linear-gradient(135deg, #87CEEB 0%, #98D8E8 25%, #B6E5F0 50%, #87CEEB 100%)
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      />
      
      {/* Mobile Background (up to 768px) */}
      <div 
        className="fixed inset-0 z-0 md:hidden"
        style={{
          backgroundImage: 'url(/sky-mobile.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      />
      
      {/* Desktop Background (768px and up) */}
      <div 
        className="hidden md:block fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/sky-4k.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      />
      
      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen px-8 py-4">
        {/* Hero Header */}
        <HeroHeader />
        
        {/* Main content */}
        <div className="min-h-[calc(100vh-2rem)] rounded-lg backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
          <div className="container mx-auto max-w-6xl px-8 py-8">

          
          {/* Aura Score Section - Above header stats */}
          <div className="mb-8">
            <InfrastructureComparison />
          </div>

          <Header 
            data={dashboardData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
          
          <div className="mt-8">
            <RevenueChart 
              data={dashboardData}
              timeRange={timeRange}
            />
          </div>
          
          <div className="mt-8">
            <StatsCards data={dashboardData} />
          </div>
          
          <div className="mt-8">
            <BuilderLeaderboard builders={dashboardData.builders} auraRanks={auraRanks} />
          </div>
          </div>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
} 