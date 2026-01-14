'use client';

import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConnectButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable Connect Button Component
 * Can be used anywhere on the site to navigate to the connect page
 * 
 * Usage:
 * <ConnectButton />
 * <ConnectButton variant="outline" size="lg" />
 * <ConnectButton>Custom Text</ConnectButton>
 */
export function ConnectButton({ 
  variant = 'default', 
  size = 'default',
  className = '',
  children 
}: ConnectButtonProps) {
  const router = useRouter();

  return (
    <Button 
      onClick={() => router.push('/connect')}
      variant={variant}
      size={size}
      className={className}
    >
      <PlayCircle className="mr-2 h-4 w-4" />
      {children || 'Connect to Server'}
    </Button>
  );
}
