"use client";

type Props = {
  html: string;
};

export function EmailPreview({ html }: Props) {
  let doc: Document | null = null;
  if (html) {
    const parser = new DOMParser();
    try {
      doc = parser.parseFromString(html, "text/html");
    } catch (e) {
      console.error("DOMParser threw an exception:", e);
      doc = null;
    }
  }

  let error: string | null = null;
  if (html) {
    if (!doc) {
      error = "Error parsing HTML";
    } else if (doc.querySelector("parsererror")) {
      error = "Invalid HTML";
    }
  }

  if (!html) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        Enter HTML content to see preview
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive flex h-full items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="Email Preview"
      className="h-full w-full border-0"
      sandbox="allow-same-origin allow-scripts"
    />
  );
}
