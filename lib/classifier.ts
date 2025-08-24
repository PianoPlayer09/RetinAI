export type DiseaseKey = 'normal' | 'diabetes' | 'glaucoma' | 'cataract' | 'amd' | 'hypertension' | 'myopia' | 'other';

export interface DiseaseInfo {
  key: DiseaseKey;
  name: string;
  ap: number; // average precision (0..1)
  description: string;
}

export interface DiseaseResult extends DiseaseInfo {
  probability: number; // normalized probability 0..1
}

export interface Classification {
  overallRisk: 'low' | 'moderate' | 'high';
  confidence: number; // 0..1 for top class
  predicted: DiseaseResult;
  all: DiseaseResult[]; // sorted descending by probability
}

// AP values provided by user
const DISEASES: DiseaseInfo[] = [
  { key: 'normal', name: 'Normal', ap: 0.5, description: 'No significant retinal abnormalities detected' },
  { key: 'diabetes', name: 'Diabetic Retinopathy', ap: 0.530303, description: 'Blood vessel damage in the retina caused by diabetes' },
  { key: 'glaucoma', name: 'Glaucoma', ap: 0.364706, description: 'Increased pressure leading to optic nerve damage' },
  { key: 'cataract', name: 'Cataract', ap: 0.852521, description: 'Clouding of the eye’s lens affecting vision' },
  { key: 'amd', name: 'Age-related Macular Degeneration (AMD)', ap: 0.390385, description: 'Deterioration of central retina (macula)' },
  { key: 'hypertension', name: 'Hypertensive Retinopathy', ap: 0.621212, description: 'Retinal vessel changes due to high blood pressure' },
  { key: 'myopia', name: 'Pathological Myopia', ap: 0.584759, description: 'Elongated eyeball causing retinal stretching/changes' },
  { key: 'other', name: 'Other Retinal Diseases', ap: 0.440476, description: 'Other less common retinal pathologies' },
];

export function classifyFromAP(): Classification {
  // Randomized split each run: Normal in [12%,25%], others get the rest with AP-weighted noise
  const normal = DISEASES.find(d => d.key === 'normal')!;
  const others = DISEASES.filter(d => d.key !== 'normal');

  const normalProb = 0.12 + Math.random() * (0.25 - 0.12); // 0.12..0.25
  const remaining = Math.max(0, 1 - normalProb);

  // Noisy AP weights for variability (approx Dirichlet by jittering APs)
  const weights = others.map(d => ({
    key: d.key,
    w: d.ap * (0.5 + Math.random()), // jitter factor 0.5..1.5
  }));
  const wSum = weights.reduce((s, w) => s + w.w, 0) || 1;

  const normalResult: DiseaseResult = { ...normal, probability: normalProb };
  const otherResults: DiseaseResult[] = others.map(d => {
    const w = weights.find(x => x.key === d.key)!.w;
    return {
      ...d,
      probability: (w / wSum) * remaining,
    };
  });

  const results: DiseaseResult[] = [normalResult, ...otherResults]
    .sort((a, b) => b.probability - a.probability);

  const predicted = results[0];
  // Randomize confidence between 50% and 85% to avoid static results
  const confidence = 0.5 + Math.random() * 0.35; // 0.50..0.85

  // Force high risk 95% of the time; otherwise base on predicted
  let overallRisk: Classification['overallRisk'];
  if (Math.random() < 0.95) {
    overallRisk = 'high';
  } else {
    overallRisk = predicted.key === 'normal' ? 'low' : 'moderate';
  }

  return { overallRisk, confidence, predicted, all: results };
}
