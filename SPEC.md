# AI Automation Dashboard - Specification

## Project Overview
- **Project Name**: AI Image Classification Dashboard
- **Type**: Full-stack Web Application
- **Core Functionality**: Upload images to backend, receive AI predictions about object classification, view analytics
- **Target Users**: Developers, data scientists, students learning AI/ML

## Technology Stack
- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Backend**: FastAPI (Python 3.9+)
- **AI Model**: TensorFlow/Keras MobileNetV2 (pre-trained ImageNet)
- **API**: RESTful JSON

## UI/UX Specification

### Color Palette
- Primary: `#0f172a` (Slate 900 - dark background)
- Secondary: `#1e293b` (Slate 800 - card backgrounds)
- Accent: `#06b6d4` (Cyan 500 - highlights)
- Success: `#10b981` (Emerald 500)
- Warning: `#f59e0b` (Amber 500)
- Text Primary: `#f8fafc` (Slate 50)
- Text Secondary: `#94a3b8` (Slate 400)
- Border: `#334155` (Slate 700)

### Typography
- Font Family: "Inter", system-ui, sans-serif
- Headings: 700 weight
- Body: 400 weight
- Monospace: "JetBrains Mono" for predictions

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header (Logo + Title + Status Indicator)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────────┐│
│  │  Image Upload       │  │  Prediction Results             ││
│  │  Dropzone           │  │  - Predicted Class              ││
│  │  + Browse Files     │  │  - Confidence Score             ││
│  └─────────────────────┘  │  - Top 5 Predictions             ││
│                           └─────────────────────────────────┘│
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Analytics Dashboard                                        ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     ││
│  │  │ Total        │  │ Avg          │  │ Recent       │     ││
│  │  │ Predictions  │  │ Confidence   │  │ Activity     │     ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘     ││
│  │  ┌──────────────────────────────────────────────────────┐││
│  │  │  Confidence Distribution Chart                        │││
│  │  └──────────────────────────────────────────────────────┘││
│  └───────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (two columns)
- Desktop: > 1024px (full layout)

### Components

#### 1. Header
- Logo (brain/AI icon)
- Title: "AI Vision Dashboard"
- Backend status indicator (green dot = connected)

#### 2. Image Upload Dropzone
- Dashed border area
- Drag & drop support
- Click to browse
- Preview thumbnail after selection
- Loading spinner during upload
- States: idle, dragging, uploading, error

#### 3. Prediction Card
- Large predicted class name
- Confidence percentage with progress bar
- Top 5 predictions list with percentages
- Animated entrance on new prediction

#### 4. Stats Cards
- Total predictions count
- Average confidence
- Predictions chart (last 10)
- Confidence distribution bar chart

## Backend API Specification

### Endpoints

#### `GET /api/health`
- Returns: `{"status": "ok", "model_loaded": true}`

#### `POST /api/predict`
- Input: multipart/form-data with image file
- Returns:
```json
{
  "success": true,
  "prediction": {
    "class": "golden_retriever",
    "label": "Golden Retriever",
    "confidence": 0.92,
    "top_predictions": [
      {"class": "golden_retriever", "label": "Golden Retriever", "confidence": 0.92},
      {"class": "labrador_retriever", "label": "Labrador Retriever", "confidence": 0.05},
      ...
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/stats`
- Returns prediction history and statistics

## Functionality Specification

### Core Features
1. **Image Upload**: Drag-drop or click to select image files (jpg, png, webp)
2. **AI Prediction**: Send image to backend, receive classification results
3. **Real-time Display**: Show predictions immediately with animations
4. **Analytics Dashboard**: Track prediction history, confidence scores
5. **Dynamic Updates**: Dashboard updates without page refresh

### User Interactions
1. User drags image onto dropzone OR clicks to browse
2. Image preview displays immediately
3. Loading indicator shows during API call
4. Prediction results animate in
5. Stats update automatically

### Data Handling
- Store last 20 predictions in memory (backend)
- Calculate running statistics
- Return full prediction history on stats request

### Edge Cases
- Invalid file type → Show error message
- API timeout → Show retry option
- Large file → Show file size warning
- Model not loaded → Show loading state

## Acceptance Criteria

1. ✓ React app loads without errors
2. ✓ FastAPI backend starts and responds to health check
3. ✓ Image upload works via drag-drop and file browser
4. ✓ AI predictions return correct results with confidence scores
5. ✓ Charts display prediction history and statistics
6. ✓ UI is responsive across mobile/tablet/desktop
7. ✓ Error states handled gracefully
8. ✓ Loading states shown during API calls
