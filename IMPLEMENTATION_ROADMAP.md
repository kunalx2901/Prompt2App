# Prompt2App - Implementation Roadmap

## Complete Step-by-Step Implementation Guide

This document contains all implementation steps organized by phase. Follow these steps sequentially to build the Prompt2App platform.

---

## PHASE 1: Project Setup & Infrastructure (6 steps)

### 1.1 Configure Cloudflare Workers, R2, and project structure
**Step:** Set up project infrastructure

### 1.2 Create React frontend project with Tailwind CSS
**Step:** Initialize a new React project using Vite
- [ ] Run: `npm create vite@latest frontend -- --template react`
- [ ] Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`
- [ ] Initialize Tailwind: `npx tailwindcss init -p`
- [ ] Configure Tailwind for React components

### 1.3 Initialize Cloudflare Workers project
**Step:** Set up Cloudflare Workers with wrangler
- [ ] Install wrangler globally: `npm install -g @latest`
- [ ] Run: `npm create cloudflare@latest backend -- --type hello-world`
- [ ] Create `wrangler.toml` with configuration
- [ ] Set up environment variables for API keys

### 1.4 Configure Cloudflare R2 bucket for persistent file storage
**Step:** Set up R2 object storage
- [ ] Create R2 bucket in Cloudflare dashboard
- [ ] Configure R2 API credentials
- [ ] Set up CORS rules for bucket access
- [ ] Create bucket naming: `{userId}/{projectId}/files`

### 1.5 Set up Durable Objects binding in wrangler.toml
**Step:** Configure Durable Objects
- [ ] Add Durable Objects binding in `wrangler.toml`
- [ ] Define migration for Durable Objects
- [ ] Set up script_name binding

### 1.6 Create project folder structure
**Step:** Organize codebase
- [ ] Create `/frontend` directory for React app
- [ ] Create `/backend` directory for Cloudflare Workers
- [ ] Create `/src` subdirectories for components, utils, types
- [ ] Create `/docs` for documentation
- [ ] Create root `.env.example` file

---

## PHASE 2: Frontend UI Components (7 steps)

### 2.1 Install and configure Monaco Editor in React
**Step:** Set up code editor
- [ ] Install Monaco Editor: `npm install @monaco-editor/react`
- [ ] Create EditorComponent.jsx
- [ ] Configure editor language options (javascript, json)
- [ ] Set default theme and font size

### 2.2 Build File Explorer component
**Step:** Create folder tree hierarchy display
- [ ] Create FileExplorer.jsx component
- [ ] Implement recursive folder structure rendering
- [ ] Add file/folder icons
- [ ] Implement click handlers for file selection
- [ ] Add folder expansion/collapse functionality

### 2.3 Implement file create, rename, delete operations in UI
**Step:** Add file operation UI elements
- [ ] Add "New File" button functionality
- [ ] Implement context menu for files/folders
- [ ] Create rename modal dialog
- [ ] Add delete confirmation dialog
- [ ] Update file explorer state on operations

### 2.4 Create Prompt Input component
**Step:** Build natural language prompt input
- [ ] Create PromptInput.jsx component
- [ ] Add textarea for prompt entry
- [ ] Add character count display
- [ ] Implement prompt length validation (max 5000 chars)
- [ ] Add "Generate" button with loading state
- [ ] Add error message display area

### 2.5 Implement Expo Snack iframe container for preview
**Step:** Set up preview environment
- [ ] Create PreviewContainer.jsx component
- [ ] Set up iframe element with Expo Snack URL
- [ ] Configure iframe sandbox attributes
- [ ] Add iframe loading spinner
- [ ] Implement refresh functionality

### 2.6 Add QR code generation library and component
**Step:** Implement QR code display
- [ ] Install QR library: `npm install qrcode.react`
- [ ] Create QRCodeDisplay.jsx component
- [ ] Generate QR code from snackId
- [ ] Add "Copy QR Code" button
- [ ] Display Expo Go download link

### 2.7 Build layout with split view (editor | preview)
**Step:** Create main application layout
- [ ] Create Layout.jsx component
- [ ] Implement CSS Grid for split view
- [ ] Add resizable divider between editor and preview
- [ ] Add sidebar for file explorer
- [ ] Implement responsive layout for mobile

---

## PHASE 3: WebSocket Client & Real-Time Communication (5 steps)

### 3.1 Create WebSocket client with auto-reconnect logic
**Step:** Implement WebSocket connection
- [ ] Create hooks/useWebSocket.js
- [ ] Implement WebSocket connection initialization
- [ ] Add URL configuration for development/production
- [ ] Implement auto-reconnect on disconnect
- [ ] Add connection state management (connecting, connected, error)

### 3.2 Implement message format handlers
**Step:** Create message protocol handlers
- [ ] Define message types: UPDATE_FILE, SYNC_COMPLETE, PREVIEW_READY
- [ ] Create message handler for each type
- [ ] Implement message validation
- [ ] Add error message handling
- [ ] Create message queuing for offline scenarios

### 3.3 Add debounce logic (800-1200ms) for file changes
**Step:** Optimize network usage
- [ ] Install: `npm install lodash.debounce`
- [ ] Create debounced file update function
- [ ] Implement debounce timer display in UI (optional)
- [ ] Test debounce timing (start with 800ms)

### 3.4 Implement exponential backoff reconnection strategy
**Step:** Handle reconnection failures gracefully
- [ ] Implement exponential backoff algorithm
- [ ] Start with 1s delay, cap at 30s
- [ ] Add jitter to prevent thundering herd
- [ ] Log reconnection attempts
- [ ] Add max retry limit with user notification

### 3.5 Add error recovery and state synchronization on reconnect
**Step:** Ensure data consistency
- [ ] Implement checksum validation on reconnect
- [ ] Send local buffer state to server for sync
- [ ] Merge remote and local changes
- [ ] Notify user of sync conflicts
- [ ] Implement conflict resolution strategy

---

## PHASE 4: Backend - Cloudflare Workers API Layer (8 steps)

### 4.1 Create POST /generate endpoint for project creation
**Step:** Build project generation endpoint
- [ ] Create `/src/api/generate.js` in backend
- [ ] Define request body schema (prompt, userId)
- [ ] Implement response structure
- [ ] Test with curl/Postman

### 4.2 Implement prompt validation
**Step:** Validate input
- [ ] Add input length validation (50-5000 chars)
- [ ] Implement XSS sanitization
- [ ] Add character whitelist validation
- [ ] Return helpful error messages

### 4.3 Integrate AI API (Gemini/HuggingFace) and handle responses
**Step:** Connect to AI service
- [ ] Install AI SDK (e.g., `npm install @google/generative-ai`)
- [ ] Create AI prompt template in `/src/prompts/generation.prompt`
- [ ] Implement AI API call with timeout (30s)
- [ ] Handle streaming responses
- [ ] Parse AI response with error handling

### 4.4 Validate AI response JSON format and file structure
**Step:** Ensure code quality
- [ ] Create JSON schema validator
- [ ] Validate response is valid JSON
- [ ] Check required files: App.js, package.json, app.json
- [ ] Validate file paths are relative
- [ ] Validate React Native syntax (basic checks)

### 4.5 Create WebSocket upgrade handler in Worker
**Step:** Enable real-time communication
- [ ] Create `/src/websocket/handler.js`
- [ ] Implement WebSocket upgrade in Worker
- [ ] Extract projectId from connection URL
- [ ] Route WebSocket to Durable Object
- [ ] Handle upgrade errors

### 4.6 Implement JWT/auth token validation middleware
**Step:** Secure endpoints
- [ ] Create `/src/middleware/auth.js`
- [ ] Implement JWT verification
- [ ] Extract userId from token
- [ ] Add CORS validation
- [ ] Return 401 for invalid tokens

### 4.7 Add rate limiting and security headers
**Step:** Protect against abuse
- [ ] Implement rate limiter (10 requests per minute per IP)
- [ ] Add security headers (X-Frame-Options, X-Content-Type-Options)
- [ ] Add HSTS header
- [ ] Implement CORS policy
- [ ] Log rate limit violations

### 4.8 Generate unique projectId and route to Durable Object
**Step:** Create project sessions
- [ ] Generate UUID for projectId
- [ ] Store mapping in R2 (userId → projectIds)
- [ ] Create Durable Object stub
- [ ] Pass AI response to Durable Object
- [ ] Return projectId and preview URL to client

---

## PHASE 5: Durable Objects - State Management & Persistence (11 steps)

### 5.1 Create Durable Object class with state initialization
**Step:** Build Durable Object main class
- [ ] Create `/src/durable-objects/ProjectSession.js`
- [ ] Extend DurableObject class
- [ ] Implement constructor and initialize()
- [ ] Add state property initialization
- [ ] Implement fetch() handler

### 5.2 Implement file tree data structure
**Step:** Create in-memory file system
- [ ] Create file tree structure: `Map<path, content>`
- [ ] Implement addFile(path, content) method
- [ ] Implement deleteFile(path) method
- [ ] Implement getFile(path) method
- [ ] Implement getFileTree() method returning full tree structure

### 5.3 Add R2 hydration logic on first request
**Step:** Load project from storage
- [ ] Implement state.blockConcurrencyWhile() for safe hydration
- [ ] Create R2 client in Durable Object
- [ ] Fetch projectMetadata from R2
- [ ] Fetch all files with key pattern: `userId/projectId/*`
- [ ] Populate in-memory file tree
- [ ] Set hydration state flag

### 5.4 Implement WebSocket message handler in Durable Object
**Step:** Process client messages
- [ ] Create WebSocket handler in Durable Object
- [ ] Implement handleMessage(message) function
- [ ] Add message type routing (UPDATE_FILE, DELETE_FILE, etc.)
- [ ] Parse JSON messages safely
- [ ] Handle malformed messages

### 5.5 Create UPDATE_FILE operation
**Step:** Handle file updates
- [ ] Implement processUpdateFile(path, content) function
- [ ] Validate file path (no path traversal)
- [ ] Update in-memory file tree
- [ ] Queue R2 write operation
- [ ] Queue Snack API update
- [ ] Reset inactivity timer

### 5.6 Implement async R2 write for file persistence
**Step:** Persist changes to storage
- [ ] Create writeFileToR2(path, content) function
- [ ] Handle R2 write errors with retry logic
- [ ] Update file hash in metadata
- [ ] Log write operations
- [ ] Update lastModified timestamp

### 5.7 Create Expo Snack synchronization logic
**Step:** Sync with preview service
- [ ] Create syncToSnack(fileTree) function
- [ ] Format file tree for Snack API
- [ ] Implement Snack API client
- [ ] Handle snackId caching
- [ ] Implement update vs. create logic

### 5.8 Implement concurrency control with state.blockConcurrencyWhile()
**Step:** Prevent race conditions
- [ ] Wrap R2 write operations in blockConcurrencyWhile()
- [ ] Ensure atomic file updates
- [ ] Document concurrency model
- [ ] Test with concurrent file updates

### 5.9 Add inactivity timer (30 mins) for DO hibernation
**Step:** Implement cleanup
- [ ] Create resetInactivityTimer() function
- [ ] Set timer to 30 minutes
- [ ] On timeout: persist to R2 and closeAllWebSockets()
- [ ] Release Durable Object instance
- [ ] Allow re-hydration on next request

### 5.10 Implement DO lifecycle states
**Step:** Track session state
- [ ] Create state enum: INITIAL, HYDRATING, ACTIVE, PROCESSING, PERSISTENCE, HIBERNATION
- [ ] Implement state transitions
- [ ] Add state logging
- [ ] Handle state-specific operations

### 5.11 Broadcast messages to connected WebSocket clients
**Step:** Support multiple connections
- [ ] Maintain WebSocket client set in Durable Object
- [ ] Implement broadcast(message) function
- [ ] Send PREVIEW_READY to all clients
- [ ] Handle disconnected client cleanup

---

## PHASE 6: Expo Snack Integration & Preview (7 steps)

### 6.1 Create Expo Snack API client
**Step:** Implement Snack communication
- [ ] Create `/src/services/snack-client.js`
- [ ] Implement SnackAPI class
- [ ] Add API endpoint configuration
- [ ] Implement HTTP client with timeout (15s)

### 6.2 Implement initial project upload to Expo Snack
**Step:** Create Snack session
- [ ] Implement createSnackProject(fileTree) function
- [ ] Format files for Snack API (files array)
- [ ] Include package.json and app.json
- [ ] Handle Snack API response
- [ ] Extract snackId from response

### 6.3 Handle Snack response (snackId, preview URL, QR code)
**Step:** Process preview information
- [ ] Parse snackId from response
- [ ] Generate preview URL
- [ ] Encode QR code data
- [ ] Send PREVIEW_READY message to client

### 6.4 Send PREVIEW_READY message to client after Snack sync
**Step:** Notify client of updates
- [ ] Create PREVIEW_READY message format
- [ ] Include snackId, previewUrl, qrCode
- [ ] Send via WebSocket broadcast
- [ ] Include timestamp

### 6.5 Implement iframe refresh on preview updates
**Step:** Update preview display
- [ ] Trigger iframe src update on PREVIEW_READY
- [ ] Update QR code display
- [ ] Show loading indicator during update
- [ ] Add success/error notifications

### 6.6 Add retry logic for failed Snack API calls
**Step:** Handle failures gracefully
- [ ] Implement retry with exponential backoff
- [ ] Max 3 retries with increasing delays
- [ ] Log retry attempts
- [ ] Fall back to previous snackId if all retries fail

### 6.7 Handle Snack errors and propagate to frontend
**Step:** Error reporting
- [ ] Catch Snack API errors
- [ ] Parse error messages
- [ ] Send ERROR message to client
- [ ] Display user-friendly error messages
- [ ] Log errors for debugging

---

## PHASE 7: R2 Object Storage - File Persistence (6 steps)

### 7.1 Initialize R2 client in Durable Object
**Step:** Set up storage access
- [ ] Import R2 binding in Durable Object
- [ ] Create R2 client instance
- [ ] Test R2 connectivity

### 7.2 Create R2 key format: user_id/project_id/file_path
**Step:** Establish storage structure
- [ ] Define key pattern
- [ ] Create helper function: generateR2Key(userId, projectId, filePath)
- [ ] Document key format
- [ ] Handle special characters in paths

### 7.3 Implement bulk write on project generation
**Step:** Save initial project files
- [ ] Create saveBulkFilesToR2(fileTree) function
- [ ] Iterate through all files
- [ ] Write each file individually
- [ ] Store metadata: projectId, userId, createdAt
- [ ] Handle write errors

### 7.4 Implement individual file update writes to R2
**Step:** Persist incremental changes
- [ ] Implement updateFileInR2(path, content) function
- [ ] Update individual file object
- [ ] Update file metadata (content_hash, updatedAt)
- [ ] Handle concurrent writes safely

### 7.5 Implement file deletion from R2
**Step:** Remove files from storage
- [ ] Implement deleteFileFromR2(path) function
- [ ] Delete object from R2
- [ ] Remove from metadata
- [ ] Handle deletion errors

### 7.6 Add R2 read logic for DO recovery on crash
**Step:** Recover from failures
- [ ] Implement loadProjectFromR2(userId, projectId) function
- [ ] Fetch file list with prefix
- [ ] Load each file content
- [ ] Validate integrity
- [ ] Return complete file tree

---

## PHASE 8: Data Flow & Integration Testing (6 steps)

### 8.1 Test end-to-end project generation flow
**Step:** Verify generation pipeline
- [ ] Create test prompt
- [ ] Call /generate endpoint
- [ ] Verify Worker receives request
- [ ] Verify AI API is called
- [ ] Verify response is validated
- [ ] Verify Durable Object is created
- [ ] Verify files are in R2
- [ ] Verify Snack preview is created
- [ ] Verify projectId is returned

### 8.2 Test real-time file update flow
**Step:** Verify edit → preview pipeline
- [ ] Connect WebSocket to project
- [ ] Edit file in Monaco Editor
- [ ] Verify debounce delays message
- [ ] Verify message reaches Durable Object
- [ ] Verify file tree updated in memory
- [ ] Verify file written to R2
- [ ] Verify Snack is updated
- [ ] Verify PREVIEW_READY received on frontend
- [ ] Verify preview iframe refreshes

### 8.3 Test DO hydration on crash recovery
**Step:** Verify persistence works
- [ ] Create project with files
- [ ] Force terminate Durable Object (manually)
- [ ] Make new request to same projectId
- [ ] Verify DO hydrates from R2
- [ ] Verify file tree is reconstructed
- [ ] Verify in-memory state matches R2

### 8.4 Test WebSocket reconnection and state sync
**Step:** Verify reliability
- [ ] Connect WebSocket
- [ ] Simulate network disconnect
- [ ] Wait for reconnect timeout
- [ ] Verify exponential backoff works
- [ ] Verify state sync on reconnect
- [ ] Make changes during disconnect
- [ ] Verify changes are sent on reconnect
- [ ] Verify no duplicate messages

### 8.5 Test file create, rename, delete operations
**Step:** Verify file management
- [ ] Test CREATE_FILE message
- [ ] Test RENAME_FILE message
- [ ] Test DELETE_FILE message
- [ ] Verify UI updates correctly
- [ ] Verify R2 reflects changes
- [ ] Verify preview updates
- [ ] Test invalid paths (../etc/passwd)

### 8.6 Test concurrent file updates from multiple clients
**Step:** Verify multi-client handling
- [ ] Open project in 2+ browser tabs
- [ ] Edit same file from both tabs
- [ ] Verify one change wins (last-write-wins or conflict notification)
- [ ] Verify state consistency
- [ ] Verify no data corruption

---

## PHASE 9: Error Handling & Edge Cases (7 steps)

### 9.1 Add AI API timeout handling
**Step:** Handle slow AI responses
- [ ] Implement 30-second timeout on AI API call
- [ ] Catch timeout error
- [ ] Retry with user notification
- [ ] Return helpful error message
- [ ] Log timeout incidents

### 9.2 Implement invalid AI response handling
**Step:** Validate AI output
- [ ] Catch JSON parse errors
- [ ] Validate required files present
- [ ] Validate file contents
- [ ] Show error to user
- [ ] Suggest regeneration

### 9.3 Add R2 persistence failure recovery
**Step:** Handle storage errors
- [ ] Implement retry logic for R2 writes
- [ ] Keep file in memory during retry
- [ ] Notify user if write fails permanently
- [ ] Log R2 errors

### 9.4 Handle WebSocket disconnection and reconnection edge cases
**Step:** Ensure stability
- [ ] Test sudden disconnect
- [ ] Test message sent during disconnect
- [ ] Test disconnect during R2 write
- [ ] Test multiple rapid reconnects
- [ ] Verify no messages are lost

### 9.5 Add Snack API failure handling
**Step:** Handle preview errors
- [ ] Catch Snack API errors (400, 500, timeout)
- [ ] Retry failed requests
- [ ] Show error notification to user
- [ ] Cache last successful snackId as fallback
- [ ] Log Snack API errors

### 9.6 Implement input validation and sanitization
**Step:** Prevent injection attacks
- [ ] Validate all user inputs
- [ ] Sanitize file paths (no ../)
- [ ] Sanitize file content (basic)
- [ ] Validate prompt length/characters
- [ ] Use parameterized queries/APIs

### 9.7 Add error logging and monitoring
**Step:** Track issues
- [ ] Configure Cloudflare Logpush
- [ ] Set up Sentry error tracking
- [ ] Log errors with context (userId, projectId)
- [ ] Create error dashboard
- [ ] Set up error alerts

---

## PHASE 10: Performance Optimization (5 steps)

### 10.1 Optimize debounce timing
**Step:** Find optimal balance
- [ ] Test debounce at 800ms
- [ ] Test debounce at 1000ms
- [ ] Test debounce at 1200ms
- [ ] Measure network traffic impact
- [ ] Measure preview update latency
- [ ] Document findings

### 10.2 Implement file compression for R2 storage
**Step:** Reduce costs (optional)
- [ ] Evaluate gzip compression
- [ ] Test compression ratio
- [ ] Measure CPU impact
- [ ] Implement transparent compression
- [ ] Decompress on read

### 10.3 Optimize Snack API payload
**Step:** Send only necessary data
- [ ] Implement diff detection (current vs. new files)
- [ ] Send only changed files to Snack
- [ ] Maintain file hash for comparison
- [ ] Measure payload size reduction
- [ ] Test with large projects

### 10.4 Add caching headers for static assets
**Step:** Reduce bandwidth
- [ ] Configure Cache-Control headers
- [ ] Set max-age for JS/CSS assets
- [ ] Enable browser caching
- [ ] Enable Cloudflare cache
- [ ] Test cache effectiveness

### 10.5 Monitor and optimize Worker cold start time
**Step:** Improve latency
- [ ] Measure current cold start time
- [ ] Profile Worker code
- [ ] Reduce bundle size
- [ ] Optimize imports
- [ ] Use Workers KV for frequent lookups

---

## PHASE 11: Security & Compliance (7 steps)

### 11.1 Implement API key management
**Step:** Secure credentials
- [ ] Store AI API keys in Cloudflare Secrets
- [ ] Implement key rotation policy
- [ ] Never log API keys
- [ ] Use environment-specific keys
- [ ] Document key management

### 11.2 Add CORS security headers and configuration
**Step:** Control cross-origin access
- [ ] Define allowed origins
- [ ] Set Access-Control-Allow-Origin
- [ ] Set Access-Control-Allow-Methods
- [ ] Set Access-Control-Allow-Headers
- [ ] Test CORS with curl

### 11.3 Implement XSS prevention
**Step:** Prevent script injection
- [ ] Sanitize all user inputs
- [ ] Use innerHTML safely
- [ ] Implement Content Security Policy (CSP)
- [ ] Escape file paths
- [ ] Test with XSS payloads

### 11.4 Add rate limiting per IP/user
**Step:** Prevent abuse
- [ ] Implement per-IP rate limiting (Worker)
- [ ] Implement per-user rate limiting (authenticated)
- [ ] Set limits: 10 req/min for /generate
- [ ] Return 429 (Too Many Requests) when exceeded
- [ ] Add Retry-After header

### 11.5 Implement data isolation between tenants
**Step:** Prevent data leakage
- [ ] Verify userId in all requests
- [ ] Namespace R2 keys by userId
- [ ] Verify Durable Object access by userId
- [ ] Audit data access paths
- [ ] Test with multiple users

### 11.6 Add Content Security Policy (CSP) headers
**Step:** Restrict resource loading
- [ ] Define CSP policy
- [ ] Allow only necessary domains
- [ ] Disable inline scripts
- [ ] Test CSP with DevTools
- [ ] Handle violations

### 11.7 Conduct security audit of all endpoints
**Step:** Final security review
- [ ] Review all Worker endpoints
- [ ] Check authentication/authorization
- [ ] Validate input sanitization
- [ ] Test error messages (no info leakage)
- [ ] Review WebSocket security
- [ ] Test for common vulnerabilities (OWASP Top 10)

---

## PHASE 12: Testing & Quality Assurance (7 steps)

### 12.1 Write unit tests for Worker API endpoints
**Step:** Test backend logic
- [ ] Set up testing framework (Vitest/jest)
- [ ] Test /generate endpoint
- [ ] Test prompt validation
- [ ] Test error handling
- [ ] Achieve 80%+ coverage

### 12.2 Write unit tests for Durable Object logic
**Step:** Test state management
- [ ] Test file tree operations (add, delete, update)
- [ ] Test R2 hydration
- [ ] Test WebSocket message handling
- [ ] Test inactivity timer
- [ ] Test state transitions

### 12.3 Write unit tests for frontend components
**Step:** Test UI logic
- [ ] Test FileExplorer component
- [ ] Test EditorComponent
- [ ] Test WebSocket client hook
- [ ] Test debounce logic
- [ ] Achieve 80%+ coverage

### 12.4 Write integration tests for end-to-end flows
**Step:** Test complete workflows
- [ ] Test project generation flow
- [ ] Test file edit flow
- [ ] Test file operations flow
- [ ] Test reconnection flow
- [ ] Test error recovery

### 12.5 Test with various Expo project configurations
**Step:** Verify compatibility
- [ ] Test with minimal project
- [ ] Test with navigation
- [ ] Test with external dependencies
- [ ] Test with TypeScript
- [ ] Test with assets/images

### 12.6 Performance testing and load testing
**Step:** Verify scalability
- [ ] Load test /generate endpoint (100 concurrent requests)
- [ ] Load test WebSocket connections (100 concurrent)
- [ ] Load test R2 writes (concurrent files)
- [ ] Measure response times
- [ ] Identify bottlenecks

### 12.7 Cross-browser compatibility testing
**Step:** Ensure universal access
- [ ] Test Chrome/Chromium
- [ ] Test Firefox
- [ ] Test Safari
- [ ] Test Edge
- [ ] Test mobile browsers (iOS Safari, Chrome Android)

---

## PHASE 13: Deployment & Monitoring (7 steps)

### 13.1 Deploy frontend to Cloudflare Pages
**Step:** Host static assets
- [ ] Build frontend: `npm run build`
- [ ] Deploy to Cloudflare Pages: `wrangler pages deploy dist`
- [ ] Configure custom domain
- [ ] Set up automatic deployments (GitHub integration)
- [ ] Test production build

### 13.2 Deploy Worker to Cloudflare Workers
**Step:** Deploy backend API
- [ ] Build Worker: `wrangler build`
- [ ] Set production secrets: `wrangler secret put`
- [ ] Deploy: `wrangler publish`
- [ ] Configure routes in wrangler.toml
- [ ] Test production endpoints

### 13.3 Configure production R2 bucket
**Step:** Set up production storage
- [ ] Create production R2 bucket
- [ ] Migrate dev data if needed
- [ ] Set up bucket lifecycle policies
- [ ] Configure versioning
- [ ] Set up access logs

### 13.4 Set up Cloudflare Logpush for monitoring
**Step:** Enable log aggregation
- [ ] Configure Logpush destination (S3/GCS/Sumo Logic)
- [ ] Enable HTTP request logs
- [ ] Enable API activity logs
- [ ] Test log delivery
- [ ] Create log retention policies

### 13.5 Configure error tracking (Sentry)
**Step:** Monitor errors
- [ ] Create Sentry project
- [ ] Integrate Sentry SDK in Worker
- [ ] Integrate Sentry SDK in frontend
- [ ] Set up alerts for critical errors
- [ ] Create error dashboard

### 13.6 Add custom metrics for generation_time and active_sessions
**Step:** Track key performance indicators
- [ ] Implement generation_time metric
- [ ] Implement active_sessions counter
- [ ] Send metrics to monitoring service
- [ ] Create Grafana dashboard
- [ ] Set performance SLOs

### 13.7 Set up monitoring alerts
**Step:** Get notified of issues
- [ ] Alert on error rate > 1%
- [ ] Alert on generation time > 30s
- [ ] Alert on R2 write failures
- [ ] Alert on Snack API failures
- [ ] Configure slack/email notifications

---

## PHASE 14: Documentation & Launch (5 steps)

### 14.1 Write user guide and tutorial documentation
**Step:** Create user-facing docs
- [ ] Write "Getting Started" guide
- [ ] Create step-by-step tutorial
- [ ] Write FAQ section
- [ ] Create video tutorials (optional)
- [ ] Document keyboard shortcuts
- [ ] Create troubleshooting guide

### 14.2 Document API endpoints and WebSocket protocol
**Step:** Create developer documentation
- [ ] Document all Worker endpoints
- [ ] Document WebSocket message types
- [ ] Create request/response examples
- [ ] Create error code reference
- [ ] Write authentication guide
- [ ] Create cURL/Postman examples

### 14.3 Create deployment and maintenance documentation
**Step:** Document operations
- [ ] Create deployment checklist
- [ ] Document rollback procedures
- [ ] Create runbook for common issues
- [ ] Document backup/recovery procedures
- [ ] Document scaling procedures
- [ ] Create monitoring setup guide

### 14.4 Create architecture diagrams and system overview
**Step:** Document system design
- [ ] Create component diagram
- [ ] Create data flow diagram
- [ ] Create deployment diagram
- [ ] Create sequence diagrams for key flows
- [ ] Document design decisions
- [ ] Document trade-offs

### 14.5 Prepare public launch and announcement
**Step:** Go live
- [ ] Write launch announcement
- [ ] Prepare social media posts
- [ ] Notify early access users
- [ ] Set up product hunt launch (optional)
- [ ] Create changelog
- [ ] Monitor for issues post-launch

---

## Summary

**Total Steps: 75 steps across 14 phases**

- **Phase 1:** 6 steps - Infrastructure
- **Phase 2:** 7 steps - Frontend UI
- **Phase 3:** 5 steps - Real-time Communication
- **Phase 4:** 8 steps - Backend API
- **Phase 5:** 11 steps - State Management
- **Phase 6:** 7 steps - Preview Integration
- **Phase 7:** 6 steps - Persistence
- **Phase 8:** 6 steps - Testing
- **Phase 9:** 7 steps - Error Handling
- **Phase 10:** 5 steps - Performance
- **Phase 11:** 7 steps - Security
- **Phase 12:** 7 steps - QA
- **Phase 13:** 7 steps - Deployment
- **Phase 14:** 5 steps - Documentation

Follow these steps sequentially for a successful implementation. Mark each step as complete before moving to the next.
