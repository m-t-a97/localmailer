"use client";

import { useEffect, useState } from "react";

type Props = {
  html: string;
};

export function EmailPreview({ html }: Props) {
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
    } catch (error: any) {
      console.error(error);
      setError("Error parsing HTML");
    }
  }, [html]);

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
