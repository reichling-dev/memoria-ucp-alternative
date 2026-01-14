'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QueueStatus {
  queueLength: number;
  playerCount: number;
  maxPlayers: number;
  availableSlots: number;
  serverOnline: boolean;
}

export default function ConnectPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
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

        // Show success message
        setTimeout(() => {
          toast({
            title: "FiveM Launched",
            description: "If FiveM didn't open, please ensure it's installed.",
          });
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

  if (status === 'loading' || loadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Connect to Server
          </h1>
          <p className="text-muted-foreground">
            Join our FiveM server with secure authentication
          </p>
        </div>

        {/* Server Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Server Status
            </CardTitle>
            <CardDescription>Real-time server information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {queueStatus?.serverOnline ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-semibold">Status</span>
                </div>
                <span className={queueStatus?.serverOnline ? "text-green-500" : "text-red-500"}>
                  {queueStatus?.serverOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">Players</span>
                </div>
                <span className="text-2xl font-bold">
                  {queueStatus?.playerCount || 0}/{queueStatus?.maxPlayers || 32}
                </span>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Queue</span>
                </div>
                <span className="text-2xl font-bold">
                  {queueStatus?.queueLength || 0}
                </span>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Available</span>
                </div>
                <span className="text-2xl font-bold">
                  {queueStatus?.availableSlots || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connect to FiveM Server</CardTitle>
            <CardDescription>
              {session 
                ? `Logged in as ${session.user?.name}`
                : "Please login with Discord to connect"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!session ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground mb-4">
                  You need to be logged in with Discord to connect to the server.
                </p>
                <Button
                  onClick={() => window.location.href = '/login'}
                  size="lg"
                >
                  Login with Discord
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    Ready to Connect
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Discord account verified</li>
                    <li>✓ Connection token will be generated</li>
                    <li>✓ Priority queue based on your roles</li>
                    <li>✓ Secure encrypted connection</li>
                  </ul>
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !queueStatus?.serverOnline}
                  size="lg"
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Token...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Connect to Server
                    </>
                  )}
                </Button>

                {!queueStatus?.serverOnline && (
                  <p className="text-sm text-center text-red-500">
                    Server is currently offline. Please try again later.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">🔒 Secure Connection</h4>
              <p className="text-muted-foreground">
                Your connection is secured with a unique token that expires after 5 minutes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">⏱️ Queue System</h4>
              <p className="text-muted-foreground">
                If the server is full, you'll be placed in a queue. Your Discord roles determine your priority.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">🔄 Crash Protection</h4>
              <p className="text-muted-foreground">
                If you disconnect unexpectedly, you'll be returned to your exact queue position for 3 minutes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">👑 VIP Benefits</h4>
              <p className="text-muted-foreground">
                VIP and staff members get priority queue placement and faster connection times.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
