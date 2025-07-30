/**
 * Simple 3D avatar implementation while we wait for Ready Player Me integration
 * This creates a basic geometric representation of Clara
 */

interface Simple3DAvatar {
  container: HTMLElement;
  setListening: (value: boolean) => void;
  setSpeaking: (value: boolean) => void;
  cleanup: () => void;
}

export function createSimpleAvatar(containerId: string): Simple3DAvatar {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with ID ${containerId} not found`);
  }

  // Create CSS 3D avatar structure
  container.innerHTML = `
    <div class="simple-avatar">
      <div class="avatar-head">
        <div class="avatar-face">
          <div class="avatar-eyes">
            <div class="eye left-eye">
              <div class="pupil"></div>
            </div>
            <div class="eye right-eye">
              <div class="pupil"></div>
            </div>
          </div>
          <div class="avatar-mouth">
            <div class="mouth-shape"></div>
          </div>
        </div>
      </div>
      <div class="avatar-body">
        <div class="avatar-shoulders"></div>
        <div class="avatar-chest"></div>
      </div>
      <div class="avatar-status-ring"></div>
    </div>
  `;

  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    .simple-avatar {
      position: relative;
      width: 200px;
      height: 300px;
      margin: 0 auto;
      transform-style: preserve-3d;
      animation: avatarIdle 4s ease-in-out infinite;
    }

    .avatar-head {
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 140px;
      background: linear-gradient(145deg, #fdbcb4, #f4a2a0);
      border-radius: 60px 60px 50px 50px;
      box-shadow: 
        inset 0 -10px 20px rgba(0,0,0,0.1),
        0 8px 25px rgba(0,0,0,0.2);
    }

    .avatar-face {
      position: relative;
      width: 100%;
      height: 100%;
      padding: 20px;
      box-sizing: border-box;
    }

    .avatar-eyes {
      display: flex;
      justify-content: space-between;
      margin-top: 25px;
      margin-bottom: 20px;
    }

    .eye {
      width: 20px;
      height: 25px;
      background: white;
      border-radius: 50%;
      position: relative;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }

    .pupil {
      position: absolute;
      top: 8px;
      left: 6px;
      width: 8px;
      height: 8px;
      background: #2d3748;
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .avatar-mouth {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
    }

    .mouth-shape {
      width: 30px;
      height: 15px;
      background: #d53f8c;
      border-radius: 0 0 30px 30px;
      transition: all 0.2s ease;
    }

    .avatar-body {
      position: absolute;
      bottom: 50px;
      left: 50%;
      transform: translateX(-50%);
      width: 140px;
      height: 120px;
    }

    .avatar-shoulders {
      width: 100%;
      height: 40px;
      background: linear-gradient(145deg, #e2e8f0, #cbd5e0);
      border-radius: 70px 70px 20px 20px;
      margin-bottom: 5px;
    }

    .avatar-chest {
      width: 90%;
      height: 70px;
      margin: 0 auto;
      background: linear-gradient(145deg, #f7fafc, #e2e8f0);
      border-radius: 15px;
    }

    .avatar-status-ring {
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      border: 3px solid rgba(66, 153, 225, 0.3);
      border-radius: 50%;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s ease;
    }

    @keyframes avatarIdle {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(-2px) rotate(0.5deg); }
      50% { transform: translateY(0px) rotate(0deg); }
      75% { transform: translateY(-1px) rotate(-0.5deg); }
    }

    @keyframes avatarListening {
      0%, 100% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.02) rotate(1deg); }
    }

    @keyframes avatarSpeaking {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(1.1); }
    }

    @keyframes mouthTalk {
      0%, 100% { 
        height: 15px; 
        border-radius: 0 0 30px 30px;
        transform: scaleX(1);
      }
      25% { 
        height: 20px; 
        border-radius: 15px;
        transform: scaleX(1.2);
      }
      50% { 
        height: 10px; 
        border-radius: 0 0 20px 20px;
        transform: scaleX(0.8);
      }
      75% { 
        height: 18px; 
        border-radius: 10px;
        transform: scaleX(1.1);
      }
    }

    @keyframes eyeBlink {
      0%, 90%, 100% { height: 25px; }
      95% { height: 3px; }
    }

    /* Status states */
    .simple-avatar.listening {
      animation: avatarListening 2s ease-in-out infinite;
    }

    .simple-avatar.listening .avatar-status-ring {
      opacity: 1;
      transform: scale(1);
      border-color: rgba(72, 187, 120, 0.6);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .simple-avatar.speaking {
      animation: avatarSpeaking 0.5s ease-in-out infinite;
    }

    .simple-avatar.speaking .mouth-shape {
      animation: mouthTalk 0.3s ease-in-out infinite;
    }

    .simple-avatar.speaking .avatar-status-ring {
      opacity: 1;
      transform: scale(1);
      border-color: rgba(236, 72, 153, 0.6);
      animation: pulse 0.8s ease-in-out infinite;
    }

    .simple-avatar .eye {
      animation: eyeBlink 4s ease-in-out infinite;
    }

    .simple-avatar .left-eye {
      animation-delay: 0s;
    }

    .simple-avatar .right-eye {
      animation-delay: 0.1s;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }
  `;

  document.head.appendChild(style);

  const avatarElement = container.querySelector('.simple-avatar') as HTMLElement;
  
  let blinkInterval: number | undefined;

  // Random blinking
  function startBlinking() {
    blinkInterval = window.setInterval(() => {
      const eyes = container.querySelectorAll('.eye');
      eyes.forEach(eye => {
        const eyeElement = eye as HTMLElement;
        eyeElement.style.animation = 'eyeBlink 0.3s ease-in-out';
        setTimeout(() => {
          eyeElement.style.animation = '';
        }, 300);
      });
    }, 3000 + Math.random() * 4000);
  }

  startBlinking();

  return {
    container,
    
    setListening(value: boolean) {
      if (value) {
        avatarElement.classList.add('listening');
        avatarElement.classList.remove('speaking');
      } else {
        avatarElement.classList.remove('listening');
      }
    },
    
    setSpeaking(value: boolean) {
      if (value) {
        avatarElement.classList.add('speaking');
        avatarElement.classList.remove('listening');
      } else {
        avatarElement.classList.remove('speaking');
      }
    },
    
    cleanup() {
      if (blinkInterval) clearInterval(blinkInterval);
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }
  };
}

// Usage with audio data (for future integration)
export function updateAvatarWithAudio(avatar: Simple3DAvatar, audioData?: Float32Array) {
  if (!audioData) return;
  
  // Calculate audio amplitude
  let sum = 0;
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i];
  }
  const amplitude = Math.sqrt(sum / audioData.length);
  
  // Update mouth animation based on audio
  const mouthShape = avatar.container.querySelector('.mouth-shape') as HTMLElement;
  if (mouthShape && amplitude > 0.01) {
    const scale = Math.min(1 + amplitude * 2, 2);
    mouthShape.style.transform = `scaleX(${scale})`;
  }
}