"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { NewComposedEmail } from "@repo/data-commons";

import { EmailPreview } from "@/components/EmailPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendEmail } from "@/services/client/email.service";

const formSchema = z.object({
  from: z.string().email({ message: "Please enter a valid email address" }),
  to: z.string().min(1, { message: "Please enter at least one recipient" }),
  subject: z.string().min(1, { message: "Please enter a subject" }),
  html: z.string().min(1, { message: "Please enter html content" }),
  text: z.string().min(1, { message: "Please enter a message" }),
});
type FormSchema = z.infer<typeof formSchema>;

export default function ComposeEmailForm() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    formState: { isValid, errors },
    register,
    watch,
    reset,
    handleSubmit,
  } = useForm<FormSchema>({
    mode: "onChange",
    defaultValues: {
      from: "",
      to: "",
      subject: "",
      text: "",
      html: "",
    },
    resolver: zodResolver(formSchema),
  });

  const handleFormOnSubmit = async (formData: FormSchema): Promise<void> => {
    try {
      if (isValid) {
        setIsSubmitting(true);

        const toAddresses = formData.to.split(",").map((email) => email.trim());

        const emailData: NewComposedEmail = {
          from: formData.from,
          to: toAddresses,
          subject: formData.subject,
          text: formData.text,
          html: formData.html,
        };
        await sendEmail(emailData);

        toast.success("Email sent successfully");

        reset();
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border-border/50">
      <CardContent className="items-start text-left">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Mail className="h-5 w-5" />
          Compose Email
        </CardTitle>
        <p className="text-sm text-muted-foreground mb-6">
          Create and send a new email message
        </p>

        <form
          className="w-full space-y-5"
          onSubmit={handleSubmit(handleFormOnSubmit)}
        >
          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="from" className="text-sm font-medium text-foreground block">
                From
              </label>
              <Input
                type="email"
                placeholder="example@example.com"
                {...register("from")}
              />
              {errors.from && (
                <p className="text-xs text-destructive mt-1">
                  {errors.from.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="to" className="text-sm font-medium text-foreground block">
                To
              </label>
              <Input
                type="text"
                placeholder="example@example.com"
                {...register("to")}
              />
              {errors.to && (
                <p className="text-xs text-destructive mt-1">
                  {errors.to.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple recipients with commas
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-sm font-medium text-foreground block">
              Subject
            </label>
            <Input
              type="text"
              placeholder="Enter your subject"
              {...register("subject")}
            />
            {errors.subject && (
              <p className="text-xs text-destructive mt-1">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/30 p-6 space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="html" className="text-sm font-medium text-foreground block">
                  HTML Content
                </label>
                <Textarea
                  placeholder="Type your html content here..."
                  className="min-h-[300px]"
                  {...register("html")}
                />
                {errors.html && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.html.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Enter valid HTML for your email
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground block">
                  Preview
                </label>
                <div className="rounded-xl border border-border/50 bg-background p-4 shadow-sm min-h-[300px]">
                  <EmailPreview html={watch("html")} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="text" className="text-sm font-medium text-foreground block">
                Plain Text Fallback
              </label>
              <Textarea
                placeholder="Type your text here..."
                {...register("text")}
              />
              {errors.text && (
                <p className="text-xs text-destructive mt-1">
                  {errors.text.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                This will be shown in email clients that don&#39;t support HTML
              </p>
            </div>
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full h-11 text-base gap-2 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Email
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
