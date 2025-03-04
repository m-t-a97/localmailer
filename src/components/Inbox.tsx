"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Mail, RefreshCw, Search } from "lucide-react";

import EmailDetail from "@/components/EmailDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { StoredEmail } from "@/types";
import { toggleSmtpServer } from "@/services/client/smtp.service";
import { getAllEmails } from "@/services/client/email.service";
import { cn } from "@/lib/utils";

export function Inbox() {
  const [emails, setEmails] = useState<StoredEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<StoredEmail | null>(null);
  const [serverStarted, setServerStarted] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const emails = await getAllEmails();
      setEmails(emails);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const startServer = async () => {
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
        <div className="card bg-base-100 card-md w-full shadow-sm">
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
            <p>Your development email inbox</p>
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
            {loading ? (
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
                      "hover:bg-base-200 flex cursor-pointer items-start space-x-4 rounded-md p-2 transition-colors",
                      selectedEmail?.id === email.id ? "bg-muted" : "",
                    )}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="bg-base-300 flex h-10 w-10 items-center justify-center rounded-full">
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
                        {format(new Date(email.date), "PPp")}
                      </p>
                    </div>
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
          <div className="card bg-base-100 card-md h-full w-full shadow-sm">
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
