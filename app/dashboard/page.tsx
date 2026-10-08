'use client';

import { Activity, BadgeCheck, BrainCircuit, CheckCircle2, Leaf, MapPin, ShieldCheck, Trophy, Wind } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useNatureLens } from '@/lib/store';

// Leaflet touches `window`/`document` during init, so the discovery map must
// only load on the client. ssr:false also avoids a hydration mismatch where
// the server renders the "no data" placeholder and the client swaps in the map
// after IndexedDB loads — initializing Leaflet on that freshly-swapped,
// possibly zero-size mobile container is what threw `_leaflet_pos` errors.
const MapView = dynamic(() => import('@/components/MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="map-placeholder">
      <div>
        <div className="map-placeholder-icon">◉</div>
        <strong>Loading map…</strong>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  const { discoveries, explorations, stats, syncing, syncNow } = useNatureLens();
  const [health, setHealth] = useState<{ok:boolean;installed?:boolean;model?:string}>({ok:false});
  useEffect(() => { fetch('/api/health').then(r=>r.json()).then(setHealth).catch(()=>setHealth({ok:false})); }, []);
  const completed = explorations.filter(e=>e.status==='completed').length;
  const progress = Math.min(100, completed / 5 * 100);
  const categories = useMemo(() => discoveries.reduce<Record<string,number>>((acc,d)=>{acc[d.category]=(acc[d.category]||0)+1;return acc;},{}),[discoveries]);
  const badges = [
    {title:'First discovery', done:discoveries.length>=1, copy:'Save one observation.'},
    {title:'Touch Grass', done:stats.minutes>=60, copy:'Spend one hour outdoors.'},
    {title:'Pattern Finder', done:stats.tasksCompleted>=8, copy:'Complete eight quest tasks.'},
    {title:'Field Habit', done:completed>=5, copy:'Complete five walks.'}
  ];
  return <>
    <div className="topbar"><div><div className="kicker">Desktop companion</div><h1 style={{fontSize:36}}>Explorer dashboard</h1><p className="lead">The desktop view is for reviewing the walk. The outdoors is for doing the walk.</p></div><div className="topbar-actions"><button className="btn btn-secondary" onClick={syncNow} disabled={syncing}><Activity size={14}/> {syncing ? 'Syncing…' : 'Sync local vault'}</button><Link href="/explore" className="btn btn-primary"><Wind size={15}/> Start another walk</Link></div></div>
    <div className="stats">
      <div className="card stat"><div className="num">{stats.discoveries}</div><div className="label">discoveries</div></div>
      <div className="card stat"><div className="num">{stats.walks}</div><div className="label">walks</div></div>
      <div className="card stat"><div className="num">{stats.minutes}m</div><div className="label">outside time</div></div>
      <div className="card stat"><div className="num">Lv. {stats.level}</div><div className="label">explorer level</div></div>
    </div>
    <div className="dashboard-grid">
      <section className="card map-panel"><div className="panel-head"><div><div className="kicker">Discovery map</div><h2 style={{marginTop:5}}>Where you noticed things</h2></div><div className="badge"><MapPin size={12}/> Local coordinates</div></div><div className="map-card"><MapView discoveries={discoveries}/></div></section>
      <section className="card" style={{padding:18}}>
        <div className="kicker">Explorer progress</div><h2 style={{marginTop:6}}>Keep the habit alive</h2>
        <div className="metric-row"><span className="metric-label">5-walk milestone</span><span className="metric-value">{completed}/5</span></div><div className="progress"><i style={{width:`${progress}%`}} /></div>
        <div className="metric-row"><span className="metric-label">Plants & trees</span><span className="metric-value">{(categories.plant||0)+(categories.tree||0)}</span></div>
        <div className="metric-row"><span className="metric-label">Birds</span><span className="metric-value">{categories.bird||0}</span></div>
        <div className="metric-row"><span className="metric-label">Insects</span><span className="metric-value">{categories.insect||0}</span></div>
        <div className="metric-row"><span className="metric-label">Tasks completed</span><span className="metric-value">{stats.tasksCompleted}</span></div>
        <div className="card progress-note"><div className="badge"><Trophy size={12}/> Next badge</div><div style={{fontWeight:800,marginTop:8}}>{badges.find(b=>!b.done)?.title || 'Explorer legend'}</div><div className="small" style={{marginTop:4}}>{badges.find(b=>!b.done)?.copy || 'You completed the starter milestones.'}</div></div>
        <div className="actions"><Link className="btn btn-secondary" href="/discoveries">Open cabinet</Link></div>
      </section>
    </div>
    <section className="section grid-3">
      <div className="card dashboard-feature"><div className="feature-icon"><BrainCircuit size={18}/></div><div><div className="kicker">Local AI status</div><h3>{health.ok && health.installed ? 'Gemma is connected' : health.ok ? 'Ollama is reachable' : 'Ollama is not connected'}</h3><p>{health.model ? `Configured model: ${health.model}` : 'The app will use a safe fallback until local AI is available.'}</p></div></div>
      <div className="card dashboard-feature"><div className="feature-icon"><ShieldCheck size={18}/></div><div><div className="kicker">Privacy</div><h3>Your cabinet stays local</h3><p>Photos, discoveries and coordinates are stored in IndexedDB on this browser.</p></div></div>
      <div className="card dashboard-feature"><div className="feature-icon"><Activity size={18}/></div><div><div className="kicker">Attention metric</div><h3>{stats.tasksCompleted} outdoor prompts completed</h3><p>The app measures time outside and completed observations, not screen time.</p></div></div>
    </section>
    <section className="section card" style={{padding:18}}><div className="kicker">Badges</div><div className="badge-grid">{badges.map(b=><div className={`badge-card ${b.done?'done':''}`} key={b.title}><div className="badge-circle">{b.done ? <CheckCircle2 size={17}/> : <BadgeCheck size={17}/>}</div><div><strong>{b.title}</strong><div className="small">{b.copy}</div></div></div>)}</div></section>
    <section className="section grid-2"><div className="card" style={{padding:18}}><div className="kicker">Latest walk</div><h2 style={{marginTop:5}}>{explorations[0]?.minutes || 0} minutes outdoors</h2><p className="small" style={{lineHeight:1.6,marginTop:7}}>{explorations[0]?.discoveries || 0} discoveries · {explorations[0]?.focus || 'Everything'} · {explorations[0]?.difficulty || 'Explorer'}</p></div><div className="card" style={{padding:18}}><div className="kicker">Field principle</div><h2 style={{marginTop:5}}>Observe, then put it away.</h2><p className="small" style={{lineHeight:1.6,marginTop:7}}>NatureLens should make the screen useful for seconds and the environment interesting for minutes.</p></div></section>
    <div className="footer-note"><Leaf size={13} style={{verticalAlign:'middle'}}/> NatureLens is an exploration aid, not a definitive species-identification system.</div>
  </>;
}
