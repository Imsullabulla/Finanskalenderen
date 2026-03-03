import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import type { ReminderSettings } from '@/types/reminder';

const KV_KEY = 'reminder_settings';

export async function GET() {
    try {
        const settings = await kv.get<ReminderSettings>(KV_KEY);
        return NextResponse.json(settings ?? null);
    } catch {
        return NextResponse.json(null);
    }
}

export async function POST(req: NextRequest) {
    let body: Partial<ReminderSettings>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { email, days, obligationIds, enabled } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!Array.isArray(days) || days.length === 0) {
        return NextResponse.json({ error: 'At least one reminder day is required' }, { status: 400 });
    }

    const settings: ReminderSettings = {
        email: email.trim().toLowerCase(),
        days: days.filter((d): d is number => typeof d === 'number' && d > 0).sort((a, b) => b - a),
        obligationIds: Array.isArray(obligationIds) && obligationIds.length > 0 ? obligationIds : null,
        enabled: enabled !== false,
    };

    try {
        await kv.set(KV_KEY, settings);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to save settings: ' + String(e) }, { status: 500 });
    }
}
