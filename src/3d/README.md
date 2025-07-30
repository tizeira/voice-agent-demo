# 3D Avatar System

## Current Status
- ✅ **Simple CSS Avatar**: Working with listening/speaking animations
- 🔄 **Ready Player Me**: Architecture prepared, pending implementation

## Files Structure
```
src/3d/
├── simple-avatar.ts     # Current: CSS-based avatar (WORKING)
├── README.md           # This file
└── [future files]      # Three.js integration when ready
```

## Future Ready Player Me Integration

### Step 1: Install Three.js
```bash
npm install three @types/three
```

### Step 2: Create Three.js Avatar Component
```typescript
// src/3d/three-avatar.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class ClaraThreeAvatar {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private model: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;

  constructor(container: HTMLElement) {
    this.initThreeJS(container);
  }

  async loadReadyPlayerMe(url: string): Promise<void> {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    
    this.model = gltf.scene;
    this.scene.add(this.model);
    
    // Setup animations
    if (gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.model);
      // Add animation setup here
    }
  }

  setListening(value: boolean): void {
    // Trigger listening animation
  }

  setSpeaking(value: boolean): void {
    // Trigger speaking animation with visemes
  }
}
```

### Step 3: Replace CSS Avatar
```typescript
// In main.ts, replace:
import { createSimpleAvatar } from './3d/simple-avatar';

// With:
import { ClaraThreeAvatar } from './3d/three-avatar';
```

### Step 4: Ready Player Me Avatar URL
Get Clara's avatar from: https://readyplayer.me/avatar
Expected URL format: `https://models.readyplayer.me/[ID].glb`

## Animation States
- **Idle**: Subtle breathing, occasional blink
- **Listening**: Attentive posture, eye contact
- **Speaking**: Mouth movements, hand gestures
- **Greeting**: Wave animation
- **Thinking**: Head tilt, contemplative pose

## Performance Targets
- **Load Time**: <3 seconds
- **Mobile FPS**: 30fps minimum
- **Memory Usage**: <100MB
- **Bundle Size**: <5MB additional

## Integration Points
- WebRTC audio events → Avatar animations
- OpenAI Realtime API → Lip sync data
- User interactions → Gesture triggers
- Analytics tracking → Animation metrics