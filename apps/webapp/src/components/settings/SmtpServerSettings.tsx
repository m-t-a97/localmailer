"use client";

import { useState, useEffect } from "react";

import { Loader2, Play, PowerOff } from "lucide-react";

import { SmtpServerAction } from "@repo/data-commons";

import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import {
  checkSmtpServerStatus,
  toggleSmtpServer,
} from "@/services/client/smtp.service";

export default function SmtpServerSettings() {
  const { toastCustom } = useToast();

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
      toastCustom({
        title: isServerStarted ? "Server Started" : "Server Stopped",
        description: isServerStarted
          ? `SMTP server is now running on port ${smtpPort}`
          : "SMTP server stopped",
        variant: isServerStarted ? "success" : "error",
      });
    } catch (error) {
      console.error("Error starting server:", error);
      toastCustom({
        title: "Error",
        description: isServerStarted
          ? "Failed to start the SMTP server"
          : "Failed to stop the SMTP server",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full p-4">
      {/* SERVER STATUS */}
      <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
        <div className="mb-2 sm:mb-0">
          <label htmlFor="server-status" className="block">
            Server Status
          </label>

          <div className="flex items-center space-x-2">
            <div className="inline-grid *:[grid-area:1/1]">
              <div
                className={cn(
                  "status status-lg animate-ping",
                  isServerRunning ? "status-success" : "status-error",
                )}
              />
              <div
                className={cn(
                  "status status-lg",
                  isServerRunning ? "status-success" : "status-error",
                )}
              />
            </div>{" "}
            <span
              className={cn(
                "text-sm",
                isServerRunning ? "text-success" : "text-error",
              )}
            >
              {isServerRunning ? "Running" : "Stopped"}
            </span>
          </div>
        </div>

        <button
          className={cn("btn", isServerRunning ? "btn-error" : "btn-success")}
          onClick={
            isServerRunning
              ? () => handleToggleServer("stop")
              : () => handleToggleServer("start")
          }
          disabled={isLoading}
        >
          <span>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : isServerRunning ? (
              <PowerOff className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white" />
            )}
          </span>

          {isServerRunning ? (
            <span className="text-white">Stop Server</span>
          ) : (
            <span className="text-white">Start Server</span>
          )}
        </button>
      </div>

      {/* SMPT PORT */}
      <div className="mt-4 space-y-2">
        <label htmlFor="smtp-port" className="block">
          SMTP Port
        </label>
        <div className="flex space-x-2">
          <input
            id="smtp-port"
            type="number"
            className="input border border-solid"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            disabled={isServerRunning}
          />
          <button
            className="btn btn-outline"
            disabled={isServerRunning}
            onClick={() => setSmtpPort("2525")}
          >
            Reset
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Default port is 2525. You need to restart the server for changes to
          take effect.
        </p>
      </div>

      {/* SMTP CONFIG */}
      <div className="mt-4">
        <label className="mb-2 block">SMTP Configuration</label>
        <div className="bg-base-200 rounded-md p-2">
          <ul className="flex flex-col gap-1 text-sm">
            {[
              "Host: localhost",
              `Port: ${smtpPort}`,
              "Secure: false",
              "Auth: Not required (accepts any credentials)",
              "TLS: Not required",
            ].map((value: string, index: number) => (
              <li key={index}>{value}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
