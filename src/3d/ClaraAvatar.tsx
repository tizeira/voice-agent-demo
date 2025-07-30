import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface ClaraAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioData?: Float32Array;
  readyPlayerMeUrl?: string;
}

function AvatarModel({ isListening, isSpeaking, audioData, readyPlayerMeUrl }: ClaraAvatarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [blinkTime, setBlinkTime] = useState(0);
  
  // Placeholder Ready Player Me URL for Clara (dermatologist avatar)
  const avatarUrl = readyPlayerMeUrl || 'https://models.readyplayer.me/placeholder-clara.glb';
  
  // Load GLB model (will be Ready Player Me halfbody model)
  const { scene, animations } = useGLTF(avatarUrl);
  
  // Animation frame for idle/talking states
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Breathing animation (subtle chest movement)
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.01;
      
      // Blinking animation
      setBlinkTime(prev => prev + delta);
      if (blinkTime > 3) {
        // Trigger blink animation
        setBlinkTime(0);
      }
      
      // Speaking animation (jaw movement based on audio)
      if (isSpeaking && audioData) {
        const amplitude = getAudioAmplitude(audioData);
        // Apply jaw bone rotation based on audio amplitude
        meshRef.current.rotation.x = amplitude * 0.1;
      }
      
      // Listening state (subtle head movement)
      if (isListening) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      }
    }
  });
  
  return (
    <primitive 
      ref={meshRef}
      object={scene} 
      scale={[1, 1, 1]}
      position={[0, -1, 0]}
    />
  );
}

function getAudioAmplitude(audioData: Float32Array): number {
  if (!audioData || audioData.length === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  return Math.sqrt(sum / audioData.length);
}

export function ClaraAvatar({ isListening, isSpeaking, audioData, readyPlayerMeUrl }: ClaraAvatarProps) {
  return (
    <div className="clara-avatar-container" style={{ width: '100%', height: '400px' }}>
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        {/* Lighting setup for dermatology consultation */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8}
          castShadow
        />
        <pointLight position={[-5, -5, -5]} intensity={0.3} />
        
        {/* Environment for professional look */}
        <Environment preset="studio" />
        
        {/* Clara Avatar Model */}
        <AvatarModel 
          isListening={isListening}
          isSpeaking={isSpeaking}
          audioData={audioData}
          readyPlayerMeUrl={readyPlayerMeUrl}
        />
        
        {/* Camera controls for development */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
      
      {/* Status indicators */}
      <div className="avatar-status">
        {isListening && <div className="status-indicator listening">👂 Escuchando...</div>}
        {isSpeaking && <div className="status-indicator speaking">💬 Hablando...</div>}
      </div>
    </div>
  );
}

// Preload Ready Player Me model
useGLTF.preload('/models/clara-dermatologist.glb');

export default ClaraAvatar;