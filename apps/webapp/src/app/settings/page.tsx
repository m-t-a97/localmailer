import AboutApp from "@/components/settings/AboutApp";
import SmtpServerSettings from "@/components/settings/SmtpServerSettings";

export default function SettingsPage() {
  return (
    <div className="max-page-width p-6">
      <div className="card bg-base-100 card-md h-full w-full border shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Email Server Settings</h2>
          <p>Configure your local email development server</p>

          {/* Tabs */}
          <div role="tablist" className="tabs tabs-box gap-1">
            {/* Tab 1 */}
            <input
              type="radio"
              name="tabs"
              className="tab"
              aria-label="SMTP Server"
              defaultChecked
            />
            <div className="tab-content bg-base-100">
              <SmtpServerSettings />
            </div>

            {/* Tab 2 */}
            <input
              type="radio"
              name="tabs"
              className="tab"
              aria-label="About"
            />
            <div className="tab-content bg-base-100">
              <AboutApp />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
