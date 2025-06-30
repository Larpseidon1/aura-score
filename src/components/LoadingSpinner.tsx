'use client';

import Image from 'next/image';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'sky' | 'clean';
}

export function LoadingSpinner({ size = 'md', className = '', variant = 'default' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Default spinner (original behavior)
  if (variant === 'default') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`animate-spin rounded-full border-2 border-secondary-600 border-t-primary-500 ${sizeClasses[size]}`} />
      </div>
    );
  }

  // Clean white background with custom spinning icon
  if (variant === 'clean') {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <Image
              src="/head-3-logo.png"
              alt="Loading"
              width={80}
              height={80}
              className="w-20 h-20 animate-spin"
              priority
            />
          </div>
          <div className="text-lg font-medium text-gray-700">Loading...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we fetch the latest data</div>
        </div>
      </div>
    );
  }

  // Sky background variant
  if (variant === 'sky') {
    return (
      <div className="fixed inset-0 z-50">
        {/* Sky Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, #87CEEB 0%, #98D8E8 25%, #B6E5F0 50%, #87CEEB 100%)
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Mobile Sky Background (up to 768px) */}
        <div 
          className="absolute inset-0 md:hidden"
          style={{
            backgroundImage: 'url(/sky-mobile.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Desktop Sky Background (768px and up) */}
        <div 
          className="hidden md:block absolute inset-0"
          style={{
            backgroundImage: 'url(/sky-4k.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Loading Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="glass-container p-8 rounded-xl text-center">
            <div className="relative mb-6">
              <Image
                src="/head-3-logo.png"
                alt="Loading"
                width={100}
                height={100}
                className="w-24 h-24 animate-spin mx-auto"
                priority
              />
            </div>
            <div className="text-xl font-semibold text-gray-800 mb-2">Loading Dashboard</div>
            <div className="text-sm text-gray-600">Fetching the latest builder analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to default
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-secondary-600 border-t-primary-500 ${sizeClasses[size]}`} />
    </div>
  );
} 