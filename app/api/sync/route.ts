import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Discovery, Exploration } from '@/lib/types';

export const runtime = 'nodejs';

const dir = path.join(process.cwd(), '.naturelens');
const file = path.join(dir, 'local-vault.json');

async function readVault(): Promise<{discoveries:Discovery[]; explorations:Exploration[]}> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      discoveries: Array.isArray(parsed.discoveries) ? parsed.discoveries : [],
      explorations: Array.isArray(parsed.explorations) ? parsed.explorations : []
    };
  } catch {
    return {discoveries:[], explorations:[]};
  }
}

async function writeVault(discoveries: Discovery[], explorations: Exploration[]) {
  await fs.mkdir(dir, { recursive:true });
  const temp = `${file}.tmp`;
  await fs.writeFile(temp, JSON.stringify({updatedAt:new Date().toISOString(), discoveries, explorations}, null, 2), 'utf8');
  await fs.rename(temp, file);
}

export async function GET() {
  const vault = await readVault();
  return NextResponse.json({ ...vault, localOnly:true });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type');
  if (!id || type !== 'discovery') return NextResponse.json({error:'Missing discovery id.'},{status:400});
  const current = await readVault();
  await writeVault(current.discoveries.filter(d => d.id !== id), current.explorations);
  return NextResponse.json(await readVault());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = await readVault();
    const discoveries = Array.isArray(body.discoveries) ? body.discoveries as Discovery[] : current.discoveries;
    const explorations = Array.isArray(body.explorations) ? body.explorations as Exploration[] : current.explorations;
    await writeVault(deduplicate(discoveries, 'id'), deduplicate(explorations, 'id'));
    const saved = await readVault();
    return NextResponse.json({ ...saved, localOnly:true });
  } catch {
    return NextResponse.json({ error:'Local vault sync failed.' }, {status:500});
  }
}

function deduplicate<T extends Record<string, unknown>>(items:T[], key: keyof T):T[] {
  const map = new Map<unknown,T>();
  for (const item of items) map.set(item[key], item);
  return [...map.values()];
}
