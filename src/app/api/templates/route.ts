import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';

import WelcomeEmail from '@/emails/welcome';
import { constructAndSaveEmail } from '@/services/server/email.service';

// GET: handler to preview email templates
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const template = searchParams.get('template') || 'welcome';
  const format = searchParams.get('format') || 'html';
  
  let emailComponent;
  let username = searchParams.get('username') || 'Developer';
  
  // Select template based on parameter
  switch (template) {
    case 'welcome':
    default:
      emailComponent = <WelcomeEmail username={username} />;
      break;
  }

  switch (format) {
    case 'html': {
      const html = await render(emailComponent);
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    case 'text': {
      const text = await render(emailComponent, { plainText: true });

      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
    default:
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }
}

// POST: handler to send a template email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, from, to, data } = body;
    
    if (!template || !from || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let emailComponent;
    
    // Select template based on parameter
    switch (template) {
      case 'welcome':
      default:
        emailComponent = <WelcomeEmail username={data?.username || 'Developer'} />;
        break;
    }
    
    const html = await render(emailComponent);
    const text = await render(emailComponent, { plainText: true });
    const result = await constructAndSaveEmail({
      from,
      to,
      subject: `Template: ${template}`,
      html,
      text,
    });
    
    if (result.success) {
      return NextResponse.json({ success: true, emailId: result.emailId });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending template email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
