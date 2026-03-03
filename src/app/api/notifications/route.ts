import { NextRequest, NextResponse } from 'next/server';

interface NotificationPayload {
  to: string;
  obligationName: string;
  deadline: string;
  daysLeft: number;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  let body: NotificationPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { to, obligationName, deadline, daysLeft } = body;
  if (!to || !obligationName || !deadline) {
    return NextResponse.json({ error: 'Missing required fields: to, obligationName, deadline' }, { status: 400 });
  }

  const urgencyText = daysLeft <= 0
    ? 'er overskredet'
    : daysLeft === 1
      ? 'er om 1 dag'
      : `er om ${daysLeft} dage`;

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="background: #1b4332; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; font-size: 18px; margin: 0; letter-spacing: -0.02em;">
          📋 Finanskalenderen – Deadline-påmindelse
        </h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e8e8e6; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; font-weight: 600; color: #1b4332; margin-bottom: 8px;">
          ${obligationName}
        </p>
        <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">
          Fristen for <strong>${obligationName}</strong> ${urgencyText}.<br>
          Deadline: <strong>${deadline}</strong>
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://finanskalenderen.dk'}"
           style="display: inline-block; background: #1b4332; color: #ffffff; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Åbn Finanskalenderen →
        </a>
        <p style="margin-top: 32px; font-size: 12px; color: #999;">
          Du modtager denne e-mail fordi du har aktiveret deadline-påmindelser i Finanskalenderen.
        </p>
      </div>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Finanskalenderen <noreply@finanskalenderen.dk>',
        to: [to],
        subject: `Deadline-påmindelse: ${obligationName} ${urgencyText}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: 'Resend API error', details: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email', details: String(err) }, { status: 500 });
  }
}
