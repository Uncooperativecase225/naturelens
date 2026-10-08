import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { cache: 'no-store', signal: AbortSignal.timeout(2500) });
    if (!response.ok) return NextResponse.json({ ok:false, model:MODEL, installed:false });
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models.map((m: {name?:string}) => m.name).filter(Boolean) : [];
    return NextResponse.json({ ok:true, model:MODEL, installed:models.includes(MODEL), models });
  } catch {
    return NextResponse.json({ ok:false, model:MODEL, installed:false });
  }
}
