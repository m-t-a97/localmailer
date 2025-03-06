export default function AboutApp() {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-medium">About This App</h3>
          <p>
            This is a local development email client that allows you to test
            email sending functionality without connecting to real email
            services.
          </p>
        </div>

        <div>
          <label className="mb-2 block font-medium">Features</label>
          <div className="px-2">
            <ul className="flex list-disc flex-col gap-2 pl-2 text-sm">
              <li>Local SMTP server for sending emails</li>
              <li>Email inbox to view sent messages</li>
              <li>HTML and plain text email support</li>
              <li>Email composition with preview</li>
              <li>API endpoints for programmatic access</li>
            </ul>
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium">API Endpoints</label>
          <div className="px-2">
            <ul className="flex list-disc flex-col gap-2 pl-2 text-sm">
              {[
                "GET /api/emails - Get all emails",
                "GET /api/emails?id=<email_id> - Get a specific email",
                "POST /api/emails - Send a new email",
                "GET /api/server - Get server status",
                "POST /api/server - Start/Stop SMTP server",
              ].map((value: string, index: number) => (
                <li key={index}>{value}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
