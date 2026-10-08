export type DiscoveryCategory =
  | 'plant'
  | 'flower'
  | 'tree'
  | 'bird'
  | 'insect'
  | 'leaf'
  | 'fungus'
  | 'rock'
  | 'other';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type OutdoorQuest = {
  title: string;
  intro: string;
  tasks: string[];
};

export type Discovery = {
  id: string;
  title: string;
  category: DiscoveryCategory;
  confidence: number;
  confidenceLevel?: ConfidenceLevel;
  notes: string[];
  challenge: string;
  lookAgain?: string;
  recommendedCapture?: string;
  date: string;
  time: string;
  lat?: number;
  lng?: number;
  emoji: string;
  tags: string[];
  image?: string;
  mysteryRevealed?: boolean;
};

export type Exploration = {
  id: string;
  startedAt: string;
  endedAt?: string;
  minutes: number;
  focus: 'Everything' | 'Plants' | 'Wildlife';
  difficulty: 'Easy' | 'Explorer' | 'Expert';
  status: 'active' | 'completed' | 'cancelled';
  discoveries: number;
  tasksCompleted?: number;
  totalTasks?: number;
};

export type AIResult = {
  identification: string;
  category: DiscoveryCategory;
  confidence: number;
  confidenceLevel?: ConfidenceLevel;
  summary: string;
  observations: string[];
  challenge: string;
  lookAgain: string;
  recommendedCapture?: string;
  mysteryHints?: string[];
  safetyNote?: string;
};
