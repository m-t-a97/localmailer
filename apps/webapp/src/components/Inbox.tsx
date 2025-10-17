"use client";

import { useEffect, useState } from "react";

import { Mail, RefreshCw, Search, Trash } from "lucide-react";

import { ComposedEmail, DateUtils } from "@repo/data-commons";

import EmailDetail from "@/components/EmailDetail";
import Skeleton from "@/components/Skeleton";
import { cn } from "@/lib/utils";
import { getAllEmails, deleteEmailById } from "@/services/client/email.service";
import { toggleSmtpServer } from "@/services/client/smtp.service";

export function Inbox() {
  const [emails, setEmails] = useState<ComposedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<ComposedEmail | null>(
    null,
  );
  const [serverStarted, setServerStarted] = useState(false);

  const fetchEmails = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const emails = await getAllEmails();
      setEmails(emails);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmail = async (emailId: string): Promise<void> => {
    try {
      setIsLoading(true);
      await deleteEmailById(emailId);
      setEmails((prevEmails) =>
        prevEmails.filter((email) => email.id !== emailId),
      );
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error("Failed to delete email:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startServer = async (): Promise<void> => {
    try {
      await toggleSmtpServer("start");
      setServerStarted(true);
    } catch (error) {
      console.error("Failed to start server:", error);
    }
  };

  useEffect(() => {
    startServer();
    fetchEmails();
  }, []);

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.text.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="md:col-span-1">
        <div className="card bg-base-100 card-md min-h-[300px] w-full border shadow-sm">
          <div className="card-body">
            <div className="card-title">
              <h2>Inbox</h2>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={fetchEmails}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div>
              <p className="mb-2">Your development email inbox</p>
              <label className="input w-full border border-solid border-gray-300">
                <Search className="text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  className="grow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </label>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-4 py-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[160px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEmails.length > 0 ? (
              <div className="space-y-2">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    className={cn(
                      "flex cursor-pointer items-start space-x-4 rounded-md p-2 transition-colors hover:bg-blue-100",
                      selectedEmail?.id === email.id ? "bg-blue-50" : "",
                    )}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                      <Mail className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="leading-none font-medium">
                        {email.subject}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {email.from}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {DateUtils.format(new Date(email.createdAt))}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cursor-pointer rounded-md p-2 hover:bg-red-100"
                      onClick={() => handleDeleteEmail(email.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="loading loading-spinner" />
                      ) : (
                        <Trash className="text-error h-5 w-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                <Mail className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No emails found</p>
                <p className="text-sm">
                  {searchTerm
                    ? "Try a different search term"
                    : "Send an email to see it here"}
                </p>
              </div>
            )}

            <div className="card-actions justify-end">
              <p className="text-muted-foreground text-xs">
                SMTP server {serverStarted ? "running" : "not running"} on port
                2525
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        {selectedEmail ? (
          <EmailDetail email={selectedEmail} />
        ) : (
          <div className="card card-md bg-base-100 min-h-[330px] w-full border shadow-sm">
            <div className="card-body grid place-items-center">
              <h2 className="card-title">
                <p className="text-muted-foreground text-center">
                  Select an email to view
                </p>
              </h2>
              <Mail className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-muted-foreground">
                Click on an email from the inbox to view its contents
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
