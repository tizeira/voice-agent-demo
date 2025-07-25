import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
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

// Crear el agente
const agent = new RealtimeAgent({
  name: 'Assistant',
  instructions: 'Eres un asistente útil que habla en español. Responde de manera amigable y concisa.',
});

let session: RealtimeSession | null = null;

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

// Función para conectar
async function connect() {
  try {
    updateStatus('Obteniendo token de sesión...');
    
    // Obtener token efímero del servidor
    const tokenResponse = await fetch('http://localhost:3000/session');
    if (!tokenResponse.ok) {
      throw new Error(`Error del servidor: ${tokenResponse.status}`);
    }
    
    const data = await tokenResponse.json();
    const ephemeralKey = data.client_secret.value;
    
    updateStatus('Conectando al agente de voz...');
    
    // Crear sesión
    session = new RealtimeSession(agent, {
      model: 'gpt-4o-realtime-preview-2025-06-03',
    });
    
    // Configurar eventos de la sesión
    session.on('transport_event', (event) => {
      if (event.type === 'session.created') {
        updateStatus('✅ Conectado - Puedes hablar ahora');
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        addMessage('assistant', 'Hola! Soy tu asistente de voz. ¿En qué puedo ayudarte?');
      }
    });
    
    session.on('error', (error) => {
      console.error('Error de sesión:', error);
      updateStatus(`Error: ${error.error}`, true);
    });
    
    // Conectar con el token efímero
    await session.connect({
      apiKey: ephemeralKey,
    });
    
  } catch (error) {
    console.error('Error al conectar:', error);
    updateStatus(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, true);
  }
}

// Función para desconectar
function disconnect() {
  if (session) {
    session.close();
    updateStatus('Desconectado');
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    session = null;
  }
}

// Event listeners
connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);

// Habilitar el botón de conectar cuando la página esté lista
updateStatus('Listo para conectar');
connectBtn.disabled = false;