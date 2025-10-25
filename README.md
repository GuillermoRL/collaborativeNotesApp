# Collaborative Notes App

A React-based collaborative notes application demonstrating real-time editing simulation, conflict resolution, and state management patterns.

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **State Management:** Redux Toolkit
- **Rich Text Editor:** React Quill
- **Build Tool:** Vite
- **Testing:** Vitest + React Testing Library
- **Styling:** CSS3

## Setup and Installation

### Prerequisites
- Node.js v16 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/GuillermoRL/collaborativeNotesApp.git
cd CollaborativeNotesApp

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run compile       # Run tsc
```

## Basic Workflow

1. **View Notes:** Browse the list of notes on the home page
2. **Create Note:** Click "+ New Note" to open the editor modal
3. **Edit Note:** Click any note to edit. Make changes in the rich text editor
4. **Save:** Click "Save" to persist changes
5. **Simulate Collaboration:** Click "▶ Simulate Edits" to trigger fake user edits
6. **Resolve Conflicts:** When conflicts occur, choose to merge or discard changes

## Project Structure

```
src/
├── components/
│   ├── EditorModal/           # Modal editor with conflict resolution
│   ├── LazyNotesList/         # Paginated notes list with lazy loading
│   ├── NotesList/             # Standard notes list
│   ├── NoteItem/              # Individual note card component
│   └── RichTextEditor/        # Quill editor wrapper
├── pages/
│   └── Home/                  # Main page with notes list
├── store/
│   ├── index.ts               # Redux store configuration
│   ├── notesSlice.ts          # Notes state, actions, and reducers
│   └── hooks.ts               # Typed Redux hooks
├── types/
│   └── note.ts                # TypeScript type definitions
├── utils/
│   └── storage.ts             # localStorage utilities
├── hooks/
│   └── useLocalStorage.ts     # localStorage sync hook
├── test/
│   ├── setup.ts               # Test environment setup
│   └── test-utils.tsx         # Testing utilities
├── App.tsx                    # Root component with routing
└── main.tsx                   # App entry point
```

## How Simulation Works

The collaborative editing simulation demonstrates conflict detection and resolution:

### Simulation Flow

1. **Activation:** Click "▶ Simulate Edits" in the editor modal
2. **Random Intervals:** Generates edits every 5-10 seconds (randomized)
3. **Fake Users:** Simulates edits from `alice`, `bob`, or `charlie`
4. **Edit Generation:** Creates `EditOperation` objects with:
   - `noteId`: Target note identifier
   - `userId`: Simulated user name
   - `content`: Modified note content
   - `version`: Note version at time of edit
   - `timestamp`: Edit timestamp

### Conflict Detection

When you click "Save" after simulation has created edits:

1. **Version Check:** Compares your note version with pending edits
2. **Conflict Identified:** If versions mismatch, triggers conflict dialog
3. **User Choice:**
   - **Discard My Changes:** Applies remote edit, discards local changes
   - **Merge Changes:** Combines both versions (local + remote with separator)

### State Management

- **pendingEdits:** Array of `EditOperation` objects waiting to be resolved
- **receiveRemoteEdit:** Redux action that adds simulated edits to pending queue
- **Conflict Resolution:** Updates note version and clears pending edits

This pattern simulates real-world collaborative editing scenarios where multiple users edit the same document simultaneously, requiring conflict resolution strategies.

## Data Persistence

Notes are automatically saved to browser `localStorage`:

- **Auto-sync:** `useLocalStorage` hook monitors Redux state changes
- **On Load:** Reads from localStorage and populates initial state
- **On Change:** Writes updated notes array to localStorage
- **Storage Key:** `collaborative-notes`

## Testing

Run the test suite with:

```bash
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Generate coverage report
```

Test coverage includes:
- Component rendering and user interactions
- Redux state management and actions
- Conflict resolution logic
- Lazy loading and pagination
- Editor simulation behavior
