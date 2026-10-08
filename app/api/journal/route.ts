import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

function fallback(body: { discoveries?: Array<{title?:string}>; minutes?:number; walks?:number }) {
  const names = (body.discoveries || []).slice(0,5).map(d => d.title).filter(Boolean);
  const list = names.length ? names.join(', ') : 'a few interesting details';
  return `This week you spent ${body.minutes || 0} minutes outside across ${body.walks || 0} walks. You noticed ${list}. NatureLens works best when each identification becomes another thing to notice, not another reason to stay on the screen. Next time, spend one minute observing before taking a photo.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = `You are the field-journal writer for NatureLens. Write a short reflective field note of 80-120 words from the supplied outdoor data. Do not invent species, weather, emotions, or locations. Mention uncertainty when an observation is low-confidence. End with one practical invitation to notice something outdoors next time. Return only the prose. Data: ${JSON.stringify({discoveries:body.discoveries || [], minutes:body.minutes || 0, walks:body.walks || 0})}`;
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:MODEL,stream:false,messages:[{role:'system',content:prompt},{role:'user',content:'Write the field note.'}],options:{temperature:0.45}}),
      signal:AbortSignal.timeout(30000)
    });
    if (!response.ok) return NextResponse.json({ story:fallback(body), mode:'demo' });
    const data = await response.json();
    const story = String(data.message?.content || '').trim();
    return NextResponse.json({ story:story || fallback(body), mode:'local' });
  } catch {
    return NextResponse.json({ story:fallback({}), mode:'demo' });
  }
}
