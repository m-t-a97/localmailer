"use client";

import { format } from "date-fns";
import { Download, FileText, Paperclip } from "lucide-react";

import { StoredEmail } from "@/types";

type Props = {
  email: StoredEmail;
};

export default function EmailDetail({ email }: Props) {
  // Function to create a download link for attachments
  const createDownloadLinkForAttachment = (attachment: {
    filename: string;
    content: Buffer;
    contentType: string;
  }) => {
    const blob = new Blob([attachment.content], {
      type: attachment.contentType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = attachment.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card bg-base-100 card-md h-full w-full shadow-sm">
      <div className="card-body">
        <h2 className="card-title">{email.subject}</h2>
        <div>
          <p>
            From: {email.from} • To: {email.to.join(", ")} •{" "}
            {format(new Date(email.date), "PPp")}
          </p>

          {/* Tabs */}
          <div role="tablist" className="tabs tabs-box">
            {/* Tab 1 */}
            <input
              type="radio"
              name="tabs"
              className="tab"
              aria-label="Rendered"
              defaultChecked
            />
            <div className="tab-content bg-base-100 p-5">
              {email.html ? (
                <div className="rounded-md border p-4">
                  <iframe
                    srcDoc={email.html}
                    title="Email Preview"
                    className="min-h-[400px] w-full"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <div className="rounded-md border p-4 whitespace-pre-wrap">
                  {email.text}
                </div>
              )}
            </div>

            {/* Tab 2 */}
            <input type="radio" name="tabs" className="tab" aria-label="HTML" />
            <div className="tab-content bg-base-100 p-5">
              {email.html ? (
                <pre className="bg-muted overflow-auto rounded-md p-4 text-sm">
                  <code>{email.html}</code>
                </pre>
              ) : (
                <div className="text-muted-foreground flex h-[400px] items-center justify-center">
                  <FileText className="mr-2 h-4 w-4" />
                  No HTML content available
                </div>
              )}
            </div>

            {/* Tab 3 */}
            <input
              type="radio"
              name="tabs"
              className="tab"
              aria-label="Plain Text"
            />
            <div className="tab-content bg-base-100 p-5">
              <pre className="bg-muted overflow-auto rounded-md p-4 text-sm whitespace-pre-wrap">
                <code>{email.text}</code>
              </pre>
            </div>
          </div>

          {/* Email Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <>
              <div className="divider my-4" />

              <div>
                <h3 className="mb-2 flex items-center font-medium">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Attachments ({email.attachments.length})
                </h3>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {email.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        <span className="max-w-[200px] truncate text-sm">
                          {attachment.filename}
                        </span>
                      </div>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() =>
                          createDownloadLinkForAttachment(attachment)
                        }
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
