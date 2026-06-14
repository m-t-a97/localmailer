"use client";

import { Download, FileText } from "lucide-react";
import { useState } from "react";

import { ComposedEmail, DateUtils, EmailAttachment } from "@repo/data-commons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

type Props = {
  email: ComposedEmail & { attachments?: EmailAttachment[] };
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useEmailAttachmentDownload() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadAttachment = async (attachment: EmailAttachment) => {
    setDownloadingId(attachment.id);
    try {
      const response = await fetch(`/api/attachments/${attachment.id}`);
      if (!response.ok) throw new Error("Failed to get download URL");

      const data = await response.json();
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to download attachment");
      console.error("Download error:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  return { downloadAttachment, downloadingId };
}

export default function EmailDetail({ email }: Props) {
  const displayDate = email.date
    ? DateUtils.format(new Date(email.date))
    : DateUtils.format(new Date(email.createdAt));
  const { downloadAttachment, downloadingId } = useEmailAttachmentDownload();

  return (
    <Card className="h-full w-full shadow-sm border-border/50">
      <CardContent>
        <CardTitle className="text-lg font-semibold mb-4">
          {email.subject}
        </CardTitle>

        <div className="mb-4 space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-14 shrink-0">From:</span>
            <span className="text-foreground">{email.from}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-14 shrink-0">To:</span>
            <span className="text-foreground">{email.to.join(", ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-14 shrink-0">Date:</span>
            <span className="text-foreground">{displayDate}</span>
          </div>
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="mb-4 space-y-1.5">
            <span className="text-sm text-muted-foreground font-medium">
              Attachments ({email.attachments.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att) => (
                <Button
                  key={att.id}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => downloadAttachment(att)}
                  disabled={downloadingId === att.id}
                >
                  <Download className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">{att.filename}</span>
                  <span className="text-muted-foreground">
                    ({formatFileSize(att.size)})
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="rendered">
          <TabsList className="mb-4">
            <TabsTrigger value="rendered">Rendered</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="plain-text">Plain Text</TabsTrigger>
          </TabsList>

          <TabsContent value="rendered">
            {email.html ? (
              <div className="rounded-xl border border-border/50 bg-background shadow-sm overflow-hidden">
                <iframe
                  srcDoc={email.html}
                  title="Email Preview"
                  className="min-h-[400px] w-full rounded-lg"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 p-4 whitespace-pre-wrap">
                {email.text}
              </div>
            )}
          </TabsContent>

          <TabsContent value="html">
            {email.html ? (
              <pre className="bg-muted/50 overflow-auto rounded-xl border border-border/50 p-4 text-sm shadow-sm">
                <code>{email.html}</code>
              </pre>
            ) : (
              <div className="border-2 border-dashed border-border/50 rounded-2xl flex h-[400px] items-center justify-center text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" />
                No HTML content available
              </div>
            )}
          </TabsContent>

          <TabsContent value="plain-text">
            <pre className="bg-muted/50 overflow-auto rounded-xl border border-border/50 p-4 text-sm shadow-sm whitespace-pre-wrap">
              <code>{email.text}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
