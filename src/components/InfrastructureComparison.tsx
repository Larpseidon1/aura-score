'use client';

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { formatCurrency, formatNumber, formatAuraScore, formatPercentageWithCommas } from '@/utils/formatters';
import Image from 'next/image';

interface CryptoProject {
  name: string;
  category: 'L1' | 'L2' | 'L3' | 'Application' | 'dApp' | 'Stablecoins';
  secondaryCategory?: string;
  amountRaised: number;
  dailyRevenue?: number;
  dailyAppFees?: number;
  annualizedRevenue?: number;
  annualizedAppFees?: number;
  fdv?: number;
  returnVsFunding?: number;
  returnSinceTGE?: number;
}

interface ComparisonData {
  projects: CryptoProject[];
  lastUpdated: string;
}

interface InfrastructureComparisonProps {
  className?: string;
}

type ViewMode = 'aura' | 'detailed';

interface ProjectWithAuraScore extends CryptoProject {
  auraScore: number;
}

// Helper function to render category badges
const renderCategoryBadges = (project: CryptoProject) => (
  <div className="flex items-center gap-1 flex-wrap">
    <span className={`text-xs px-2 py-1 rounded-full ${
      project.category === 'L1' ? 'bg-blue-100 text-blue-800' :
      project.category === 'L2' ? 'bg-green-100 text-green-800' :
      project.category === 'Stablecoins' ? 'bg-orange-100 text-orange-800' :
      'bg-purple-100 text-purple-800'
    }`}>
      {project.category}
    </span>
    {project.secondaryCategory && (
      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
        {project.secondaryCategory}
      </span>
    )}
  </div>
);

// Project logos mapping
const projectLogos: Record<string, string> = {
  'Hyperliquid': '/Hyperliquid Profile Image (2).png',
  'Ethereum': '/Ethereum Profile Image.jpg',
  'Solana': '/Solana Profile Image.jpg',
  'Tron': '/TRON DAO Profile Image.jpg',
  'Sonic': '/Sonic Labs Profile Image.jpg',
  'Arbitrum': '/Arbitrum Profile Image.jpg',
  'Blast': '/Blast Profile Image.jpg',
  'Sui Network': '/SuiNetwork Profile Image (1).jpg',
  'Polygon': '/Polygon Profile Image.jpg',
  'Berachain': '/Berachain Foundation.jpg',
  'Initia': '/Initia Profile Image.png',
  'Optimism': '/Optimism Profile Image.jpg',
  'Movement': '/Movement Profile Image.jpg',
  'Ton': '/TON Logo 400x400.jpg',
  'Celestia': '/Celestia Profile Image.png',
  'Story Protocol': '/Story Protocol Image.jpg',
  // Application project logos
  'Axiom': '/Axiom Profile Image.jpg',
  'Pump.fun': '/Pump Fun Profile Image.jpg',
  'Tether': '/Tether Logo.svg',
  'pvp.trade': '/PVP Trade Profile Image.jpg',
  'Circle': '/Circle Profile Image.png',
  'Phantom': '/Phantom Profile Image.jpg',
  'Moonshot': '/Moonshot Profile Image.jpg',
  'Dexari': '/Dexari Profile Image.jpg',
  'Defi App': '/Defi App Avatar.jpg',
  'Okto': '/Okto Profile Image.png'
};

export function InfrastructureComparison({ className = '' }: InfrastructureComparisonProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('aura');
  const [tooltip, setTooltip] = useState<{ show: boolean; content: string; x: number; y: number }>({
    show: false,
    content: '',
    x: 0,
    y: 0
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/comparison');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching comparison data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  const getProjectsWithAuraScores = (): ProjectWithAuraScore[] => {
    if (!data?.projects) return [];
    
    return data.projects
      .map(calculateAuraScore)
      .sort((a, b) => {
        // Sort by aura score (descending), with Infinity (bootstrapped with revenue) at top
        if (a.auraScore === Infinity && b.auraScore === Infinity) return 0;
        if (a.auraScore === Infinity) return -1;
        if (b.auraScore === Infinity) return 1;
        return b.auraScore - a.auraScore;
      });
  };

  const handleMouseEnter = (content: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Simple positioning: center horizontally, show above the element
    const x = rect.left + (rect.width / 2);
    const y = rect.top - 60; // Show tooltip 60px above the element
    
    setTooltip({
      show: true,
      content,
      x,
      y
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  if (loading) {
    return <LoadingSpinner variant="clean" />;
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 ${className}`}>
        <div className="text-center text-red-600">
          <p className="font-semibold">Error loading data</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.projects) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 ${className}`}>
        <div className="text-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const projectsWithAura = getProjectsWithAuraScores();

  const renderAuraView = () => {
    const topThree = projectsWithAura.slice(0, 3);
    const remaining = projectsWithAura.slice(3);
    
    // Normal distribution pattern: small top tier, large mid tier, small cursed tier
    const totalRemaining = remaining.length;
    
    // Calculate tier sizes following normal distribution (20% - 60% - 20%)
    const topTierSize = Math.max(1, Math.floor(totalRemaining * 0.2));
    const cursedTierSize = Math.max(1, Math.floor(totalRemaining * 0.2)); 
    const midTierSize = totalRemaining - topTierSize - cursedTierSize; // Mid-tier gets the remainder (bulk)
    
    const topTier = remaining.slice(0, topTierSize);
    const midTier = remaining.slice(topTierSize, topTierSize + midTierSize);
    const cursedTier = remaining.slice(topTierSize + midTierSize);

    return (
      <div className="p-6">
        {/* Podium - Top 3 */}
        {topThree.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-center items-end gap-4 mb-8">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    <Image 
                      src="/Shape_04_Black.png" 
                      alt="2nd place" 
                      width={48} 
                      height={48}
                      className="w-12 h-12"
                    />
                  </div>
                  <div className="text-center mb-2">
                    <span className="text-lg font-bold" style={{color: '#82AFD9'}}>2nd Place</span>
                  </div>
                  <div className="glass-effect p-4 rounded-xl transition-all hover:shadow-lg max-w-xs border-2" style={{borderColor: '#82AFD9'}}>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-1">
                        {projectLogos[topThree[1].name] && (
                          <Image
                            src={projectLogos[topThree[1].name]}
                            alt={`${topThree[1].name} logo`}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        )}
                        <h4 className="font-semibold text-lg text-gray-900">{topThree[1].name}</h4>
                      </div>
                      <div className="text-sm font-mono mb-1" style={{color: '#181818'}}>
                        Aura: {topThree[1].auraScore === Infinity ? '∞' : formatAuraScore(Math.round(topThree[1].auraScore))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    <Image 
                      src="/Shape_11_Black.png" 
                      alt="1st place" 
                      width={80} 
                      height={40}
                      className="w-20 h-10"
                    />
                  </div>
                  <div className="text-center mb-2">
                    <span className="text-xl font-bold" style={{color: '#1956E7'}}>1st Place</span>
                  </div>
                  <div className="glass-effect p-6 rounded-xl border-2 transition-all hover:shadow-xl max-w-xs transform scale-110" style={{borderColor: '#1956E7'}}>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-1">
                        {projectLogos[topThree[0].name] && (
                          <Image
                            src={projectLogos[topThree[0].name]}
                            alt={`${topThree[0].name} logo`}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <h4 className="font-bold text-xl text-gray-900">{topThree[0].name}</h4>
                      </div>
                      <div className="text-base font-mono mb-2" style={{color: '#181818'}}>
                        Aura: {topThree[0].auraScore === Infinity ? '∞' : formatAuraScore(Math.round(topThree[0].auraScore))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    <Image 
                      src="/Shape_09_Black.png" 
                      alt="3rd place" 
                      width={48} 
                      height={48}
                      className="w-12 h-12"
                    />
                  </div>
                  <div className="text-center mb-2">
                    <span className="text-lg font-bold" style={{color: '#67A883'}}>3rd Place</span>
                  </div>
                  <div className="glass-effect p-4 rounded-xl border-2 transition-all hover:shadow-lg max-w-xs" style={{borderColor: '#67A883'}}>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-1">
                        {projectLogos[topThree[2].name] && (
                          <Image
                            src={projectLogos[topThree[2].name]}
                            alt={`${topThree[2].name} logo`}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        )}
                        <h4 className="font-semibold text-lg text-gray-900">{topThree[2].name}</h4>
                      </div>
                      <div className="text-sm font-mono mb-1" style={{color: '#181818'}}>
                        Aura: {topThree[2].auraScore === Infinity ? '∞' : formatAuraScore(Math.round(topThree[2].auraScore))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top-tier */}
        {topTier.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <Image 
                src="/Shape_13_Black.png" 
                alt="Top-tier icon" 
                width={24} 
                height={24}
                className="w-6 h-6"
              />
              Top-tier
            </h3>
            <div className="space-y-3">
              {topTier.map((project, index) => {
                const position = index + 4; // Since this starts after top 3
                
                return (
                  <div
                    key={project.name}
                    className="glass-effect flex items-center justify-between p-4 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-500 min-w-[3rem]">
                        #{position}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {projectLogos[project.name] && (
                            <Image
                              src={projectLogos[project.name]}
                              alt={`${project.name} logo`}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <h4 className="font-semibold text-lg text-gray-900">{project.name}</h4>
                          {renderCategoryBadges(project)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-semibold" style={{color: '#181818'}}>
                        {project.auraScore === Infinity ? '∞' : formatAuraScore(Math.round(project.auraScore))}
                      </div>
                      <div className="text-xs text-gray-500">Aura</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mid-tier */}
        {midTier.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <Image 
                src="/Shape_12_Black.png" 
                alt="Mid-tier icon" 
                width={24} 
                height={24}
                className="w-6 h-6"
              />
              Mid-tier
            </h3>
            <div className="space-y-3">
              {midTier.map((project, index) => {
                const position = index + 4 + topTier.length; // Position after top 3 + topTier
                
                return (
                  <div
                    key={project.name}
                    className="glass-effect flex items-center justify-between p-4 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-500 min-w-[3rem]">
                        #{position}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {projectLogos[project.name] && (
                            <Image
                              src={projectLogos[project.name]}
                              alt={`${project.name} logo`}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <h4 className="font-semibold text-lg text-gray-900">{project.name}</h4>
                          {renderCategoryBadges(project)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-semibold" style={{color: '#181818'}}>
                        {project.auraScore === Infinity ? '∞' : formatAuraScore(Math.round(project.auraScore))}
                      </div>
                      <div className="text-xs text-gray-500">Aura</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cursed-tier */}
        {cursedTier.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <Image 
                src="/Shape_03_Black.png" 
                alt="Cursed-tier icon" 
                width={24} 
                height={24}
                className="w-6 h-6"
              />
              Cursed-tier
            </h3>
            <div className="space-y-3">
              {cursedTier.map((project, index) => {
                const position = index + 4 + topTier.length + midTier.length; // Position after all previous
                
                return (
                  <div
                    key={project.name}
                    className="glass-effect flex items-center justify-between p-4 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-500 min-w-[3rem]">
                        #{position}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {projectLogos[project.name] && (
                            <Image
                              src={projectLogos[project.name]}
                              alt={`${project.name} logo`}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <h4 className="font-semibold text-lg text-gray-900">{project.name}</h4>
                          {renderCategoryBadges(project)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-semibold" style={{color: '#181818'}}>
                        {project.auraScore === Infinity ? '∞' : formatAuraScore(Math.round(project.auraScore))}
                      </div>
                      <div className="text-xs text-gray-500">Aura</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDetailedView = () => (
    <div className="p-6">
      <div className="modern-table overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount Raised
              </th>
              <th 
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-help"
                onMouseEnter={(e) => handleMouseEnter("Fully Diluted Valuation", e)}
                onMouseLeave={handleMouseLeave}
              >
                FDV
              </th>
              <th 
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-help"
                onMouseEnter={(e) => handleMouseEnter("% gain/loss vs. most recent known private valuation", e)}
                onMouseLeave={handleMouseLeave}
              >
                Return Vs. Latest Funding
              </th>
              <th 
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-help"
                onMouseEnter={(e) => handleMouseEnter("% gain/loss vs. initial token price", e)}
                onMouseLeave={handleMouseLeave}
              >
                Return since TGE
              </th>
              <th 
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-help"
                onMouseEnter={(e) => handleMouseEnter("Trailing 30d revenue × 12", e)}
                onMouseLeave={handleMouseLeave}
              >
                Revenue (Annualized)
              </th>
              <th 
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-help"
                onMouseEnter={(e) => handleMouseEnter("Trailing 30d app ecosystem revenue × 12", e)}
                onMouseLeave={handleMouseLeave}
              >
                Ecosystem Revenue (Annualized)
              </th>
              <th 
                className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-help"
                onMouseEnter={(e) => handleMouseEnter("App and/or native L1/2 revenue = 100% weighted, ecosystem fees = 70% weighted, ÷ amt raised", e)}
                onMouseLeave={handleMouseLeave}
              >
                Aura Score
              </th>
            </tr>
          </thead>
          <tbody>
            {projectsWithAura.map((project, index) => {
              const annualizedRevenue = project.annualizedRevenue || 0; 
              const annualizedAppFees = project.annualizedAppFees || 0;
              const hasRevenue = annualizedRevenue > 0;
              const hasAppFees = annualizedAppFees > 0;
              const rank = index + 1;

                              return (
                  <tr key={project.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      rank === 1 ? 'bg-yellow-500/20 text-yellow-600' :
                      rank === 2 ? 'bg-gray-500/20 text-gray-600' :
                      rank === 3 ? 'bg-orange-500/20 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      #{rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {projectLogos[project.name] && (
                        <Image
                          src={projectLogos[project.name]}
                          alt={`${project.name} logo`}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderCategoryBadges(project)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {project.amountRaised > 0 ? formatCurrency(project.amountRaised) : 'Bootstrapped'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {project.fdv ? (
                      <span className="text-purple-600 font-semibold">
                        {formatCurrency(project.fdv)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {project.returnVsFunding !== undefined ? (
                      <span className={`font-semibold ${
                        project.returnVsFunding > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentageWithCommas(project.returnVsFunding)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {project.returnSinceTGE !== undefined ? (
                      <span className={`font-semibold ${
                        project.returnSinceTGE > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentageWithCommas(project.returnSinceTGE)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {hasRevenue ? (
                      <span className="text-blue-600 font-semibold">
                        {formatCurrency(annualizedRevenue)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {hasAppFees ? (
                      <span className="text-indigo-600 font-semibold">
                        {formatCurrency(annualizedAppFees)}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <span className="text-gray-900 font-semibold">
                      {project.auraScore === Infinity ? '∞' : formatAuraScore(Math.round(project.auraScore))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`glass-container rounded-xl ${className}`}>
      <div className="glass-header p-6 rounded-t-xl">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {viewMode === 'aura' ? (
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/Shape_Mini_02_Black.png"
                  alt="Aura"
                  width={28}
                  height={28}
                  className="w-7 h-7"
                />
                Aura Score
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/Shape_Mini_03_Black.png"
                  alt="Detailed Breakdown"
                  width={28}
                  height={28}
                  className="w-7 h-7"
                />
                Detailed Breakdown
              </div>
            )}
          </h2>
          <p className="text-gray-600">
            Quantifying taste, at scale—ranking projects by aura-adjusted revenue efficiency
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex justify-center">
          <div className="glass-effect p-1 rounded-lg">
            <button
              onClick={() => setViewMode('aura')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'aura'
                  ? 'bg-white text-gray-900 shadow-md backdrop-blur-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'detailed'
                  ? 'bg-white text-gray-900 shadow-md backdrop-blur-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/30'
              }`}
            >
              Detailed View
            </button>
          </div>
        </div>
      </div>

      <div className="glass-section-divider"></div>

      {viewMode === 'aura' ? renderAuraView() : renderDetailedView()}

      <div className="glass-section-divider"></div>
      
      <div className="glass-footer p-6 rounded-b-xl">
        <div className="text-xs text-gray-500 text-center">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
          <br />
          Data sources: DefiLlama, Hyperliquid, & CoinGecko APIs
        </div>
      </div>

      {/* Custom Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 max-w-xs text-center"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
} 