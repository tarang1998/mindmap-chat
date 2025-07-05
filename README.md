# MindMap Chat - Interactive Note-Taking with AI

A mindmapping application that combines visual note-taking with AI-powered chat functionality. Create interconnected nodes to organize your thoughts, store sources and notes for each node, and chat with an LLM that has context from your notes and surrounding nodes.

## Features

### 🧠 Visual Mind Mapping
- Create and organize ideas in an intuitive visual mindmap interface
- Drag and drop nodes to restructure your thoughts
- Connect related concepts with visual links
- Real-time collaboration and updates

### 📝 Rich Note-Taking
- Store detailed notes and sources for each node
- Organize information hierarchically
- Link related concepts across your mindmap
- Maintain context between connected nodes

### 🤖 AI-Powered Chat
- Chat with an LLM based on the sources and notes of any node
- AI understands context from surrounding nodes
- Get insights and answers based on your stored information
- Seamless integration between your notes and AI assistance

### 🔗 Contextual Intelligence
- AI shares context with surrounding nodes
- Get comprehensive answers that consider your entire thought process
- Maintain relationships between different concepts in your mindmap

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Redux Toolkit** - State management with RTK Query
- **Redux Persist** - Persistent state storage
- **React Router** - Client-side routing
- **Material-UI** - Modern UI components and styling
- **React Flow** - Interactive mindmap visualization

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Real-time subscriptions** - Live updates across devices
- **Row Level Security (RLS)** - Secure data access

### Development Tools
- **Create React App** - Development environment
- **ESLint** - Code linting and formatting
- **Git** - Version control

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mindmap-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Set up the required database tables (see Database Schema below)
   - Configure Row Level Security policies

5. **Start the development server**
   ```bash
   npm start
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

#### mindmaps
Stores mindmap metadata and basic information.
```sql
CREATE TABLE mindmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### nodes
Individual nodes with content, position, and hierarchical structure.
```sql
CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    is_root BOOLEAN DEFAULT FALSE,
    handle_config JSONB,
    width INTEGER DEFAULT 150,
    height INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### edges
Connections between nodes in the mindmap.
```sql
CREATE TABLE edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mindmap_id UUID REFERENCES mindmaps(id) ON DELETE CASCADE,
    source_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    target_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    source_handle VARCHAR(255),
    target_handle VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```






### Relationships
- **mindmaps** → **nodes** (one-to-many): A mindmap contains multiple nodes
- **nodes** → **nodes** (self-referencing): Nodes can have parent-child relationships
- **nodes** → **edges** (one-to-many): Nodes can have multiple connections



## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Project Structure

```
src/
├── app/                 # Redux store configuration
├── domain/             # Business logic and entities
├── presentation/       # React components and pages
├── store/             # Redux slices and state management
└── utils/             # Utility functions and configurations
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
