-- CreateTable
CREATE TABLE "composed_emails" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT[],
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "composed_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_attachments" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "contentId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "composed_emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
