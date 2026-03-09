import io
import json
from datetime import datetime
from typing import List, Dict

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from PIL import Image
import numpy as np
import torch
import torchvision.transforms as transforms
from torchvision import models

app = FastAPI(title="AI Vision Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
class_names = {}
prediction_history: List[Dict] = []

def load_model():
    global model, class_names
    print("Loading MobileNetV3-Small model (optimized)...")
    weights = models.MobileNet_V3_Small_Weights.IMAGENET1K_V1
    model = models.mobilenet_v3_small(weights=weights)
    model.eval()
    
    model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )
    
    model = torch.jit.script(model)
    
    class_names = {str(i): cat for i, cat in enumerate(weights.meta['categories'])}
    print(f"Model loaded! Classes: {len(class_names)}")

transform = transforms.Compose([
    transforms.Resize(168),
    transforms.CenterCrop(160),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.on_event("startup")
async def startup_event():
    try:
        load_model()
    except Exception as e:
        print(f"Warning: Could not load full model: {e}")

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.post("/api/predict")
async def predict_image(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        img_tensor = transform(image).unsqueeze(0)
        
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        
        top_k = 5
        top_probs, top_indices = torch.topk(probabilities, top_k)
        
        results = []
        for prob, idx in zip(top_probs.tolist(), top_indices.tolist()):
            class_id = str(idx)
            results.append({
                "class": class_id,
                "label": class_names.get(class_id, f"Class {idx}"),
                "confidence": float(prob)
            })
        
        result = {
            "success": True,
            "prediction": {
                "class": results[0]["class"],
                "label": results[0]["label"],
                "confidence": results[0]["confidence"],
                "top_predictions": results
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        prediction_history.append({
            "class": results[0]["label"],
            "confidence": results[0]["confidence"],
            "timestamp": result["timestamp"]
        })
        
        if len(prediction_history) > 20:
            prediction_history.pop(0)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/api/stats")
async def get_stats():
    if not prediction_history:
        return {
            "total_predictions": 0,
            "average_confidence": 0,
            "predictions": [],
            "confidence_distribution": []
        }
    
    confidences = [p["confidence"] for p in prediction_history]
    
    buckets = {
        "0-20%": 0,
        "20-40%": 0,
        "40-60%": 0,
        "60-80%": 0,
        "80-100%": 0
    }
    
    for conf in confidences:
        if conf < 0.2:
            buckets["0-20%"] += 1
        elif conf < 0.4:
            buckets["20-40%"] += 1
        elif conf < 0.6:
            buckets["40-60%"] += 1
        elif conf < 0.8:
            buckets["60-80%"] += 1
        else:
            buckets["80-100%"] += 1
    
    return {
        "total_predictions": len(prediction_history),
        "average_confidence": float(np.mean(confidences)),
        "predictions": prediction_history[-10:],
        "confidence_distribution": [{"range": k, "count": v} for k, v in buckets.items()]
    }

handler = Mangum(app, lifespan="off")
