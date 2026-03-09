# AI Vision Dashboard

An industry-level AI automation dashboard for image classification using React and FastAPI.

## Features

- Drag & drop image upload
- Real-time AI object detection using MobileNetV2
- Prediction analytics and statistics
- Dynamic dashboard with charts
- Responsive dark-themed UI

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Backend**: FastAPI + TensorFlow/Keras (MobileNetV2)
- **API**: RESTful JSON

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── imagenet_classes.json
├── frontend/                 # React application
│   ├── src/
│   │   └── App.jsx          # Main component
│   └── package.json
└── SPEC.md                  # Project specification
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend will start on http://localhost:8000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:5173

### 3. Run Both

1. Start backend first: `cd backend && python main.py`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173 in your browser

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/predict` - Upload image for prediction
- `GET /api/stats` - Get prediction statistics
