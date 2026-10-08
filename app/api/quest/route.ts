import { NextResponse } from 'next/server';
import type { OutdoorQuest } from '@/lib/types';

const MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

function fallbackQuest(focus: string, difficulty: string): OutdoorQuest {
  const focusLine = focus === 'Plants' ? 'Focus on leaves, flowers, bark and plant structure.' : focus === 'Wildlife' ? 'Focus on birds, insects, tracks and other signs of animal life without touching or approaching wildlife.' : 'Notice plants, wildlife, textures, sounds and small patterns around you.';
  const level = difficulty === 'Expert' ? 'Compare details carefully' : difficulty === 'Easy' ? 'Keep it simple and observable' : 'Look for patterns and contrasts';
  return {
    title:'Look Closer',
    intro:`${focusLine} ${level}. The goal is not to collect screens; it is to notice the physical world.`,
    tasks:[
      'Find two natural objects with noticeably different textures.',
      'Notice one sign that an animal or insect has been nearby, without disturbing it.',
      'Find one shape, color or pattern that repeats in a different part of your surroundings.',
      'Pause for 30 seconds and write down one detail you would have missed yesterday.'
    ]
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const focus = body?.focus || 'Everything';
    const difficulty = body?.difficulty || 'Explorer';
    const fallback = fallbackQuest(focus, difficulty);
    const prompt = `You are NatureLens, an offline outdoor quest designer. Create a safe, realistic observation quest for a ${String(difficulty).toLowerCase()} walk focused on ${String(focus).toLowerCase()}. Return ONLY valid JSON: {"title":string,"intro":string,"tasks":string[]}. Return exactly 4 short tasks. Tasks must require looking, listening, comparing, or walking outdoors; no dangerous climbing, touching wildlife, tasting plants, entering restricted areas, or internet. The tasks should be doable with a phone mostly put away.`;
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:MODEL,stream:false,format:'json',messages:[{role:'system',content:prompt},{role:'user',content:'Generate my field quest.'}],options:{temperature:0.7}}),
      signal:AbortSignal.timeout(30000)
    });
    if (!response.ok) return NextResponse.json({quest:fallback,mode:'demo'});
    const data = await response.json();
    const parsed = JSON.parse(data.message?.content || '{}');
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks.filter((x: unknown) => typeof x === 'string').slice(0,4) : [];
    return NextResponse.json({quest:{title:parsed.title || fallback.title,intro:parsed.intro || fallback.intro,tasks:tasks.length === 4 ? tasks : fallback.tasks},mode:'local'});
  } catch {
    return NextResponse.json({quest:fallbackQuest('Everything','Explorer'),mode:'demo'});
  }
}
