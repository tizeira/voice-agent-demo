import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  Environment, 
  ContactShadows, 
  PerspectiveCamera,
  Loader
} from '@react-three/drei';
import ClaraAvatar from './ClaraAvatar';

interface SceneSetupProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioData?: Float32Array;
  className?: string;
}

function SceneContent({ isListening, isSpeaking, audioData }: SceneSetupProps) {
  return (
    <>
      {/* Camera Setup - Professional consultation view */}
      <PerspectiveCamera 
        makeDefault 
        position={[0, 1.6, 3]} 
        fov={45}
        near={0.1}
        far={100}
      />
      
      {/* Lighting Setup - Medical/Professional Environment */}
      <ambientLight intensity={0.6} color="#f8f9fa" />
      
      {/* Key light - main illumination */}
      <directionalLight 
        position={[2, 4, 3]} 
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Fill light - soften shadows */}
      <directionalLight 
        position={[-2, 2, 3]} 
        intensity={0.4}
        color="#e3f2fd"
      />
      
      {/* Rim light - define silhouette */}
      <directionalLight 
        position={[0, 2, -3]} 
        intensity={0.3}
        color="#fff3e0"
      />
      
      {/* Environment - Professional medical office */}
      <Environment 
        files="/hdri/medical-office.hdr"
        background={false}
        blur={0.8}
      />
      
      {/* Clara Avatar */}
      <ClaraAvatar 
        isListening={isListening}
        isSpeaking={isSpeaking}
        audioData={audioData}
        readyPlayerMeUrl="https://models.readyplayer.me/6515a3f5dc1d87a0f3e4bc8e.glb" // Placeholder
      />
      
      {/* Ground plane with subtle shadows */}
      <ContactShadows 
        position={[0, -1.5, 0]}
        opacity={0.2}
        scale={3}
        blur={2}
        far={2}
        color="#000000"
      />
      
      {/* Background gradient plane */}
      <mesh position={[0, 0, -2]} scale={[6, 4, 1]}>
        <planeGeometry />
        <meshBasicMaterial 
          color="#f5f7fa"
          transparent
          opacity={0.8}
        />
      </mesh>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="loading-avatar">
      <div className="loading-spinner" />
      <p>Cargando a Clara...</p>
      <style jsx>{`
        .loading-avatar {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function ClaraScene({ isListening, isSpeaking, audioData, className = '' }: SceneSetupProps) {
  return (
    <div className={`clara-scene-container ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px'
        }}
      >
        <Suspense fallback={null}>
          <SceneContent 
            isListening={isListening}
            isSpeaking={isSpeaking}
            audioData={audioData}
          />
        </Suspense>
      </Canvas>
      
      <Loader 
        containerStyles={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)'
        }}
        dataInterpolation={(p) => `Cargando Clara... ${Math.round(p)}%`}
      />
      
      {/* Performance monitoring in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="performance-monitor">
          <div id="fps-counter" />
        </div>
      )}
      
      <style jsx>{`
        .clara-scene-container {
          position: relative;
          width: 100%;
          height: 500px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .performance-monitor {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          z-index: 1000;
        }
        
        @media (max-width: 768px) {
          .clara-scene-container {
            height: 400px;
          }
        }
        
        @media (max-width: 480px) {
          .clara-scene-container {
            height: 350px;
          }
        }
      `}</style>
    </div>
  );
}

// Performance optimization hook
export function useClaraPerformance() {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Simple FPS counter
      let frameCount = 0;
      let lastTime = performance.now();
      
      function updateFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= lastTime + 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          const fpsElement = document.getElementById('fps-counter');
          
          if (fpsElement) {
            fpsElement.textContent = `${fps} FPS`;
            fpsElement.style.color = fps >= 30 ? '#4ade80' : fps >= 20 ? '#fbbf24' : '#ef4444';
          }
          
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(updateFPS);
      }
      
      updateFPS();
    }
  }, []);
}

export default ClaraScene;