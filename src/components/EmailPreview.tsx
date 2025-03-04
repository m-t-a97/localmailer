"use client";

import { useEffect, useState } from "react";

interface EmailPreviewProps {
  html: string;
}

export function EmailPreview({ html }: EmailPreviewProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Basic validation - this won't catch all HTML errors
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      if (doc.querySelector("parsererror")) {
        setError("Invalid HTML");
      } else {
        setError(null);
      }
    } catch (e) {
      setError("Error parsing HTML");
    }
  }, [html]);

  if (!html) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Enter HTML content to see preview
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      title="Email Preview"
      className="w-full h-full border-0"
      sandbox="allow-same-origin"
    />
  );
}