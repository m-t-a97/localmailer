import AboutApp from "@/components/settings/AboutApp";
import SmtpServerSettings from "@/components/settings/SmtpServerSettings";
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

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="h-full w-full shadow-sm border-border/50">
        <CardContent>
          <div className="border-b border-border/50 pb-4 mb-4">
            <CardTitle className="text-xl font-semibold">
              Email Server Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure your local email development server
            </p>
          </div>

          <Tabs defaultValue="smtp-server">
            <TabsList className="mb-4">
              <TabsTrigger value="smtp-server">SMTP Server</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="smtp-server">
              <SmtpServerSettings />
            </TabsContent>

            <TabsContent value="about">
              <AboutApp />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
