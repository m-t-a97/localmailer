"use client";

import { FileText } from "lucide-react";

import { ComposedEmail, DateUtils } from "@repo/data-commons";

type Props = {
  email: ComposedEmail;
};

export default function EmailDetail({ email }: Props) {
  return (
    <div className="card bg-base-100 card-md h-full w-full border shadow-sm">
      <div className="card-body">
        <h2 className="card-title">{email.subject}</h2>
        <div>
          <div className="mb-2 flex flex-col gap-1">
            <p>From: {email.from}</p>
            <p>To: {email.to.join(", ")}</p>
            <p>
              Date:&nbsp;
              {DateUtils.format(new Date(email.createdAt))}
            </p>
          </div>

          {/* Tabs */}
          <div role="tablist" className="tabs tabs-box gap-1">
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

          {/* TODO: Implement email attachments */}
        </div>
      </div>
    </div>
  );
}
