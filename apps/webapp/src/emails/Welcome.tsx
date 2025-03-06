import * as React from "react";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  username?: string;
}

export const WelcomeEmail = ({ username = "Developer" }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to LocalMailer!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to LocalMailer</Heading>
        <Text style={text}>Hello {username},</Text>
        <Text style={text}>
          Thank you for trying out our LocalMailer. This is a sample email
          template created with react-email.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href="https://github.com/resend/react-email">
            Learn more about React Email
          </Button>
        </Section>
        <Text style={text}>
          This email client allows you to test email sending functionality
          without connecting to real email services.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          This is a local development tool. No emails are actually sent to
          external recipients.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const buttonContainer = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#000",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "10px 20px",
};

const hr = {
  border: "none",
  borderTop: "1px solid #eee",
  margin: "26px 0",
  width: "100%",
};

const footer = {
  color: "#898989",
  fontSize: "12px",
  margin: "0",
};
