# AI Vision Dashboard - Technical Documentation

## Overview

This is an AI-powered image classification dashboard that:
1. **Takes an image** from the user (upload or drag & drop)
2. **Sends it to the backend** via API
3. **AI model analyzes** the image using MobileNetV2 (trained on ImageNet)
4. **Returns predictions** with confidence scores
5. **Shows analytics** with charts

---

## How Image Classification Works

### Step 1: Image Upload (Frontend)
```
User selects image → Browser creates preview → File stored in React state
```

### Step 2: API Request (Frontend → Backend)
When user clicks "Analyze Image":
```javascript
// Frontend creates FormData
const formData = new FormData()
formData.append('file', image)

// Sends POST request to backend
axios.post('http://localhost:8000/api/predict', formData)
```

### Step 3: Image Processing (Backend)
```python
# Backend receives image
image = Image.open(io.BytesIO(contents))

# Convert to RGB if needed
if image.mode != 'RGB':
    image = image.convert('RGB')

# Resize and normalize for AI model
img_tensor = transform(image).unsqueeze(0)
```

### Step 4: AI Prediction (Backend - PyTorch)
```python
# Load MobileNetV2 model (pre-trained on ImageNet)
model = models.mobilenet_v2(weights='IMAGENET1K_V1')
model.eval()

# Run inference
with torch.no_grad():
    outputs = model(img_tensor)
    probabilities = torch.nn.functional.softmax(outputs[0], dim=0)

# Get top 5 predictions
top_probs, top_indices = torch.topk(probabilities, 5)
```

### Step 5: Return Results (Backend → Frontend)
```python
# Backend returns JSON
{
    "success": True,
    "prediction": {
        "class": "314",
        "label": "cockroach",
        "confidence": 0.85,
        "top_predictions": [
            {"class": "314", "label": "cockroach", "confidence": 0.85},
            {"class": "123", "label": "grasshopper", "confidence": 0.08},
            ...
        ]
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### Step 6: Display Results (Frontend)
- Shows predicted label (e.g., "cockroach")
- Shows confidence percentage (e.g., "85%")
- Shows top 5 predictions with progress bars

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  React Frontend                       │  │
│  │   - User Interface (upload, buttons, charts)        │  │
│  │   - Sends image to backend via HTTP                 │  │
│  │   - Receives and displays predictions               │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │ HTTP POST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Port 8000)                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  FastAPI Server                       │  │
│  │   - /api/health     → Check if model is ready       │  │
│  │   - /api/predict    → Process image, return result  │  │
│  │   - /api/stats      → Return prediction history      │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              PyTorch MobileNetV2                      │  │
│  │   - Pre-trained on ImageNet (1000 classes)          │  │
│  │   - Analyzes image features                         │  │
│  │   - Outputs probability for each class               │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. Health Check
```
GET http://localhost:8000/api/health

Response:
{
    "status": "ok",
    "model_loaded": true,
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Predict Image
```
POST http://localhost:8000/api/predict
Content-Type: multipart/form-data
Body: file (image file)

Response:
{
    "success": true,
    "prediction": {
        "class": "314",
        "label": "cockroach",
        "confidence": 0.85,
        "top_predictions": [
            {"class": "314", "label": "cockroach", "confidence": 0.85},
            {"class": "345", "label": "fly", "confidence": 0.05},
            {"class": "123", "label": "grasshopper", "confidence": 0.03},
            {"class": "456", "label": "bee", "confidence": 0.02},
            {"class": "789", "label": "ant", "confidence": 0.01}
        ]
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Get Stats
```
GET http://localhost:8000/api/stats

Response:
{
    "total_predictions": 5,
    "average_confidence": 0.78,
    "predictions": [
        {"class": "cockroach", "confidence": 0.85, "timestamp": "..."},
        {"class": "dog", "confidence": 0.92, "timestamp": "..."}
    ],
    "confidence_distribution": [
        {"range": "0-20%", "count": 0},
        {"range": "20-40%", "count": 1},
        {"range": "40-60%", "count": 0},
        {"range": "60-80%", "count": 2},
        {"range": "80-100%", "count": 2}
    ]
}
```

---

## The AI Model - MobileNetV2

### What is MobileNetV2?
- A **convolutional neural network** (CNN) designed for mobile devices
- Pre-trained on **ImageNet** dataset (14 million images, 1000 classes)
- Lightweight and fast inference

### ImageNet Classes (1000 categories)
The model can recognize 1000 different objects including:
- Animals: dog, cat, bird, fish, elephant, lion, etc.
- Vehicles: car, truck, bicycle, airplane, boat
- Food: pizza, burger, banana, apple
- Household items: chair, table, phone, computer

### How It Works
1. **Input**: Image resized to 224×224 pixels
2. **Processing**: Image passes through 53 layers of neural network
3. **Features**: Each layer detects different features (edges, shapes, textures)
4. **Output**: Probability distribution over 1000 classes

### Example
```
Input Image: A photo of a cockroach
         │
         ▼
┌────────────────────┐
│  MobileNetV2       │
│  (53 layers)       │
│                    │
│  Layer 1: edges    │
│  Layer 2: textures │
│  Layer 3: shapes   │
│  ...               │
│  Layer 53: object  │
└────────────────────┘
         │
         ▼
Output: {"cockroach": 85%, "grasshopper": 5%, "fly": 3%, ...}
```

---

## Running the Project

### Terminal 1 - Start Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
- Backend runs on http://localhost:8000
- Wait for "Model loaded!" message

### Terminal 2 - Start Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend runs on http://localhost:5173

### Usage
1. Open http://localhost:5173 in browser
2. Drag & drop an image or click to browse
3. Click "Analyze Image"
4. View prediction results and analytics

---

## File Structure

```
project/
├── backend/
│   ├── main.py              # FastAPI server + AI model
│   ├── requirements.txt      # Python dependencies
│   └── imagenet_classes.json # Class labels (optional)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── index.css       # TailwindCSS styles
│   │   └── main.jsx        # React entry point
│   ├── package.json         # Node dependencies
│   └── vite.config.js      # Vite configuration
│
├── README.md                # Quick start guide
├── SPEC.md                 # Project specification
└── TECHNICAL_DOCS.md       # This file
```

---

## Troubleshooting

### "Model not loaded" error
- Make sure backend is running
- Wait for "Model loaded!" in backend terminal

### "Connection refused" error
- Check backend is running on port 8000
- Check frontend API_URL in App.jsx

### Wrong predictions
- MobileNetV2 is trained on ImageNet which may not have all objects
- Try uploading clear images with well-defined objects

### Port already in use
```bash
# Find process on port
netstat -ano | findstr ":8000"

# Kill process
taskkill //F //PID <PID_NUMBER>
```
