# Voice Agent Demo - OpenAI Realtime API

Este proyecto implementa un agente de voz usando la API Realtime de OpenAI, basado en la documentación oficial.

## 🚀 Características

- **Conversación por voz en tiempo real** usando WebRTC
- **Interfaz moderna y responsiva** con gradientes y efectos visuales
- **Servidor backend seguro** para generar tokens efímeros
- **Detección automática de actividad de voz**
- **Soporte para español** con instrucciones personalizadas

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- Una clave API de OpenAI con acceso a la API Realtime
- Navegador web moderno con soporte para WebRTC

## 🛠️ Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   - El archivo `.env` ya está configurado con tu clave API
   - Asegúrate de que `OPENAI_API_KEY` tenga una clave válida

## 🎯 Uso

### Iniciar el servidor backend (Terminal 1):
```bash
npm run server:dev
```
Esto iniciará el servidor en `http://localhost:3000` para generar tokens efímeros.

### Iniciar el frontend (Terminal 2):
```bash
npm run dev
```
Esto iniciará la aplicación web en `http://localhost:5173`.

### Usar la aplicación:
1. Abre `http://localhost:5173` en tu navegador
2. Haz clic en "Conectar"
3. Permite el acceso al micrófono cuando se solicite
4. ¡Comienza a hablar con tu asistente de voz!

## 🏗️ Arquitectura

### Frontend (`src/main.ts`)
- Implementa la interfaz de usuario
- Maneja la conexión WebRTC con la API Realtime
- Gestiona el estado de la conversación

### Backend (`server.ts`)
- Servidor Express.js
- Genera tokens efímeros seguros
- Maneja CORS para el frontend

### Estilos (`src/style.css`)
- Diseño moderno con gradientes
- Modo oscuro y claro
- Animaciones suaves

## 🔧 Configuración Avanzada

### Cambiar la voz del asistente:
En `server.ts`, modifica el parámetro `voice`:
```javascript
body: JSON.stringify({
  model: "gpt-4o-realtime-preview-2025-06-03",
  voice: "alloy", // Opciones: alloy, echo, fable, onyx, nova, shimmer, verse
}),
```

### Personalizar las instrucciones:
En `src/main.ts`, modifica las `instructions` del agente:
```javascript
const agent = new RealtimeAgent({
  name: 'Assistant',
  instructions: 'Tus instrucciones personalizadas aquí...',
});
```

## 📚 Documentación de Referencia

Este proyecto está basado en la documentación oficial de OpenAI:
- `src/quickstart.txt` - Guía de inicio rápido
- `src/realtime.txt` - Documentación completa de la API Realtime
- `src/voiceagents.txt` - Guía para construir agentes de voz

## 🔒 Seguridad

- ✅ Usa tokens efímeros para el cliente
- ✅ La clave API principal solo se usa en el servidor
- ✅ Los tokens expiran automáticamente
- ✅ CORS configurado correctamente

## 🐛 Solución de Problemas

### Error de conexión:
- Verifica que el servidor backend esté ejecutándose en el puerto 3000
- Asegúrate de que la clave API de OpenAI sea válida

### Sin audio:
- Verifica que el navegador tenga permisos de micrófono
- Usa HTTPS en producción para WebRTC

### Error de CORS:
- Asegúrate de que ambos servidores estén ejecutándose
- Verifica la configuración de CORS en `server.ts`

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo frontend
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Vista previa de la build de producción
- `npm run server` - Inicia el servidor backend
- `npm run server:dev` - Inicia el servidor backend en modo desarrollo

## 🚀 Despliegue

Para producción:
1. Construye el frontend: `npm run build`
2. Configura variables de entorno en tu servidor
3. Usa HTTPS para WebRTC
4. Considera usar un proxy reverso para ambos servicios

---

¡Disfruta construyendo con la API Realtime de OpenAI! 🎤✨