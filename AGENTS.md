# AI Vision Dashboard - Development Guide

## Running the Application

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend runs on http://localhost:8000

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```

### Testing Integration
1. Start backend: `cd backend && python main.py`
2. Start frontend dev server: `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Upload an image to test predictions

## Key Files

- `backend/main.py` - FastAPI app with prediction endpoints
- `frontend/src/App.jsx` - Main React component with UI
- `frontend/src/index.css` - TailwindCSS styles

## API Communication

Frontend communicates with backend at `http://localhost:8000/api/`:
- `/api/health` - GET - Check if backend and model are ready
- `/api/predict` - POST - Upload image for AI classification
- `/api/stats` - GET - Get prediction history and statistics
