"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { EmailPreview } from "@/components/EmailPreview";

const formSchema = z.object({
  from: z.string().email({ message: "Please enter a valid email address" }),
  to: z.string().min(1, { message: "Please enter at least one recipient" }),
  subject: z.string().min(1, { message: "Please enter a subject" }),
  html: z.string().optional(),
  text: z.string().min(1, { message: "Please enter a message" }),
});
type FormSchema = z.infer<typeof formSchema>;

export default function ComposePage() {
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [emailType, setEmailType] = useState<"plain" | "html">("plain");

  const form = useForm<FormSchema>({
    defaultValues: {
      from: "",
      to: "",
      subject: "",
      text: "",
      html: "",
    },
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormSchema): Promise<void> => {
    setIsSubmitting(true);
    try {
      const toAddresses = values.to.split(",").map((email) => email.trim());

      const payload = {
        from: values.from,
        to: toAddresses,
        subject: values.subject,
        text: values.text,
        html: emailType === "html" ? values.html : undefined,
      };

      const response = await fetch("/api/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Email sent successfully",
          description: `Email ID: ${data.emailId}`,
        });

        // Reset form if needed
        if (emailType === "plain") {
          form.reset();
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to send email",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-page-width p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Compose Email
          </CardTitle>
          <CardDescription>Create and send a new email message</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input placeholder="recipient@email.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Separate multiple recipients with commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Tabs
                defaultValue="plain"
                onValueChange={(value) =>
                  setEmailType(value as "plain" | "html")
                }
                className="w-full"
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="plain">Plain Text</TabsTrigger>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                </TabsList>
                <TabsContent value="plain">
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Type your message here..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="html">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <FormField
                        control={form.control}
                        name="html"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HTML Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="<h1>Hello World</h1><p>This is an HTML email</p>"
                                className="min-h-[300px] font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter valid HTML for your email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormLabel>Preview</FormLabel>
                      <div className="min-h-[300px] rounded-md border bg-white p-4">
                        <EmailPreview html={form.watch("html") || ""} />
                      </div>
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Plain Text Fallback</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Fallback text for email clients that don't support HTML"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will be shown in email clients that don't support
                          HTML
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
