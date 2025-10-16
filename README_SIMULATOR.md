# Forest Shuffle API Simulator

An educational split-screen web application for learning and experimenting with the Forest Shuffle Game API.

## 🎯 Purpose

This is an educational tool designed to help developers understand the Forest Shuffle API by providing:

1. **Visual Game Simulation**: Interactive UI to control game actions and see game state updates
2. **Live Code Display**: Real-time view of the exact JavaScript code being executed for each API call
3. **Request/Response Inspection**: See both the code and the actual API responses side-by-side

## 🚀 Features

### Split-Screen Interface

- **Left Panel**: User interaction controls and game state visualization
  - Create and manage games
  - Add players
  - Perform game actions (draw cards, play trees, play dwellers, end turns)
  - Visual representation of game state, player hands, and trees

- **Right Panel**: Live code execution viewer
  - Shows the exact JavaScript/fetch code used for each API call
  - Displays request bodies and response data
  - Color-coded syntax highlighting
  - Execution history with clickable timeline

### Supported API Operations

#### Setup Operations
- ✅ Health Check (`GET /health`)
- ✅ Create Game (`POST /games`)
- ✅ Add Players (`POST /games/:gameId/players`)
- ✅ Start Game (`POST /games/:gameId/start`)

#### Game Actions
- ✅ Draw Cards (`POST /games/:gameId/actions/draw`)
- ✅ Play Tree (`POST /games/:gameId/actions/play-tree`)
- ✅ Play Dweller (`POST /games/:gameId/actions/play-dweller`)
- ✅ End Turn (`POST /games/:gameId/actions/end-turn`)

#### Query Operations
- ✅ Get Game State (`GET /games/:gameId/state`)
- ✅ Get Event History (`GET /games/:gameId/events`)

## 📋 Prerequisites

- Node.js 18+ or Bun
- Access to a running Forest Shuffle Backend API (default: `http://localhost:3000`)

## 🛠️ Installation

```bash
# Clone or navigate to the project
cd forest-shuffle-simulator

# Install dependencies
bun install
# or
npm install

# Start the development server
bun run dev
# or
npm run dev
```

The simulator will be available at `http://localhost:3000`

## 📖 How to Use

### 1. Connect to the API

When you first open the simulator:
1. Enter the Forest Shuffle Backend API URL (default: `http://localhost:3000`)
2. Click "Connect to API"

### 2. Create a Game

Navigate to the **Setup** tab:
1. Enter a game name (e.g., "My First Game")
2. Enter an owner ID (e.g., "player1")
3. Set max players (2-8)
4. Click "Create Game"

Watch the right panel to see the exact `fetch()` code and response!

### 3. Add Players

Still in the **Setup** tab:
1. Enter a player ID (e.g., "player2")
2. Enter a display name (e.g., "Player 2")
3. Click "Add Player"
4. Repeat to add the owner as well

### 4. Start the Game

In the **Setup** tab:
1. Click "Start Game"
2. Watch the game state update on the left panel
3. See the API code and response on the right panel

### 5. Play the Game

Switch to the **Actions** tab:
1. **Draw Cards**: Select sources (DECK or CLEARING) and draw 2 cards
2. **Play Tree**: Enter a tree card ID from your hand and optional payment cards
3. **Play Dweller**: Enter dweller card ID, tree index, position, and payment
4. **End Turn**: Pass to the next player

The game state automatically updates after each action!

### 6. Query Game State

Switch to the **Query** tab:
1. **Get Game State**: Fetch the current game state
2. **Get Events**: View the last 50 game events

### 7. Check API Health

Switch to the **Health** tab:
1. Click "Check API Health"
2. Verify the backend is running

## 🎓 Educational Features

### Code Learning

Every action shows you:
- The exact `fetch()` call with URL, method, headers, and body
- Proper JSON stringification of request data
- Error handling with try-catch
- Response parsing with `.json()`

### Game State Understanding

The left panel visualizes:
- Current game phase and status
- Active player indicator
- Winter card count (game ends at 3)
- Deck and clearing sizes
- Each player's hand, trees, and dwellers
- Player scores

### Idempotency in Action

Notice how each request includes a unique `client_id`:
```javascript
client_id: `draw-${playerId}-${Date.now()}`
```

This prevents duplicate actions if you retry a request!

## 🔧 Configuration

### Changing the API URL

You can connect to any Forest Shuffle API instance:
- Local development: `http://localhost:3000`
- Remote server: `https://your-api.example.com`
- Different port: `http://localhost:8080`

### Example Card IDs

Use these sample card IDs when testing:
- Trees: `tree-oak-1`, `tree-birch-2`, `tree-beech-3`
- Dwellers: `dweller-bird-1`, `dweller-fox-2`, `dweller-butterfly-3`

Note: The actual card IDs depend on your backend's deck composition.

## 📊 Understanding the Code Display

The right panel shows three sections:

1. **Execution History** (top)
   - Chronological list of all API calls
   - Click any item to view its code
   - Errors highlighted in red

2. **Request Code** (middle)
   - The exact JavaScript code used
   - Syntax-highlighted for readability
   - Shows URL, method, headers, and body

3. **Response/Error** (bottom)
   - JSON response from the API
   - Error messages if the call failed
   - Formatted and syntax-highlighted

## 🐛 Troubleshooting

### "Failed to fetch" error
- Ensure the Forest Shuffle backend is running
- Check the API URL is correct
- Verify CORS is enabled on the backend

### "Game not found" error
- Make sure you created a game first
- Check the game ID is valid

### "Not your turn" error
- Wait for your turn or check the current player
- End the other player's turn first

### Invalid card ID error
- Use card IDs from the player's hand (visible in game state)
- Check spelling and format (e.g., `tree-oak-1`)

## 🏗️ Project Structure

```
src/
├── app/
│   └── page.tsx              # Main application page
├── components/
│   ├── CodeDisplay.tsx       # Code viewer with syntax highlighting
│   ├── GameControls.tsx      # Action buttons and forms
│   └── GameStateDisplay.tsx  # Visual game state
├── lib/
│   └── api-client.ts         # API client with code tracking
└── types/
    └── api.ts                # TypeScript type definitions
```

## 🎯 Learning Objectives

After using this simulator, you should understand:

1. **RESTful API Design**: How endpoints are structured
2. **Event Sourcing**: How game state is built from events
3. **Idempotency**: How to prevent duplicate actions
4. **Game State Management**: How frontend and backend state sync
5. **Error Handling**: How to gracefully handle API errors
6. **TypeScript**: Type-safe API interactions

## 📚 Related Documentation

- [Forest Shuffle Backend API Documentation](https://github.com/overlyserious/forest-shuffle-backend/blob/main/API_DOCUMENTATION.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Fetch API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 🤝 Contributing

This is an educational tool. Feel free to:
- Add more visualizations
- Improve code examples
- Add tooltips and explanations
- Create tutorial walkthroughs

## 📄 License

This educational tool is provided as-is for learning purposes.

---

**Happy Learning! 🌲🎮**
