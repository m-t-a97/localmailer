"use client";

import { useState, useEffect } from "react";
import { Loader2, Play, PowerOff } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  checkSmtpServerStatus,
  toggleSmtpServer,
} from "@/services/client/smtp.service";
import { SmtpServerAction } from "@/types";

export default function SettingsPage() {
  const { toast } = useToast();

  const [smtpPort, setSmtpPort] = useState<string>("2525");
  const [isServerRunning, setIsServerRunning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const executeCheckSmtpServerStatus = async (): Promise<void> => {
      try {
        await checkSmtpServerStatus();
        setIsServerRunning(true);
      } catch (error) {
        console.error("Error checking server status:", error);
        setIsServerRunning(false);
      }
    };

    executeCheckSmtpServerStatus();
  }, []);

  const handleToggleServer = async (
    action: SmtpServerAction,
  ): Promise<void> => {
    const isServerStarted = action === "start";

    try {
      setIsLoading(true);
      await toggleSmtpServer(action);
      setIsServerRunning(isServerStarted);
      toast({
        title: isServerStarted ? "Server Started" : "Server Stopped",
        description: isServerStarted
          ? `SMTP server is now running on port ${smtpPort}`
          : "SMTP server stopped",
      });
    } catch (error) {
      console.error("Error starting server:", error);
      toast({
        title: "Error",
        description: isServerStarted
          ? "Failed to start the SMTP server"
          : "Failed to stop the SMTP server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-page-width p-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Server Settings</CardTitle>
            <CardDescription>
              Configure your local email development server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="smtp" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="smtp">SMTP Server</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              <TabsContent value="smtp" className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="server-status">Server Status</Label>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`h-3 w-3 rounded-full ${isServerRunning ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <span className="text-muted-foreground text-sm">
                        {isServerRunning ? "Running" : "Stopped"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={isServerRunning ? "destructive" : "default"}
                    onClick={
                      isServerRunning
                        ? () => handleToggleServer("stop")
                        : () => handleToggleServer("start")
                    }
                    disabled={isLoading}
                  >
                    <span>
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                      ) : isServerRunning ? (
                        <PowerOff className="mr-2 h-4 w-4 text-white" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                    </span>

                    {isServerRunning ? (
                      <span className="text-white">Stop Server</span>
                    ) : (
                      <span className="text-black">Start Server</span>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="smtp-port"
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      disabled={isServerRunning}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setSmtpPort("2525")}
                      disabled={isServerRunning}
                    >
                      Reset
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Default port is 2525. You need to restart the server for
                    changes to take effect.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>SMTP Configuration</Label>
                  <div className="bg-muted rounded-md p-4">
                    <pre className="text-sm">
                      <code>
                        {[
                          "Host: localhost",
                          `Port: ${smtpPort}`,
                          "Secure: false",
                          "Auth: Not required (accepts any credentials)",
                          "TLS: Not required",
                        ].join("\n")}
                      </code>
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="about">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">About This App</h3>
                    <p className="text-muted-foreground">
                      This is a local development email client that allows you
                      to test email sending functionality without connecting to
                      real email services.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium">Features</h4>
                    <ul className="text-muted-foreground list-disc pl-5">
                      <li>Local SMTP server for sending emails</li>
                      <li>Email inbox to view sent messages</li>
                      <li>HTML and plain text email support</li>
                      <li>Email composition with preview</li>
                      <li>API endpoints for programmatic access</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium">API Endpoints</h4>
                    <div className="bg-muted rounded-md p-4">
                      <pre className="overflow-auto text-sm">
                        <code>{`GET /api/emails - Get all emails
GET /api/emails?id=<email_id> - Get a specific email
POST /api/emails - Send a new email
POST /api/server?action=start&port=2525 - Start SMTP server
POST /api/server?action=stop - Stop SMTP server`}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
