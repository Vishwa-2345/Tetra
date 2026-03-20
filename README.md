# Tetra

A full-stack application with a React/TypeScript frontend and Python FastAPI backend.

## Project Structure

```
Tetra/
├── client/          # React/TypeScript frontend
│   ├── src/
│   ├── public/
│   └── package.json
└── server/          # Python FastAPI backend
    ├── app/
    │   ├── api/     # API routes
    │   ├── models/  # Database models
    │   └── schemas/ # Pydantic schemas
    └── requirements.txt
```

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- Python (v3.8+)
- npm or yarn

### Client Setup

```bash
cd client
npm install
npm run dev
```

The client will be available at `http://localhost:5173` (Vite default)

### Server Setup

```bash
cd server
python -m venv venv
source venv/Scripts/activate  # On Windows
pip install -r requirements.txt
python -m app.main
```

The server will be available at `http://localhost:8000`

## Development

### Client

- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Check `src/store/`

### Server

- **Framework**: FastAPI
- **Database**: See `app/core/config.py` for database configuration
- **Authentication**: Managed in `app/api/auth.py`

## Features

- User authentication (Login, Register, Password Recovery)
- Admin dashboard for user and transaction management
- Student dashboard with job management
- Real-time messaging and notifications
- Payment processing
- Job reviews and ratings

## License

[Add your license here]
