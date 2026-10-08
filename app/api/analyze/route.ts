import { NextResponse } from 'next/server';
import type { AIResult, DiscoveryCategory } from '@/lib/types';

const MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const categories: DiscoveryCategory[] = ['plant','flower','tree','bird','insect','leaf','fungus','rock','other'];

function fallback(): AIResult {
  return {
    identification:'Nature observation', category:'other', confidence:38, confidenceLevel:'low',
    summary:'Local AI is unavailable, so NatureLens is showing a safe demo result. Connect Ollama for image-aware analysis.',
    observations:['The app pipeline is working','No cloud AI service was contacted','Use an actual outdoor subject for the strongest test'],
    challenge:'Find one natural object that is using another surface for support.',
    lookAgain:'Describe its shape, texture and relationship to nearby objects before you move on.',
    recommendedCapture:'Move a little farther away and include the whole object in frame.',
    mysteryHints:['Look for repeated shapes or structures.','Notice how it relates to nearby objects.']
  };
}

function normalizeConfidence(value: unknown) {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 45;
  return Math.max(1, Math.min(99, raw <= 1 ? raw * 100 : raw));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const image = body?.image as string | undefined;
    const focus = body?.focus as string | undefined;
    const difficulty = body?.difficulty as string | undefined;
    const previous = body?.previous as Partial<AIResult> | undefined;
    if (!image) return NextResponse.json({ error:'Missing image payload.' }, { status:400 });

    const previousContext = previous ? `Previous observation: ${JSON.stringify({identification:previous.identification, observations:previous.observations})}. If this is a follow-up image, explain what additional evidence is visible now.` : '';
    const prompt = `You are NatureLens, an offline field-guide assistant. Analyze the supplied outdoor photograph. Focus: ${focus || 'Everything'}. Difficulty: ${difficulty || 'Explorer'}. ${previousContext}
Return ONLY valid JSON matching this schema:
{
  "identification": string,
  "category": "plant" | "flower" | "tree" | "bird" | "insect" | "leaf" | "fungus" | "rock" | "other",
  "confidence": number,
  "summary": string,
  "observations": string[],
  "challenge": string,
  "lookAgain": string,
  "recommendedCapture": string,
  "mysteryHints": string[],
  "safetyNote": string
}
Rules: confidence is 1-99, based only on visible evidence. Never claim certainty. If species-level evidence is weak, use a broad identification like "broadleaf plant" and low confidence. Do not guess species to sound useful. Prefer observable traits. Give 2-4 observations. Give 2 short mystery hints that help the user reason without naming the answer. The challenge must send attention back to the physical environment. Never tell the user to touch, taste, handle, approach, feed, climb, or disturb wildlife/plants. If the image is a person, room, screen, or unrelated object, say so and recommend pointing the camera outward.`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:MODEL,stream:false,format:'json',messages:[{role:'system',content:prompt},{role:'user',content:'Analyze this field observation.',images:[image]}],options:{temperature:0.15}}),
      signal:AbortSignal.timeout(60000)
    });

    if (!response.ok) return NextResponse.json({ result:fallback(), mode:'demo', warning:`Ollama returned HTTP ${response.status}.` });
    const data = await response.json();
    const parsed = JSON.parse(data.message?.content || '{}') as Partial<AIResult>;
    const confidence = normalizeConfidence(parsed.confidence);
    const safe: AIResult = {
      identification: parsed.identification || 'Nature observation',
      category: categories.includes(parsed.category as DiscoveryCategory) ? parsed.category as DiscoveryCategory : 'other',
      confidence,
      confidenceLevel: confidence >= 80 ? 'high' : confidence >= 55 ? 'medium' : 'low',
      summary: parsed.summary || 'The model returned a limited field note.',
      observations: Array.isArray(parsed.observations) ? parsed.observations.filter(Boolean).slice(0,4) : [],
      challenge: parsed.challenge || 'Look around and compare this with one nearby natural object.',
      lookAgain: parsed.lookAgain || 'Notice one new detail before moving on.',
      recommendedCapture: parsed.recommendedCapture || 'Include the whole subject and some surrounding context.',
      mysteryHints: Array.isArray(parsed.mysteryHints) ? parsed.mysteryHints.filter(Boolean).slice(0,3) : [],
      safetyNote: parsed.safetyNote
    };
    return NextResponse.json({ result:safe, mode:'local', model:MODEL });
  } catch (error) {
    return NextResponse.json({ result:fallback(), mode:'demo', warning:error instanceof Error ? error.message : 'Local AI unavailable.' });
  }
}
