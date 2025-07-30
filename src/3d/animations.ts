/**
 * Animation states and controllers for Clara's 3D avatar
 * Manages idle, listening, speaking, and gesture animations
 */

import * as THREE from 'three';

export enum AnimationState {
  IDLE = 'idle',
  LISTENING = 'listening', 
  SPEAKING = 'speaking',
  GREETING = 'greeting',
  THINKING = 'thinking',
  GESTURING = 'gesturing',
  GOODBYE = 'goodbye'
}

export interface AnimationConfig {
  duration: number;
  loop: boolean;
  autoTransition?: AnimationState;
  priority: number; // Higher priority interrupts lower priority
}

export const ANIMATION_CONFIGS: Record<AnimationState, AnimationConfig> = {
  [AnimationState.IDLE]: {
    duration: Infinity,
    loop: true,
    priority: 0
  },
  [AnimationState.LISTENING]: {
    duration: Infinity,
    loop: true,
    priority: 1
  },
  [AnimationState.SPEAKING]: {
    duration: Infinity,
    loop: true,
    priority: 2
  },
  [AnimationState.GREETING]: {
    duration: 3000,
    loop: false,
    autoTransition: AnimationState.LISTENING,
    priority: 3
  },
  [AnimationState.THINKING]: {
    duration: 2000,
    loop: true,
    priority: 1
  },
  [AnimationState.GESTURING]: {
    duration: 1500,
    loop: false,
    autoTransition: AnimationState.SPEAKING,
    priority: 2
  },
  [AnimationState.GOODBYE]: {
    duration: 2500,
    loop: false,
    autoTransition: AnimationState.IDLE,
    priority: 3
  }
};

export class ClaraAnimationController {
  private currentState: AnimationState = AnimationState.IDLE;
  private previousState: AnimationState = AnimationState.IDLE;
  private stateStartTime: number = 0;
  private transitionProgress: number = 1;
  private mixer?: THREE.AnimationMixer;
  private actions: Map<AnimationState, THREE.AnimationAction> = new Map();
  
  constructor(model: THREE.Object3D, animations?: THREE.AnimationClip[]) {
    if (animations && animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(model);
      this.setupAnimationActions(animations);
    }
  }
  
  private setupAnimationActions(clips: THREE.AnimationClip[]): void {
    if (!this.mixer) return;
    
    // Map animation clips to states
    clips.forEach(clip => {
      let state: AnimationState;
      
      // Map clip names to animation states
      switch (clip.name.toLowerCase()) {
        case 'idle':
        case 'breathing':
          state = AnimationState.IDLE;
          break;
        case 'listening':
        case 'attention':
          state = AnimationState.LISTENING;
          break;
        case 'talking':
        case 'speaking':
          state = AnimationState.SPEAKING;
          break;
        case 'wave':
        case 'hello':
          state = AnimationState.GREETING;
          break;
        case 'thinking':
        case 'pondering':
          state = AnimationState.THINKING;
          break;
        case 'gesture':
        case 'explaining':
          state = AnimationState.GESTURING;
          break;
        case 'goodbye':
        case 'farewell':
          state = AnimationState.GOODBYE;
          break;
        default:
          return; // Skip unknown animations
      }
      
      const action = this.mixer.clipAction(clip);
      this.actions.set(state, action);
    });
  }
  
  public setState(newState: AnimationState, force: boolean = false): void {
    const currentConfig = ANIMATION_CONFIGS[this.currentState];
    const newConfig = ANIMATION_CONFIGS[newState];
    
    // Check priority unless forced
    if (!force && newConfig.priority < currentConfig.priority) {
      return;
    }
    
    if (this.currentState !== newState) {
      this.previousState = this.currentState;
      this.currentState = newState;
      this.stateStartTime = Date.now();
      this.transitionProgress = 0;
      this.startAnimation(newState);
    }
  }
  
  private startAnimation(state: AnimationState): void {
    const config = ANIMATION_CONFIGS[state];
    const action = this.actions.get(state);
    
    if (action) {
      // Crossfade from previous animation
      const previousAction = this.actions.get(this.previousState);
      if (previousAction && previousAction !== action) {
        action.reset();
        action.setEffectiveWeight(1);
        action.play();
        action.crossFadeFrom(previousAction, 0.3, true);
      } else {
        action.reset();
        action.setEffectiveWeight(1);
        action.play();
      }
      
      // Set loop mode
      action.setLoop(config.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    }
  }
  
  public update(deltaTime: number): void {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    
    this.updateTransitions();
    this.checkAutoTransitions();
  }
  
  private updateTransitions(): void {
    const elapsed = Date.now() - this.stateStartTime;
    const transitionDuration = 300; // 300ms transition
    this.transitionProgress = Math.min(1, elapsed / transitionDuration);
  }
  
  private checkAutoTransitions(): void {
    const config = ANIMATION_CONFIGS[this.currentState];
    const elapsed = Date.now() - this.stateStartTime;
    
    if (config.autoTransition && elapsed >= config.duration) {
      this.setState(config.autoTransition);
    }
  }
  
  public getCurrentState(): AnimationState {
    return this.currentState;
  }
  
  public getTransitionProgress(): number {
    return this.transitionProgress;
  }
}

/**
 * Procedural animations for when Ready Player Me doesn't have specific clips
 */
export class ProceduralAnimations {
  private model: THREE.Object3D;
  private originalRotations: Map<string, THREE.Euler> = new Map();
  private originalPositions: Map<string, THREE.Vector3> = new Map();
  
  constructor(model: THREE.Object3D) {
    this.model = model;
    this.cacheOriginalTransforms();
  }
  
  private cacheOriginalTransforms(): void {
    this.model.traverse((child) => {
      if (child.type === 'Bone' || child.name.includes('joint')) {
        this.originalRotations.set(child.name, child.rotation.clone());
        this.originalPositions.set(child.name, child.position.clone());
      }
    });
  }
  
  public applyIdleAnimation(time: number): void {
    // Subtle breathing animation
    const breathingIntensity = Math.sin(time * 2) * 0.02;
    const spine = this.findBoneByName('Spine') || this.findBoneByName('spine');
    if (spine) {
      const originalPos = this.originalPositions.get(spine.name);
      if (originalPos) {
        spine.position.y = originalPos.y + breathingIntensity;
      }
    }
    
    // Gentle head movement
    const headSway = Math.sin(time * 0.5) * 0.05;
    const head = this.findBoneByName('Head') || this.findBoneByName('head');
    if (head) {
      const originalRot = this.originalRotations.get(head.name);
      if (originalRot) {
        head.rotation.y = originalRot.y + headSway;
      }
    }
  }
  
  public applyListeningAnimation(time: number, intensity: number = 1): void {
    // Slight forward lean indicating attention
    const spine = this.findBoneByName('Spine') || this.findBoneByName('spine');
    if (spine) {
      const originalRot = this.originalRotations.get(spine.name);
      if (originalRot) {
        spine.rotation.x = originalRot.x + (0.1 * intensity);
      }
    }
    
    // Engaged eye contact (if eye bones available)
    this.applyEyeContact(0.8);
  }
  
  public applySpeakingAnimation(time: number, audioIntensity: number = 0): void {
    // Hand gestures during speaking
    const leftHand = this.findBoneByName('LeftHand') || this.findBoneByName('leftHand');
    const rightHand = this.findBoneByName('RightHand') || this.findBoneByName('rightHand');
    
    if (leftHand && rightHand) {
      const gesturePhase = Math.sin(time * 3) * 0.3;
      const originalLeftRot = this.originalRotations.get(leftHand.name);
      const originalRightRot = this.originalRotations.get(rightHand.name);
      
      if (originalLeftRot && originalRightRot) {
        leftHand.rotation.z = originalLeftRot.z + gesturePhase;
        rightHand.rotation.z = originalRightRot.z - gesturePhase;
      }
    }
    
    // Head movement based on speech intensity
    const head = this.findBoneByName('Head') || this.findBoneByName('head');
    if (head) {
      const originalRot = this.originalRotations.get(head.name);
      if (originalRot) {
        head.rotation.x = originalRot.x + (audioIntensity * 0.1);
        head.rotation.y = originalRot.y + (Math.sin(time * 2) * audioIntensity * 0.05);
      }
    }
  }
  
  public applyGreetingAnimation(progress: number): void {
    // Wave gesture
    const rightArm = this.findBoneByName('RightArm') || this.findBoneByName('rightArm');
    const rightForearm = this.findBoneByName('RightForeArm') || this.findBoneByName('rightForearm');
    
    if (rightArm && rightForearm) {
      const waveIntensity = Math.sin(progress * Math.PI * 4) * (1 - progress);
      const originalArmRot = this.originalRotations.get(rightArm.name);
      const originalForearmRot = this.originalRotations.get(rightForearm.name);
      
      if (originalArmRot && originalForearmRot) {
        rightArm.rotation.z = originalArmRot.z + Math.PI * 0.3 * progress;
        rightForearm.rotation.x = originalForearmRot.x + waveIntensity * 0.5;
      }
    }
    
    // Welcoming smile (if morph targets available)
    this.applyFacialExpression('smile', progress * 0.7);
  }
  
  private findBoneByName(name: string): THREE.Object3D | null {
    let foundBone: THREE.Object3D | null = null;
    
    this.model.traverse((child) => {
      if (child.name.toLowerCase().includes(name.toLowerCase()) && 
          (child.type === 'Bone' || child.name.includes('joint'))) {
        foundBone = child;
      }
    });
    
    return foundBone;
  }
  
  private applyEyeContact(intensity: number): void {
    // Look towards camera/user
    const leftEye = this.findBoneByName('LeftEye') || this.findBoneByName('leftEye');
    const rightEye = this.findBoneByName('RightEye') || this.findBoneByName('rightEye');
    
    [leftEye, rightEye].forEach(eye => {
      if (eye) {
        const originalRot = this.originalRotations.get(eye.name);
        if (originalRot) {
          eye.rotation.x = originalRot.x;
          eye.rotation.y = originalRot.y + (0.1 * intensity);
        }
      }
    });
  }
  
  private applyFacialExpression(expression: string, intensity: number): void {
    // This would work with morph targets on Ready Player Me avatars
    this.model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetInfluences) {
        // Map expressions to morph target indices
        const morphMap: Record<string, number> = {
          'smile': 0,
          'frown': 1,
          'surprise': 2,
          'blink': 3
        };
        
        const morphIndex = morphMap[expression];
        if (morphIndex !== undefined && child.morphTargetInfluences[morphIndex] !== undefined) {
          child.morphTargetInfluences[morphIndex] = intensity;
        }
      }
    });
  }
  
  public resetToOriginal(): void {
    this.model.traverse((child) => {
      const originalRot = this.originalRotations.get(child.name);
      const originalPos = this.originalPositions.get(child.name);
      
      if (originalRot) {
        child.rotation.copy(originalRot);
      }
      if (originalPos) {
        child.position.copy(originalPos);
      }
    });
    
    // Reset morph targets
    this.applyFacialExpression('smile', 0);
    this.applyFacialExpression('frown', 0);
    this.applyFacialExpression('surprise', 0);
  }
}