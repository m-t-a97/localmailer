"use client";

import { useState, useEffect } from "react";

import { Loader2, Play, PowerOff } from "lucide-react";
import { toast } from "sonner";

import { SmtpServerAction } from "@repo/data-commons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  checkSmtpServerStatus,
  toggleSmtpServer,
} from "@/services/client/smtp.service";

function StatusDot({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="inline-grid *:[grid-area:1/1]">
      <div
        className={cn(
          "h-3.5 w-3.5 animate-ping rounded-full",
          isRunning ? "bg-green-500" : "bg-red-500",
        )}
      />
      <div
        className={cn(
          "h-3.5 w-3.5 rounded-full",
          isRunning ? "bg-green-500" : "bg-red-500",
        )}
      />
    </div>
  );
}

export default function SmtpServerSettings() {
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
      if (isServerStarted) {
        toast.success(`SMTP server is now running on port ${smtpPort}`);
      } else {
        toast.success("SMTP server stopped");
      }
    } catch (error) {
      console.error("Error starting server:", error);
      if (isServerStarted) {
        toast.error("Failed to start the SMTP server");
      } else {
        toast.error("Failed to stop the SMTP server");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* SERVER STATUS */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <label className="text-sm font-medium text-foreground mb-3 block">
          Server Status
        </label>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <StatusDot isRunning={isServerRunning} />
            <span
              className={cn(
                "text-sm font-medium",
                isServerRunning
                  ? "text-green-600 dark:text-green-400"
                  : "text-destructive",
              )}
            >
              {isServerRunning ? "Running" : "Stopped"}
            </span>
          </div>

          <Button
            variant={isServerRunning ? "destructive" : "default"}
            className="gap-2 min-w-[140px]"
            onClick={
              isServerRunning
                ? () => handleToggleServer("stop")
                : () => handleToggleServer("start")
            }
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isServerRunning ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isServerRunning ? "Stop Server" : "Start Server"}
          </Button>
        </div>
      </div>

      {/* SMTP PORT */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <label
          htmlFor="smtp-port"
          className="text-sm font-medium text-foreground mb-3 block"
        >
          SMTP Port
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="smtp-port"
            type="number"
            className="max-w-[200px]"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            disabled={isServerRunning}
          />
          <Button
            variant="outline"
            disabled={isServerRunning}
            onClick={() => setSmtpPort("2525")}
          >
            Reset
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Default port is 2525. You need to restart the server for changes to
          take effect.
        </p>
      </div>

      {/* SMTP CONFIG */}
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <label className="text-sm font-medium text-foreground mb-3 block">
          SMTP Configuration
        </label>
        <div className="bg-muted/50 rounded-xl p-4 font-mono text-sm space-y-1.5">
          {[
            "Host: localhost",
            `Port: ${smtpPort}`,
            "Secure: false",
            "Auth: Not required (accepts any credentials)",
            "TLS: Not required",
          ].map((value: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground/40">&bull;</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
