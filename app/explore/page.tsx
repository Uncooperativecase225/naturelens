'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { Camera, Check, CircleStop, Crosshair, Eye, Info, Loader2, MapPin, Pause, Play, RotateCcw, ShieldCheck, Sparkles, Target, Upload, WandSparkles } from 'lucide-react';
import { useNatureLens } from '@/lib/store';
import type { AIResult, Discovery, OutdoorQuest } from '@/lib/types';

const demos: AIResult[] = [
  { identification:'Neem tree', category:'tree', confidence:82, confidenceLevel:'high', summary:'The image appears consistent with a neem tree, but this is still a visual hypothesis.', observations:['Compound leaflets with serrated edges','Dense branching canopy','Woody structure visible in the frame'], challenge:'Find another nearby tree with a different leaf arrangement.', lookAgain:'Count the leaflets on one leaf before you put the phone away.', recommendedCapture:'Include a branch, several leaves and some bark.', mysteryHints:['Look at the repeated leaflet pattern.','Compare the leaf edge with another nearby tree.'] },
  { identification:'Hibiscus', category:'flower', confidence:91, confidenceLevel:'high', summary:'The flower structure is strongly consistent with hibiscus.', observations:['Five broad petals','Prominent central staminal column','Broad green leaves below the bloom'], challenge:'Find a flower nearby with a different petal count.', lookAgain:'Trace the flower structure with your eyes instead of zooming the photo.', recommendedCapture:'Photograph one full bloom and the leaves around it.', mysteryHints:['Count the petals.','Look carefully at the central structure.'] },
  { identification:'Broadleaf plant', category:'plant', confidence:34, confidenceLevel:'low', summary:'The leaf shape is visible, but there is not enough context for a reliable species-level identification.', observations:['Oval to elliptical leaf','Smooth-looking margin','Pinnate venation is visible'], challenge:'Find another leaf with a noticeably different edge shape.', lookAgain:'Photograph the whole plant so the stem and leaf arrangement are visible.', recommendedCapture:'Step back and include the whole plant.', mysteryHints:['Compare the leaf edge.','Look at how the leaves attach to the stem.'] }
];

function formatTime(seconds:number) {
  const m = Math.floor(seconds/60).toString().padStart(2,'0');
  const s = Math.max(0, seconds%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function confidenceInfo(result: AIResult) {
  const level = result.confidenceLevel || (result.confidence >= 80 ? 'high' : result.confidence >= 55 ? 'medium' : 'low');
  return { level, label: level === 'high' ? 'High confidence' : level === 'medium' ? 'Medium confidence' : 'Low confidence' };
}

function emojiFor(category: Discovery['category']) {
  if (category === 'bird') return '🐦';
  if (category === 'insect') return '🪲';
  if (category === 'flower') return '🌺';
  if (category === 'leaf') return '🍃';
  if (category === 'tree') return '🌳';
  if (category === 'plant') return '🌿';
  if (category === 'fungus') return '🍄';
  if (category === 'rock') return '🪨';
  return '🔎';
}

export default function ExplorePage() {
  const { addDiscovery, addExploration } = useNatureLens();
  const [minutes, setMinutes] = useState(30);
  const [focus, setFocus] = useState<'Everything' | 'Plants' | 'Wildlife'>('Everything');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Explorer' | 'Expert'>('Explorer');
  const [mysteryMode, setMysteryMode] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState(30*60);
  const [quest, setQuest] = useState<OutdoorQuest | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [result, setResult] = useState<AIResult | null>(null);
  const [revealed, setRevealed] = useState(!mysteryMode);
  const [loading, setLoading] = useState(false);
  const [startingQuest, setStartingQuest] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [location, setLocation] = useState<{lat:number;lng:number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle'|'requesting'|'ready'|'denied'>('idle');
  const [lastImage, setLastImage] = useState<string | undefined>();
  const [previousResult, setPreviousResult] = useState<AIResult | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [savedThisSession, setSavedThisSession] = useState(0);
  const [aiMode, setAiMode] = useState<'local'|'demo'|'unknown'>('unknown');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
  }, []);

  useEffect(() => {
    if (!started || paused || finished || remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining(v => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, paused, finished, remaining]);

  useEffect(() => {
    if (started && remaining === 0 && !finished) finishWalk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, started, finished]);

  const fallbackQuest: OutdoorQuest = useMemo(() => ({
    title:'Look Closer', intro:'A short observation mission. The goal is not to collect screens; it is to notice patterns around you.',
    tasks:['Find two natural objects with different textures.','Find one sign that an animal or insect has been nearby, without disturbing it.','Find one repeating color, shape or pattern outdoors.','Notice one detail you would have missed yesterday.']
  }), []);

  const generateQuest = async () => {
    setStartingQuest(true);
    try {
      const res = await fetch('/api/quest', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({focus,difficulty})});
      const data = await res.json();
      setQuest(data.quest || fallbackQuest);
    } catch {
      setQuest(fallbackQuest);
    } finally { setStartingQuest(false); }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('denied'); return; }
    setLocationStatus('requesting');
    const success = (p: GeolocationPosition) => { setLocation({lat:p.coords.latitude,lng:p.coords.longitude}); setLocationStatus('ready'); };
    const failure = () => setLocationStatus('denied');
    navigator.geolocation.getCurrentPosition(success, failure, {enableHighAccuracy:false, maximumAge:30000, timeout:10000});
    if (watchIdRef.current === null) {
      watchIdRef.current = navigator.geolocation.watchPosition(success, failure, {enableHighAccuracy:false, maximumAge:60000, timeout:15000});
    }
  };

  const start = async () => {
    setStarted(true); setFinished(false); setPaused(false); setRemaining(minutes*60); setError(''); setNotice(''); setResult(null); setPreviousResult(null); setSessionStartedAt(new Date().toISOString()); setSavedThisSession(0); setRevealed(!mysteryMode);
    generateQuest();
    requestLocation();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera API unavailable');
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ideal:'environment'}, width:{ideal:1280}, height:{ideal:720} }, audio:false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch {
      setError('Camera access is unavailable in this browser/context. Upload an image or use Demo capture.');
    }
  };

  const fileToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const optimizeBlob = async (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url; });
      const max = 960;
      const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return blob;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b || blob), 'image/jpeg', 0.72));
    } finally { URL.revokeObjectURL(url); }
  };

  const analyzeBlob = async (rawBlob: Blob) => {
    setLoading(true); setError(''); setNotice('');
    try {
      const blob = await optimizeBlob(rawBlob);
      const dataUrl = await fileToDataUrl(blob);
      setLastImage(dataUrl);
      const response = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ image:dataUrl.split(',')[1], focus, difficulty, previous: previousResult }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI analysis failed');
      setAiMode(data.mode === 'local' ? 'local' : 'demo');
      setPreviousResult(result);
      setResult(data.result);
      setRevealed(!mysteryMode);
    } catch (e) {
      setAiMode('demo');
      setError(e instanceof Error ? e.message : 'AI analysis failed');
    } finally { setLoading(false); }
  };

  const capture = async () => {
    if (!videoRef.current?.videoWidth) { useDemo(); return; }
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = Math.round(960 * (videoRef.current.videoHeight / videoRef.current.videoWidth || 0.75));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78));
    if (blob) await analyzeBlob(blob);
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await analyzeBlob(file);
    event.target.value = '';
  };

  const useDemo = () => {
    const demo = demos[Math.floor(Math.random()*demos.length)];
    setLastImage(undefined); setPreviousResult(result); setResult(demo); setAiMode('demo'); setRevealed(!mysteryMode); setError('');
  };

  const toggleTask = (index:number) => setCompletedTasks(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);

  const saveDiscovery = async () => {
    if (!result) return;
    const discovery: Discovery = {
      id: `discovery-${Date.now()}`,
      title: result.identification,
      category: result.category,
      confidence: result.confidence,
      confidenceLevel: result.confidenceLevel,
      notes: result.observations,
      challenge: result.challenge,
      lookAgain: result.lookAgain,
      recommendedCapture: result.recommendedCapture,
      date: new Date().toISOString().slice(0,10),
      time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
      lat: location?.lat,
      lng: location?.lng,
      emoji: emojiFor(result.category),
      tags: [result.category, difficulty.toLowerCase(), aiMode === 'local' ? 'local-gemma' : 'demo'],
      image: lastImage,
      mysteryRevealed: !mysteryMode || revealed
    };
    await addDiscovery(discovery);
    setSavedThisSession(v => v + 1);
    setNotice('Discovery saved locally. Put the phone away and follow the challenge.');
  };

  async function finishWalk() {
    if (!started || finished) return;
    streamRef.current?.getTracks().forEach(t=>t.stop());
    const elapsedSeconds = Math.max(1, minutes*60 - remaining);
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds/60));
    setFinished(true); setPaused(true);
    await addExploration({id:`walk-${Date.now()}`, startedAt:sessionStartedAt || new Date(Date.now()-elapsedSeconds*1000).toISOString(), endedAt:new Date().toISOString(), minutes:elapsedMinutes, focus, difficulty, status:'completed', discoveries:savedThisSession, tasksCompleted:completedTasks.length, totalTasks:quest?.tasks.length || 4});
    setNotice(`Walk saved locally: ${elapsedMinutes} minutes outdoors.`);
    if (watchIdRef.current !== null && navigator.geolocation) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
  }

  const endSession = async () => {
    await finishWalk();
  };

  if (!started) return (
    <section className="card setup">
      <div className="kicker">New exploration</div>
      <div className="setup-heading"><div><h1 style={{fontSize:34}}>What are we looking for?</h1><p className="lead">Set a short field mission. The AI should be the spark, not the destination.</p></div><div className="setup-badge"><Target size={15}/> {mysteryMode ? 'Mystery mode' : 'Guided mode'}</div></div>
      <div style={{marginTop:20}}><div className="kicker">Duration</div><div className="field-grid">{[15,30,60].map(v => <button key={v} className={`option ${minutes===v?'selected':''}`} onClick={()=>setMinutes(v)}><strong>{v} min</strong><span>{v===15?'Pocket walk':v===30?'Good exploration':'Deep field session'}</span></button>)}</div></div>
      <div style={{marginTop:20}}><div className="kicker">Focus</div><div className="field-grid">{(['Everything','Plants','Wildlife'] as const).map(v => <button key={v} className={`option ${focus===v?'selected':''}`} onClick={()=>setFocus(v)}><strong>{v}</strong><span>{v==='Everything'?'Anything curious':v==='Plants'?'Leaves, flowers, trees':'Birds and small creatures'}</span></button>)}</div></div>
      <div style={{marginTop:20}}><div className="kicker">Difficulty</div><div className="field-grid">{(['Easy','Explorer','Expert'] as const).map(v => <button key={v} className={`option ${difficulty===v?'selected':''}`} onClick={()=>setDifficulty(v)}><strong>{v}</strong><span>{v==='Easy'?'Notice 3 things':v==='Explorer'?'Find patterns':'Compare details'}</span></button>)}</div></div>
      <label className="toggle-row"><input type="checkbox" checked={mysteryMode} onChange={e=>{setMysteryMode(e.target.checked); setRevealed(!e.target.checked);}}/><span><strong>Mystery mode</strong><small>Hide identifications until you reason from the clues.</small></span><WandSparkles size={17}/></label>
      <div className="info-card"><div className="badge"><Sparkles size={12}/> Your first quest</div><div className="small" style={{marginTop:6}}>NatureLens will generate four observation tasks locally when you start, then let you move on with the phone mostly away.</div></div>
      <div className="actions"><button className="btn btn-primary" onClick={start}><Crosshair size={15}/> Start exploration</button><Link href="/" className="btn btn-secondary">Cancel</Link></div>
    </section>
  );

  const confidence = result ? confidenceInfo(result) : null;
  const visibleTitle = mysteryMode && result && !revealed ? 'Mystery observation' : result?.identification;

  return (
    <>
      <div className="explore-statusbar"><div className="status-group"><span className="time-pill">{formatTime(remaining)} left</span><span className="status-pill online"><span className="status-dot"/> {finished ? 'Walk complete' : paused ? 'Paused' : 'Session running'}</span></div><div className="status-group"><span className="micro-pill"><MapPin size={12}/> {locationStatus === 'ready' ? 'GPS saved locally' : locationStatus === 'requesting' ? 'Getting location…' : 'Location not set'}</span><span className="micro-pill"><Sparkles size={12}/> {aiMode === 'local' ? 'Gemma local' : aiMode === 'demo' ? 'Demo fallback' : 'AI ready'}</span></div></div>
      <div className="explore-grid outdoor-grid">
        <section className="card camera-card">
          <div className="camera-stage-wrap">
            <video ref={videoRef} className="camera-stage" playsInline muted />
            <div className="camera-overlay">
              <div className="camera-top"><span className="badge camera-badge"><ShieldCheck size={12}/> local-first</span><span className="badge camera-badge">{difficulty}</span></div>
              <div className="capture-help">{loading ? 'NatureLens is looking closely…' : result ? 'Observe, then put the phone away.' : 'Capture one thing worth noticing.'}</div>
              <div className="capture-bar"><button className="capture" onClick={capture} disabled={loading} aria-label="Capture"><span>{loading ? <Loader2 size={25} className="spin" color="white"/> : <Camera size={25} color="white"/>}</span></button><div className="camera-actions"><button className="btn dark-btn" onClick={useDemo} disabled={loading}><Sparkles size={14}/> Demo</button><button className="btn dark-btn" onClick={()=>fileRef.current?.click()} disabled={loading}><Upload size={14}/> Upload</button><input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handleUpload}/></div></div>
            </div>
          </div>
          <div className="camera-footer"><div><strong>{quest?.title || 'Your quest'}</strong><div className="small">{startingQuest ? 'Creating your local quest…' : quest?.intro || 'Your observation mission will appear here.'}</div></div><button className="icon-btn" title="Request location" onClick={requestLocation}><MapPin size={15}/></button></div>
        </section>

        <aside className="result-panel card">
          <div className="kicker">Today's quest</div>
          <div className="quest-card"><div className="quest-title-row"><div><h2>{quest?.title || 'Look Closer'}</h2><p>{quest?.intro || 'Look for patterns around you.'}</p></div><span className="task-count">{completedTasks.length}/{quest?.tasks.length || 4}</span></div>
            <div className="quest-list">{(quest?.tasks || fallbackQuest.tasks).map((task,i)=><button key={task} className={`quest-item ${completedTasks.includes(i)?'done':''}`} onClick={()=>toggleTask(i)}><span className="task-check">{completedTasks.includes(i) && <Check size={13}/>}</span><span>{task}</span></button>)}</div>
          </div>

          {result ? (
            <div className="result-content">
              <div className="result-label">Possible identification</div>
              <h3>{visibleTitle}</h3>
              {confidence && <div className="confidence-row"><span className={`confidence-tag ${confidence.level}`}>{confidence.label}</span><span>{Math.round(result.confidence)}%</span><div className="confidence-bar"><i style={{width:`${result.confidence}%`}}/></div></div>}
              {mysteryMode && !revealed ? (
                <div className="mystery-card"><div className="badge"><Eye size={12}/> Mystery mode</div><p className="lead">Reason from the visible traits before revealing the model's hypothesis.</p><div className="hint-list">{(result.mysteryHints?.length ? result.mysteryHints : result.observations.slice(0,2)).map(h=><div key={h}>• {h}</div>)}</div><button className="btn btn-primary" onClick={()=>setRevealed(true)}>Reveal identification</button></div>
              ) : (
                <>
                  <p className="summary">{result.summary}</p>
                  <div className="result-section"><h4>What I noticed</h4><ul>{result.observations.map(o=><li key={o}>{o}</li>)}</ul></div>
                  <div className="look-closer"><div className="result-section"><h4>Look closer</h4><p>{result.lookAgain}</p></div><div className="next-challenge"><strong>Next challenge</strong><span>{result.challenge}</span></div></div>
                  {result.recommendedCapture && <div className="evidence-card"><Info size={14}/><div><strong>Need better evidence?</strong><div>{result.recommendedCapture}</div></div></div>}
                  {result.safetyNote && <div className="safety-card"><ShieldCheck size={14}/><span>{result.safetyNote}</span></div>}
                  <div className="actions result-actions"><button className="btn btn-primary" onClick={saveDiscovery}><Check size={15}/> Save discovery</button><button className="btn btn-secondary" onClick={capture} disabled={loading}><RotateCcw size={15}/> Observe again</button>{mysteryMode && <button className="btn btn-ghost" onClick={()=>setRevealed(false)}>Hide again</button>}</div>
                </>
              )}
            </div>
          ) : (
            <div className="empty-result"><div className="empty-result-icon">◌</div><strong>NatureLens is ready.</strong><span>Point the camera outward and capture something that makes you curious.</span></div>
          )}
        </aside>
      </div>

      <div className="walk-controls"><button className="btn btn-secondary" onClick={()=>setPaused(v=>!v)} disabled={finished}>{paused ? <><Play size={14}/> Resume</> : <><Pause size={14}/> Pause</>}</button><button className="btn btn-danger" onClick={endSession}><CircleStop size={14}/> End walk</button><Link className="btn btn-ghost" href="/dashboard"><MapPin size={14}/> View dashboard</Link></div>

      {(error || notice) && <div className={`toast ${error ? 'toast-error' : ''}`}>{error || notice}</div>}

      {finished && <div className="finish-banner card"><div><div className="kicker">Walk complete</div><h2>Nice. The screen can be over now.</h2><p className="small">Your walk, tasks and observations are stored locally. Review them later on the desktop dashboard.</p></div><div className="actions"><Link className="btn btn-primary" href="/dashboard">Open dashboard</Link><Link className="btn btn-secondary" href="/journal">Open journal</Link></div></div>}
    </>
  );
}
