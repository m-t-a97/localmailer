"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { NewComposedEmail } from "@repo/data-commons";

import { EmailPreview } from "@/components/EmailPreview";
import { useToast } from "@/hooks/useToast";
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
  const { toastCustom } = useToast();

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

        toastCustom({
          title: "Success",
          description: `Email sent successfully`,
          variant: "success",
        });

        // Reset the form after successful submission
        reset();
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toastCustom({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 w-full border shadow-sm">
      <div className="card-body items-center text-center">
        <h2 className="card-title">
          <Mail className="mr-2 h-5 w-5" />
          Compose Email
        </h2>
        <p className="mb-5">Create and send a new email message</p>

        <form
          className="w-full space-y-6"
          onSubmit={handleSubmit(handleFormOnSubmit)}
        >
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="from" className="block text-left">
                From
              </label>
              <input
                type="email"
                placeholder="example@example.com"
                className="input w-full border border-solid border-gray-300"
                {...register("from")}
              />
              {errors.from && (
                <p className="text-error text-left text-sm">
                  {errors.from.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="to" className="block text-left">
                To
              </label>
              <input
                type="text"
                placeholder="example@example.com"
                className="input w-full border border-solid border-gray-300"
                {...register("to")}
              />
              {errors.to && (
                <p className="text-error text-left text-sm">
                  {errors.to.message}
                </p>
              )}
              <p>Separate multiple recipients with commas</p>
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-left">
              Subject
            </label>
            <input
              type="text"
              placeholder="Enter your subject"
              className="input w-full border border-solid border-gray-300"
              {...register("subject")}
            />
            {errors.subject && (
              <p className="text-error text-left text-sm">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div className="bg-base-200 p-5">
            <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div>
                  <label htmlFor="html" className="block">
                    HTML Content
                  </label>
                  <textarea
                    placeholder="Type your html content here..."
                    className="textarea min-h-75 w-full border border-solid border-gray-300"
                    {...register("html")}
                  />
                  {errors.html && (
                    <p className="text-error text-center text-sm">
                      {errors.html.message}
                    </p>
                  )}
                  <p>Enter valid HTML for your email</p>
                </div>
              </div>

              <div>
                <label className="block">Preview</label>
                <div className="min-h-75 rounded-md border bg-white p-4">
                  <EmailPreview html={watch("html")} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block">
                Plain Text Fallback
              </label>
              <textarea
                placeholder="Type your text here..."
                className="textarea w-full border border-solid border-gray-300"
                {...register("text")}
              />
              {errors.text && (
                <p className="text-error text-center text-sm">
                  {errors.text.message}
                </p>
              )}
              <p>
                This will be shown in email clients that don&#39;t support HTML
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success w-full"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex flex-row items-center text-white">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex flex-row items-center text-white">
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
