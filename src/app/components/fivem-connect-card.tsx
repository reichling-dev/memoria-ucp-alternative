'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, Users, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { applicationConfig } from '@/lib/config';

interface QueueStatus {
  queueLength: number;
  playerCount: number;
  maxPlayers: number;
  availableSlots: number;
  serverOnline: boolean;
  serverName?: string;
}

interface FiveMMConnectCardProps {
  className?: string;
}

export default function FiveMConnectCard({ className = '' }: FiveMMConnectCardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Fetch queue status
  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const response = await fetch('/api/fivem/queue-status');
        const result = await response.json();
        if (result.success) {
          setQueueStatus(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch queue status:', error);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login with Discord to connect to the server.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const response = await fetch('/api/fivem/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Connection Token Generated!",
          description: "Launching FiveM... Please wait.",
        });

        // Redirect to FiveM
        setTimeout(() => {
          window.location.href = data.connectUrl;
        }, 1000);

        setTimeout(() => {
          setIsConnecting(false);
        }, 3000);
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to generate connection token.",
          variant: "destructive",
        });
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  if (loadingStatus) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-blue-500" />
          {queueStatus?.serverName || applicationConfig.website.serverName}
        </CardTitle>
        <CardDescription>Connect to our roleplay server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              {queueStatus?.serverOnline ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs font-semibold">Status</span>
            </div>
            <span className={`text-xs ${queueStatus?.serverOnline ? "text-green-500" : "text-red-500"}`}>
              {queueStatus?.serverOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold">Players</span>
            </div>
            <span className="text-sm font-bold">
              {queueStatus?.playerCount || 0}/{queueStatus?.maxPlayers || 32}
            </span>
          </div>

          <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold">Queue</span>
            </div>
            <span className="text-sm font-bold">
              {queueStatus?.queueLength || 0}
            </span>
          </div>
        </div>

        {/* Connection Info */}
        {session ? (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">
              ✓ Authenticated as <strong>{session.user?.name}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Priority queue based on Discord roles
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              Login with Discord to connect to the server
            </p>
          </div>
        )}

        {/* Connect Button */}
        <Button
          onClick={handleConnect}
          disabled={isConnecting || !queueStatus?.serverOnline || !session}
          size="lg"
          className="w-full"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Connect to Server
            </>
          )}
        </Button>

        {/* View Full Page Link */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push('/connect')}
        >
          View Full Connection Info
        </Button>
      </CardContent>
    </Card>
  );
}
