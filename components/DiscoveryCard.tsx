'use client';

import { MapPin, Trash2 } from 'lucide-react';
import type { Discovery } from '@/lib/types';

function confidenceLabel(d: Discovery) {
  return d.confidenceLevel || (d.confidence >= 80 ? 'high' : d.confidence >= 55 ? 'medium' : 'low');
}

export function DiscoveryCard({ discovery, onDelete }: { discovery: Discovery; onDelete?: (id: string) => void }) {
  const theme = discovery.category === 'bird' ? 'bird' : (discovery.category === 'plant' || discovery.category === 'tree' || discovery.category === 'flower') ? 'flower' : discovery.category === 'leaf' ? 'leaf' : '';
  const hasImage = Boolean(discovery.image);
  const confidence = confidenceLabel(discovery);
  return (
    <article className="card discovery-card">
      <div className={`thumb ${theme} ${hasImage ? 'has-image' : ''}`}>
        {hasImage && <img src={discovery.image} alt="Field observation" />}
        {hasImage && <div className="thumb-shade" />}
        <div className="thumb-symbol">{discovery.emoji}</div>
        <div className={`badge badge-${confidence}`}>{confidence} confidence · {Math.round(discovery.confidence)}%</div>
      </div>
      <div className="discovery-body">
        <div className="discovery-line"><div><div className="discovery-name">{discovery.title}</div><div className="discovery-meta">{discovery.date} · {discovery.time} · {discovery.category}</div></div>{onDelete && <button className="icon-btn subtle" title="Delete discovery" onClick={() => onDelete(discovery.id)}><Trash2 size={14}/></button>}</div>
        {typeof discovery.lat === 'number' && <div className="location-line"><MapPin size={12}/> Location saved locally</div>}
        <div className="tag-row">{discovery.tags.slice(0,4).map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
        <div className="challenge"><strong>Look closer:</strong> {discovery.challenge}</div>
      </div>
    </article>
  );
}
