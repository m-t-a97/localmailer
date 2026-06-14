"use client";

import { FileText } from "lucide-react";

import { ComposedEmail, DateUtils } from "@repo/data-commons";

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

type Props = {
  email: ComposedEmail;
};

export default function EmailDetail({ email }: Props) {
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
            <span className="text-foreground">
              {DateUtils.format(new Date(email.createdAt))}
            </span>
          </div>
        </div>

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
