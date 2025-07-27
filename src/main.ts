import './style.css';

// Crear la interfaz de usuario
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <h1>🎤 Voice Agent Demo</h1>
    <div class="status" id="status">Inicializando...</div>
    <div class="controls">
      <button id="connectBtn" disabled>Conectar</button>
      <button id="disconnectBtn" disabled>Desconectar</button>
    </div>
    <div class="conversation" id="conversation">
      <p>Haz clic en "Conectar" y permite el acceso al micrófono para comenzar a hablar con el asistente.</p>
    </div>
  </div>
`;

// Referencias a elementos del DOM
const statusEl = document.getElementById('status')!;
const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
const disconnectBtn = document.getElementById('disconnectBtn') as HTMLButtonElement;
const conversationEl = document.getElementById('conversation')!;

// Variables para WebRTC
let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;
let localStream: MediaStream | null = null;

// Función para actualizar el estado
function updateStatus(message: string, isError = false) {
  statusEl.textContent = message;
  statusEl.className = `status ${isError ? 'error' : ''}`;
}

// Función para agregar mensajes a la conversación
function addMessage(role: 'user' | 'assistant', content: string) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;
  messageEl.innerHTML = `<strong>${role === 'user' ? 'Tú' : 'Asistente'}:</strong> ${content}`;
  conversationEl.appendChild(messageEl);
  conversationEl.scrollTop = conversationEl.scrollHeight;
}

// Función para conectar usando WebRTC
async function connect() {
  try {
    updateStatus('Obteniendo token de sesión...');
    
    // Obtener token efímero del servidor (usar endpoint de Vercel en producción)
    const isLocal = window.location.hostname === 'localhost';
    const sessionUrl = isLocal ? 'http://localhost:3000/session' : '/api/session';
    
    const tokenResponse = await fetch(sessionUrl);
    if (!tokenResponse.ok) {
      throw new Error(`Error del servidor: ${tokenResponse.status}`);
    }
    
    const data = await tokenResponse.json();
    const ephemeralKey = data.client_secret.value;
    
    updateStatus('Conectando al agente de voz...');
    
    // Crear peer connection WebRTC
    peerConnection = new RTCPeerConnection();
    
    // Configurar reproductor de audio remoto
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.style.display = 'none'; // Oculto pero funcional
    document.body.appendChild(audioEl);
    
    peerConnection.ontrack = (event) => {
      console.log('Remote audio track received');
      audioEl.srcObject = event.streams[0];
    };
    
    // Solicitar acceso al micrófono
    updateStatus('Solicitando acceso al micrófono...');
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    peerConnection.addTrack(localStream.getTracks()[0]);
    
    // Configurar data channel para eventos
    dataChannel = peerConnection.createDataChannel("oai-events");
    dataChannel.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Realtime event:', data);
        
        // Manejar diferentes tipos de eventos
        if (data.type === 'conversation.item.completed' && data.item?.content) {
          const content = data.item.content[0];
          if (content?.transcript) {
            addMessage('assistant', content.transcript);
          }
        } else if (data.type === 'input_audio_buffer.speech_started') {
          addMessage('user', '[Hablando...]');
        } else if (data.type === 'input_audio_buffer.speech_stopped') {
          // Remover el mensaje temporal de "[Hablando...]"
          const lastMessage = conversationEl.lastElementChild;
          if (lastMessage?.textContent?.includes('[Hablando...]')) {
            lastMessage.remove();
          }
        }
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    });
    
    dataChannel.addEventListener("open", () => {
      console.log('Data channel opened');
      updateStatus('✅ Conectado - Puedes hablar ahora');
      connectBtn.disabled = true;
      disconnectBtn.disabled = false;
      addMessage('assistant', 'Hola! Soy Clara, tu asistente de voz. ¿En qué puedo ayudarte?');
    });
    
    // Crear offer SDP
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Enviar offer a OpenAI Realtime API
    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2025-06-03";
    
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp"
      },
    });
    
    if (!sdpResponse.ok) {
      throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
    }
    
    const answerSdp = await sdpResponse.text();
    const answer = {
      type: "answer" as RTCSdpType,
      sdp: answerSdp,
    };
    
    await peerConnection.setRemoteDescription(answer);
    
  } catch (error: unknown) {
    console.error('Error al conectar:', error);
    updateStatus(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, true);
    cleanup();
  }
}

// Función para limpiar recursos
function cleanup() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
}

// Función para desconectar
function disconnect() {
  cleanup();
  updateStatus('Desconectado');
  connectBtn.disabled = false;
  disconnectBtn.disabled = true;
}

// Event listeners
connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);

// Habilitar el botón de conectar cuando la página esté lista
updateStatus('Listo para conectar');
connectBtn.disabled = false;