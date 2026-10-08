import type { Discovery, Exploration } from './types';

export const seedDiscoveries: Discovery[] = [
  {
    id:'seed-neem', title:'Neem tree', category:'tree', confidence:82, confidenceLevel:'high',
    notes:['Compound leaves with serrated leaflets','Broad branching canopy','Bark texture is consistent with a mature tree'],
    challenge:'Find another nearby tree with a different leaf arrangement.', lookAgain:'Look at one leaf from close range. Count the leaflets before you put your phone away.',
    recommendedCapture:'Photograph one whole branch as well as a close leaf.', date:'2026-10-08', time:'17:34', lat:20.2961, lng:85.8245, emoji:'🌳', tags:['tree','leaf-structure','observation','local-ai']
  },
  {
    id:'seed-robin', title:'Possible Indian robin', category:'bird', confidence:67, confidenceLevel:'medium',
    notes:['Small dark-bodied bird shape','Upright posture','Visual context is not enough for definitive species identification'],
    challenge:'Look around without zooming: can you spot the bird again before it moves?', lookAgain:'Observe the tail and posture from a distance; do not approach the bird.',
    recommendedCapture:'A wider photo showing the bird in its surroundings would help.', date:'2026-10-07', time:'06:48', lat:20.2938, lng:85.8262, emoji:'🐦', tags:['bird','field-note','medium-confidence','local-ai']
  },
  {
    id:'seed-hibiscus', title:'Hibiscus', category:'flower', confidence:91, confidenceLevel:'high',
    notes:['Five broad petals','Long central staminal column','Broad green leaves below bloom'],
    challenge:'Find a nearby flower with a different petal count.', lookAgain:'Trace the flower structure with your eyes instead of zooming the photo.',
    recommendedCapture:'Capture one full flower plus its leaves if you want to compare it later.', date:'2026-10-06', time:'16:22', lat:20.2945, lng:85.8228, emoji:'🌺', tags:['flower','petals','color','local-ai']
  }
];

export const seedExplorations: Exploration[] = [
  { id:'seed-walk-1', startedAt:'2026-10-08T17:10:00', minutes:38, focus:'Everything', difficulty:'Explorer', status:'completed', discoveries:4, tasksCompleted:4, totalTasks:4 },
  { id:'seed-walk-2', startedAt:'2026-10-07T06:31:00', minutes:28, focus:'Wildlife', difficulty:'Easy', status:'completed', discoveries:2, tasksCompleted:3, totalTasks:4 },
  { id:'seed-walk-3', startedAt:'2026-10-06T16:05:00', minutes:34, focus:'Plants', difficulty:'Explorer', status:'completed', discoveries:3, tasksCompleted:3, totalTasks:4 }
];
