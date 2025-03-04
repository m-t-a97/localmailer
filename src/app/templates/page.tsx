"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, BookTemplate as Template } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  template: z.string().min(1, { message: "Please select a template" }),
  from: z.string().email({ message: "Please enter a valid email address" }),
  to: z.string().min(1, { message: "Please enter at least one recipient" }),
  username: z.string().optional(),
});

export default function TemplatesPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template: "welcome",
      from: "sender@example.com",
      to: "recipient@example.com",
      username: "Developer",
    },
  });

  const updatePreview = () => {
    const template = form.getValues("template");
    const username = form.getValues("username");
    setPreviewUrl(
      `/api/templates?template=${template}&username=${encodeURIComponent(username || "Developer")}`
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Split comma-separated email addresses
      const toAddresses = values.to.split(",").map((email) => email.trim());

      const payload = {
        template: values.template,
        from: values.from,
        to: toAddresses,
        data: {
          username: values.username,
        },
      };

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Template email sent successfully",
          description: `Email ID: ${data.emailId}`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending template email:", error);
      toast({
        title: "Failed to send template email",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Template className="mr-2 h-5 w-5" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Send emails using pre-built React Email templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTimeout(updatePreview, 100);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome Email</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Username for the template"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setTimeout(updatePreview, 100);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be used in the template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-2"
                  onClick={updatePreview}
                >
                  Preview Template
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Template Email
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
            <CardDescription>
              Preview how your email template will look
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-md overflow-hidden h-[500px]">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  title="Email Template Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Click "Preview Template" to see how your email will look
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
