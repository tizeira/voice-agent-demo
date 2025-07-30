/**
 * Visemes mapping for lip-sync animation with Clara's audio
 * Maps audio chunks to mouth shapes for realistic talking animation
 */

export interface Viseme {
  id: string;
  name: string;
  mouthShape: string;
  jawOpenness: number; // 0-1
  lipRounding: number; // 0-1
  tonguePosition: number; // 0-1
}

// Standard visemes for Spanish speech patterns
export const SPANISH_VISEMES: Record<string, Viseme> = {
  // Silence
  sil: {
    id: 'sil',
    name: 'Silence',
    mouthShape: 'closed',
    jawOpenness: 0,
    lipRounding: 0,
    tonguePosition: 0.5
  },
  
  // Vowels (Spanish has 5 clear vowels)
  a: {
    id: 'a',
    name: 'A',
    mouthShape: 'open',
    jawOpenness: 0.8,
    lipRounding: 0,
    tonguePosition: 0.5
  },
  
  e: {
    id: 'e',
    name: 'E',
    mouthShape: 'mid-open',
    jawOpenness: 0.5,
    lipRounding: 0,
    tonguePosition: 0.3
  },
  
  i: {
    id: 'i',
    name: 'I',
    mouthShape: 'narrow',
    jawOpenness: 0.2,
    lipRounding: 0,
    tonguePosition: 0.1
  },
  
  o: {
    id: 'o',
    name: 'O',
    mouthShape: 'rounded',
    jawOpenness: 0.6,
    lipRounding: 0.8,
    tonguePosition: 0.7
  },
  
  u: {
    id: 'u',
    name: 'U',
    mouthShape: 'very-rounded',
    jawOpenness: 0.3,
    lipRounding: 1.0,
    tonguePosition: 0.8
  },
  
  // Common Spanish consonants
  p: {
    id: 'p',
    name: 'P/B',
    mouthShape: 'closed-lips',
    jawOpenness: 0,
    lipRounding: 0,
    tonguePosition: 0.5
  },
  
  f: {
    id: 'f',
    name: 'F/V',
    mouthShape: 'teeth-lip',
    jawOpenness: 0.1,
    lipRounding: 0,
    tonguePosition: 0.5
  },
  
  t: {
    id: 't',
    name: 'T/D/N/L',
    mouthShape: 'tongue-teeth',
    jawOpenness: 0.3,
    lipRounding: 0,
    tonguePosition: 0.2
  },
  
  r: {
    id: 'r',
    name: 'R/RR',
    mouthShape: 'tongue-roll',
    jawOpenness: 0.4,
    lipRounding: 0,
    tonguePosition: 0.3
  },
  
  s: {
    id: 's',
    name: 'S/Z',
    mouthShape: 'hiss',
    jawOpenness: 0.2,
    lipRounding: 0,
    tonguePosition: 0.4
  }
};

export interface AudioChunk {
  timestamp: number;
  duration: number;
  amplitude: number;
  frequency: number;
  phoneme?: string;
}

export class VisemeProcessor {
  private currentViseme: Viseme = SPANISH_VISEMES.sil;
  private targetViseme: Viseme = SPANISH_VISEMES.sil;
  private transitionProgress: number = 0;
  private transitionSpeed: number = 0.1;
  
  /**
   * Process audio chunk and return corresponding viseme
   * For now, uses amplitude-based approximation
   * TODO: Integrate with OpenAI audio transcription for phoneme detection
   */
  processAudioChunk(audioChunk: AudioChunk): Viseme {
    const { amplitude, frequency, phoneme } = audioChunk;
    
    // If we have phoneme data from transcription, use it
    if (phoneme && SPANISH_VISEMES[phoneme]) {
      this.setTargetViseme(SPANISH_VISEMES[phoneme]);
      return this.interpolateViseme();
    }
    
    // Fallback: amplitude-based viseme selection
    if (amplitude < 0.01) {
      this.setTargetViseme(SPANISH_VISEMES.sil);
    } else if (frequency < 500) {
      // Low frequency - likely vowels
      this.setTargetViseme(amplitude > 0.5 ? SPANISH_VISEMES.a : SPANISH_VISEMES.o);
    } else if (frequency < 1500) {
      // Mid frequency
      this.setTargetViseme(SPANISH_VISEMES.e);
    } else {
      // High frequency - likely consonants
      this.setTargetViseme(amplitude > 0.3 ? SPANISH_VISEMES.s : SPANISH_VISEMES.t);
    }
    
    return this.interpolateViseme();
  }
  
  private setTargetViseme(viseme: Viseme): void {
    if (this.targetViseme.id !== viseme.id) {
      this.currentViseme = this.getCurrentInterpolatedViseme();
      this.targetViseme = viseme;
      this.transitionProgress = 0;
    }
  }
  
  private interpolateViseme(): Viseme {
    this.transitionProgress = Math.min(1, this.transitionProgress + this.transitionSpeed);
    return this.getCurrentInterpolatedViseme();
  }
  
  private getCurrentInterpolatedViseme(): Viseme {
    const t = this.transitionProgress;
    
    return {
      id: `${this.currentViseme.id}-${this.targetViseme.id}`,
      name: `Transition ${this.currentViseme.name} to ${this.targetViseme.name}`,
      mouthShape: this.targetViseme.mouthShape,
      jawOpenness: this.lerp(this.currentViseme.jawOpenness, this.targetViseme.jawOpenness, t),
      lipRounding: this.lerp(this.currentViseme.lipRounding, this.targetViseme.lipRounding, t),
      tonguePosition: this.lerp(this.currentViseme.tonguePosition, this.targetViseme.tonguePosition, t)
    };
  }
  
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
  
  /**
   * Apply viseme to 3D model morphs
   * This will control the Ready Player Me avatar's facial expressions
   */
  applyVisemeToModel(viseme: Viseme, model: any): void {
    if (!model || !model.morphTargetInfluences) return;
    
    // Map to Ready Player Me morph targets
    // These will need to be adjusted based on the actual Clara avatar
    const morphTargets = {
      'jawOpen': viseme.jawOpenness,
      'mouthSmile': 0, // Clara keeps professional expression
      'mouthFrown': 0,
      'mouthPucker': viseme.lipRounding,
      'tongueOut': viseme.tonguePosition > 0.8 ? 0.3 : 0,
      'eyesClosed': 0, // Handled separately for blinking
    };
    
    // Apply morphs (indices depend on Ready Player Me avatar structure)
    Object.entries(morphTargets).forEach(([name, value], index) => {
      if (model.morphTargetInfluences[index] !== undefined) {
        model.morphTargetInfluences[index] = value;
      }
    });
  }
}

/**
 * Convert OpenAI Realtime API audio data to processable chunks
 */
export function audioToChunks(audioData: Float32Array, sampleRate: number = 24000): AudioChunk[] {
  const chunkSize = Math.floor(sampleRate * 0.05); // 50ms chunks
  const chunks: AudioChunk[] = [];
  
  for (let i = 0; i < audioData.length; i += chunkSize) {
    const chunk = audioData.slice(i, i + chunkSize);
    const amplitude = calculateRMS(chunk);
    const frequency = estimateFundamentalFrequency(chunk, sampleRate);
    
    chunks.push({
      timestamp: (i / sampleRate) * 1000, // Convert to milliseconds
      duration: (chunkSize / sampleRate) * 1000,
      amplitude,
      frequency
    });
  }
  
  return chunks;
}

function calculateRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

function estimateFundamentalFrequency(buffer: Float32Array, sampleRate: number): number {
  // Simple autocorrelation-based pitch detection
  // This is a simplified version - consider using more robust algorithms
  let maxCorrelation = 0;
  let fundamentalPeriod = 0;
  
  for (let period = 20; period < buffer.length / 2; period++) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - period; i++) {
      correlation += buffer[i] * buffer[i + period];
    }
    
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      fundamentalPeriod = period;
    }
  }
  
  return fundamentalPeriod > 0 ? sampleRate / fundamentalPeriod : 0;
}