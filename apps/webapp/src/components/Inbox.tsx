"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, RefreshCw, Search, Trash } from "lucide-react";

import { ComposedEmail, DateUtils } from "@repo/data-commons";

import EmailDetail from "@/components/EmailDetail";
import Skeleton from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { deleteEmailById, getAllEmails } from "@/services/client/email.service";
import { toggleSmtpServer } from "@/services/client/smtp.service";

const EMAILS_QUERY_KEY = ["emails"] as const;

export function Inbox() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<ComposedEmail | null>(null);
  const [serverStarted, setServerStarted] = useState<boolean>(false);

  const {
    data: emails = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: EMAILS_QUERY_KEY,
    queryFn: getAllEmails,
    refetchInterval: 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmailById,
    onMutate: async (emailId: string) => {
      await queryClient.cancelQueries({ queryKey: EMAILS_QUERY_KEY });

      const previousEmails = queryClient.getQueryData<ComposedEmail[]>(EMAILS_QUERY_KEY);
      const previousSelected = selectedEmail;

      queryClient.setQueryData<ComposedEmail[]>(EMAILS_QUERY_KEY, (old) =>
        old ? old.filter((email) => email.id !== emailId) : [],
      );

      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }

      return { previousEmails, previousSelected };
    },
    onError: (_error, _emailId, context) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(EMAILS_QUERY_KEY, context.previousEmails);
      }
      if (context?.previousSelected) {
        setSelectedEmail(context.previousSelected);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EMAILS_QUERY_KEY });
    },
  });

  useEffect(() => {
    const startServer = async (): Promise<void> => {
      try {
        await toggleSmtpServer("start");
        setServerStarted(true);
      } catch (error) {
        console.error("Failed to start server:", error);
      }
    };

    startServer();
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
        <Card className="min-h-75 w-full shadow-sm border-border/50">
          <CardContent>
            <div className="flex items-center justify-between">
              <CardTitle>
                <h2 className="text-lg font-semibold">Inbox</h2>
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 mb-4">
              <p className="text-sm text-muted-foreground mb-2">Your development email inbox</p>
              <div className="relative">
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search emails..."
                  className="pl-10 bg-muted/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-start space-x-4 rounded-lg border border-border/50 p-3"
                  >
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-3 w-[60%]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEmails.length > 0 ? (
              <div className="space-y-2">
                {filteredEmails.map((email) => {
                  const isDeletingThis =
                    deleteMutation.isPending && deleteMutation.variables === email.id;

                  return (
                    <div
                      key={email.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5",
                        selectedEmail?.id === email.id
                          ? "border-l-2 border-primary bg-accent/50 shadow-sm"
                          : "border-l-2 border-transparent hover:bg-accent/30",
                      )}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="text-primary h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium leading-none">{email.subject}</p>
                        <p className="text-muted-foreground truncate text-xs">{email.from}</p>
                        <p className="text-muted-foreground/60 text-xs">
                          {DateUtils.format(new Date(email.createdAt))}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(email.id);
                        }}
                        disabled={isDeletingThis}
                      >
                        {isDeletingThis ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No emails found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {searchTerm ? "Try a different search term" : "Send an email to see it here"}
                </p>
              </div>
            )}

            <CardFooter className="justify-end px-0 pb-0 pt-4">
              <p className="text-xs text-muted-foreground/70">
                SMTP server {serverStarted ? "running" : "not running"} on port 2525
              </p>
            </CardFooter>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        {selectedEmail ? (
          <EmailDetail email={selectedEmail} />
        ) : (
          <div className="border-2 border-dashed border-border/50 rounded-2xl min-h-82.5 w-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Mail className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Select an email to view</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Click on an email from the inbox to view its contents
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
