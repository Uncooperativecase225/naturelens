'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DiscoveryCard } from '@/components/DiscoveryCard';
import { useNatureLens } from '@/lib/store';

export default function DiscoveriesPage() {
  const { discoveries, ready, deleteDiscovery } = useNatureLens();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all'|'high'|'low'>('all');
  const filtered = useMemo(() => discoveries.filter(d => {
    const matchText = `${d.title} ${d.category} ${d.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    const level = d.confidenceLevel || (d.confidence >= 80 ? 'high' : d.confidence >= 55 ? 'medium' : 'low');
    const matchFilter = filter === 'all' || (filter === 'high' ? level === 'high' : level === 'low');
    return matchText && matchFilter;
  }), [discoveries, query, filter]);
  return <>
    <div className="topbar"><div><div className="kicker">Field cabinet</div><h1 style={{fontSize:36}}>Discoveries</h1><p className="lead">Your private collection of field observations, confidence levels, clues and saved photos.</p></div></div>
    <div className="card filter-bar"><div className="search-wrap"><Search size={17}/><input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search species, tags, observations…" /></div><div className="filter-actions"><SlidersHorizontal size={15}/><button className={filter==='all'?'filter-active':''} onClick={()=>setFilter('all')}>All</button><button className={filter==='high'?'filter-active':''} onClick={()=>setFilter('high')}>High confidence</button><button className={filter==='low'?'filter-active':''} onClick={()=>setFilter('low')}>Low confidence</button></div></div>
    {!ready ? <div className="card empty">Loading your local field cabinet…</div> : filtered.length ? <div className="grid-3">{filtered.map(d=><DiscoveryCard key={d.id} discovery={d} onDelete={deleteDiscovery}/>)}</div> : <div className="card empty"><div className="empty-result-icon">◌</div><strong>No matching discoveries</strong><div className="small">Try a different search or go outside and add a new observation.</div></div>}
  </>;
}
