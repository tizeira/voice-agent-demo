# Voice Agent Analytics Project - CLAUDE.md

## Project Overview
Voice agent application with OpenAI Realtime API integration and comprehensive analytics system for business intelligence. Deployed on Vercel with Neon PostgreSQL database.

## Bash Commands
- `npm run dev`: Start Vite development server
- `npm run build`: Build the project (TypeScript + Vite)
- `npm run preview`: Preview production build
- `npm run server`: Start Express server for session tokens
- `npm run server:dev`: Start server in watch mode
- `vercel --prod`: Deploy to production

## Code Style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (e.g., `import { foo } from 'bar'`)
- TypeScript strict mode enabled - always use proper types
- Use `neon()` for database connections, not `.query()` syntax
- Rate limiting implemented - test with health endpoints only

## Core Architecture

### Voice Agent (`src/voiceAgent.ts`)
- Uses OpenAI Realtime API with ephemeral tokens
- Integrates ConversationTracker for automatic analytics
- Session-based voice interaction with Clara assistant

### Analytics System (`src/analytics.ts`)
- ConversationTracker class captures all voice interactions
- Automatic 5-minute session tracking for business intelligence
- Shopify integration for e-commerce insights
- Device detection and user behavior tracking

### Database (Neon PostgreSQL)
- `conversation_analytics`: Main conversation data
- `message_analytics`: Individual message metrics  
- `session_events`: Connection/error events
- `daily_metrics`: Aggregated data for dashboards

## API Routes
- `/api/analytics/conversation` (POST): Store conversation data
- `/api/analytics/dashboard` (GET): Retrieve dashboard metrics
- `/session` (GET): Generate ephemeral OpenAI tokens

## Environment Variables
```
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://...@...neon.tech/...
NODE_ENV=production
```

## Rate Limiting
- Strict limits on session creation (10 per minute)
- General API protection (100 requests per 15 minutes)
- **IMPORTANT**: Test only with health endpoints to avoid API costs

## Database Schema Execution
- Use `database/schema_clean.sql` for Neon Console
- Original `schema.sql` has comments that cause Neon errors
- Execute each table creation separately if needed

## Testing Strategy
- Test rate limiting with `/api/health` endpoints only
- Use development environment for voice agent testing
- Analytics system has localStorage fallback for offline testing

## Deployment Workflow
1. **Always run typecheck** before committing: `npm run build`
2. **Test locally** with development server
3. **Deploy manually** with `git push` or `vercel --prod`
4. **Verify** analytics endpoints post-deployment

## Key Files
- `src/main.ts`: Main application entry with voice UI
- `src/types.ts`: TypeScript interfaces for voice agent
- `server.ts`: Express server with rate limiting
- `api/analytics/*`: Vercel serverless functions

## Troubleshooting
- **"Cannot find module '@neondatabase/serverless'"**: Run `npm install`
- **SQL syntax errors in Neon**: Use `schema_clean.sql` without comments
- **Rate limit during testing**: Use health endpoints only
- **TypeScript errors**: Check imports and use proper interfaces from `types.ts`

## Business Intelligence Goals
- Track user conversations with Clara in 5-minute sessions
- Capture e-commerce customer behavior and satisfaction
- Generate insights for Shopify store optimization
- Monitor voice agent performance and user engagement

## Recent Changes (Current Session)
- ✅ Fixed CSS duplication (2832 → 271 lines)
- ✅ Added comprehensive TypeScript interfaces
- ✅ Implemented Express rate limiting
- ✅ Created full analytics system with ConversationTracker
- ✅ Migrated from @vercel/postgres to @neondatabase/serverless
- ✅ Successfully deployed database schema to Neon

## Next Steps
- Deploy updated code to Vercel production
- Test end-to-end analytics flow
- Create dashboard visualization
- Add comprehensive unit tests