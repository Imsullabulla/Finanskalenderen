import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { obligations as allObligations } from '@/data/obligations';
import { calculateAllDeadlines } from '@/utils/deadlineEngine';
import type { ReminderSettings } from '@/types/reminder';

interface DueObligation {
    name: string;
    deadline: Date;
    daysLeft: number;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('da-DK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function buildDigestHtml(items: DueObligation[], appUrl: string): string {
    const daysLeft = items[0].daysLeft;
    const urgencyText =
        daysLeft === 0 ? 'har frist i dag' :
        daysLeft === 1 ? 'er om 1 dag' :
        `er om ${daysLeft} dage`;

    const urgencyColor =
        daysLeft === 0 ? '#dc2626' :
        daysLeft <= 3  ? '#ea580c' :
        '#1b4332';

    const rows = items.map(item => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f0f0ee;">
                <div style="font-weight: 600; color: #1a1a1a; font-size: 14px;">${item.name}</div>
                <div style="color: #666; font-size: 13px; margin-top: 3px;">Frist: ${formatDate(item.deadline)}</div>
            </td>
        </tr>
    `).join('');

    const heading = items.length === 1
        ? `Følgende pligt ${urgencyText}:`
        : `${items.length} pligter ${urgencyText}:`;

    return `
        <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <div style="background: ${urgencyColor}; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #ffffff; font-size: 18px; margin: 0; letter-spacing: -0.02em;">
                    📋 Finanskalenderen – Deadline-påmindelse
                </h1>
            </div>
            <div style="background: #ffffff; padding: 32px; border: 1px solid #e8e8e6; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 15px; color: #444; line-height: 1.6; margin: 0 0 20px;">${heading}</p>
                <table style="width: 100%; border-collapse: collapse;">
                    ${rows}
                </table>
                <a href="${appUrl}"
                   style="display: inline-block; margin-top: 28px; background: #1b4332; color: #ffffff;
                          padding: 12px 24px; border-radius: 8px; text-decoration: none;
                          font-weight: 600; font-size: 14px;">
                    Åbn Finanskalenderen →
                </a>
                <p style="margin-top: 32px; font-size: 12px; color: #999; line-height: 1.6;">
                    Du modtager denne e-mail fordi du har aktiveret deadline-påmindelser i Finanskalenderen.<br>
                    Konfigurér via miljøvariablerne <code>REMINDER_DAYS</code> og <code>REMINDER_OBLIGATION_IDS</code>.
                </p>
            </div>
        </div>
    `;
}

export async function GET(req: NextRequest) {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Config — KV first, env vars as fallback ────────────────────────────
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://finanskalenderen.dk';

    let email: string | undefined;
    let reminderDays: number[] = [7, 3, 1];
    let allowedIds: Set<string> | null = null;

    try {
        const kvSettings = await kv.get<ReminderSettings>('reminder_settings');
        if (kvSettings) {
            if (!kvSettings.enabled) {
                return NextResponse.json({ ok: true, skipped: 'Reminders disabled in settings' });
            }
            email = kvSettings.email;
            reminderDays = (kvSettings.days ?? [7, 3, 1]).filter(d => d > 0);
            allowedIds = kvSettings.obligationIds ? new Set(kvSettings.obligationIds) : null;
        }
    } catch {
        // KV not configured — fall through to env vars
    }

    // Env var fallback
    if (!email) {
        email = process.env.REMINDER_EMAIL;
        reminderDays = (process.env.REMINDER_DAYS ?? '7,3,1')
            .split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
        allowedIds = process.env.REMINDER_OBLIGATION_IDS
            ? new Set(process.env.REMINDER_OBLIGATION_IDS.split(',').map(s => s.trim()).filter(Boolean))
            : null;
    }

    if (!email) return NextResponse.json({ error: 'No email configured (set in reminder settings or REMINDER_EMAIL env var)' }, { status: 503 });

    // ── 3. Filter obligations ─────────────────────────────────────────────────
    const relevant = allObligations.filter(o => {
        if (o.frequency === 'ad-hoc' || o.frequency === 'ongoing') return false;
        if (allowedIds && !allowedIds.has(o.id)) return false;
        return true;
    });

    // ── 4. Find obligations due in exactly N days ─────────────────────────────
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const maxDays = Math.max(...reminderDays, 0);
    const horizonMonths = Math.ceil((maxDays + 14) / 30) + 1;

    // bucket: daysLeft → DueObligation[]
    const buckets = new Map<number, DueObligation[]>();
    reminderDays.forEach(d => buckets.set(d, []));

    for (const obligation of relevant) {
        const deadlines = calculateAllDeadlines(obligation, now, horizonMonths, 12);
        for (const deadline of deadlines) {
            const deadlineMidnight = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
            const daysLeft = Math.round(
                (deadlineMidnight.getTime() - todayMidnight.getTime()) / 86_400_000
            );
            if (buckets.has(daysLeft)) {
                buckets.get(daysLeft)!.push({ name: obligation.name.da, deadline, daysLeft });
            }
        }
    }

    // ── 5. Send one digest email per non-empty bucket ─────────────────────────
    const results: { daysLeft: number; count: number; ok: boolean; error?: string }[] = [];

    for (const [daysLeft, items] of buckets) {
        if (items.length === 0) continue;

        const urgencyLabel =
            daysLeft === 0 ? 'frist i dag' :
            daysLeft === 1 ? 'om 1 dag' :
            `om ${daysLeft} dage`;

        const subject =
            items.length === 1
                ? `Deadline-påmindelse: ${items[0].name} – ${urgencyLabel}`
                : `${items.length} pligter ${urgencyLabel} – Finanskalenderen`;

        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'Finanskalenderen <noreply@finanskalenderen.dk>',
                    to: [email],
                    subject,
                    html: buildDigestHtml(items, appUrl),
                }),
            });

            results.push({
                daysLeft,
                count: items.length,
                ok: res.ok,
                ...(!res.ok && { error: String(res.status) }),
            });
        } catch (e) {
            results.push({ daysLeft, count: items.length, ok: false, error: String(e) });
        }
    }

    return NextResponse.json({
        ok: true,
        checkedAt: now.toISOString(),
        obligationsChecked: relevant.length,
        results,
    });
}
