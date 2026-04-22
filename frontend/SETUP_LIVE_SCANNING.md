# Live Face Scanning Setup Instructions

## 🚀 **LIVE FACE SCANNING - PHASE 1 COMPLETE**

### **✅ IMPLEMENTED FEATURES:**

#### **1. Real-time Face Detection**
- Face detection in video stream using face-api.js
- Face quality assessment and scoring
- Automatic face capture when quality is good
- Manual capture option

#### **2. Live Scanning Interface**
- Three modes: Upload, Camera, Live Scan
- Real-time face detection overlay
- Quality indicator and face count
- Auto-capture toggle
- Live scanning controls

#### **3. Results Display**
- Live scan history with timestamps
- Quality scores for each scan
- Match results integration
- Photo display with fallback

#### **4. Smart Features**
- Face quality filtering (70% threshold for auto-capture)
- Quality stability checking
- Capture rate limiting (3 seconds minimum)
- Multiple face detection support

### **🔧 SETUP REQUIREMENTS:**

#### **1. Install face-api.js Library**
```bash
# Download the real face-api.js library
cd frontend/public/models
curl -o face-api.min.js https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js
```

#### **2. Download Face Detection Models**
```bash
# Create models directory
mkdir -p frontend/public/models

# Download required models
curl -o frontend/public/models/tiny_face_detector_model-weights_manifest.json https://github.com/justadudewhooh/face-api.js-models/raw/master/tiny_face_detector_model-weights_manifest.json
curl -o frontend/public/models/tiny_face_detector_model-shard1 https://github.com/justadudewhooh/face-api.js-models/raw/master/tiny_face_detector_model-shard1
curl -o frontend/public/models/face_landmark_68_model-weights_manifest.json https://github.com/justadudewhooh/face-api.js-models/raw/master/face_landmark_68_model-weights_manifest.json
curl -o frontend/public/models/face_landmark_68_model-shard1 https://github.com/justadudewhooh/face-api.js-models/raw/master/face_landmark_68_model-shard1
curl -o frontend/public/models/face_recognition_model-weights_manifest.json https://github.com/justadudewhooh/face-api.js-models/raw/master/face_recognition_model-weights_manifest.json
curl -o frontend/public/models/face_recognition_model-shard1 https://github.com/justadudewhooh/face-api.js-models/raw/master/face_recognition_model-shard1
curl -o frontend/public/models/face_recognition_model-shard2 https://github.com/justadudewhooh/face-api.js-models/raw/master/face_recognition_model-shard2
```

#### **3. Alternative: Use CDN**
If you don't want to download models, update `faceDetection.js`:
```javascript
// Change MODEL_URL to use CDN
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
```

### **🎯 HOW TO USE:**

#### **1. Start Live Scanning**
1. Open Scan & Match page
2. Click "Live Scan" button
3. Allow camera access
4. Click "Start Scanning"

#### **2. Auto-Capture**
- Enable "Auto-capture when face quality is good"
- Position face in frame
- System will automatically capture when quality > 70%
- Results appear in live scan history

#### **3. Manual Capture**
- Click "Capture Now" button
- Captures current best quality face
- Immediate scan results

#### **4. View Results**
- Current scan results shown in main panel
- Live scan history shows recent scans
- Quality scores and timestamps included

### **⚙️ CONFIGURATION:**

#### **Face Detection Settings**
```javascript
// In faceDetection.js - adjust thresholds
const DETECTION_CONFIG = {
  confidenceThreshold: 0.6,        // Face detection confidence
  qualityThresholds: {
    minSize: 80,                    // Minimum face size
    maxSize: 300,                   // Maximum face size
    minSharpness: 0.3,              // Minimum sharpness
    minBrightness: 0.2,              // Minimum brightness
    maxBrightness: 0.8              // Maximum brightness
  }
};
```

#### **Auto-Capture Settings**
```javascript
// In useLiveFaceScanning.js - adjust thresholds
const shouldAutoCapture = (faceData) => {
  const qualityThreshold = 70;       // Minimum quality for auto-capture
  const minTimeBetweenCaptures = 3000; // 3 seconds minimum
  const stabilityFrames = 5;         // Frames for stability check
  // ... adjust as needed
};
```

### **🔍 TROUBLESHOOTING:**

#### **1. Models Not Loading**
- Check console for model loading errors
- Verify models are in correct directory
- Try using CDN instead of local files

#### **2. Camera Not Working**
- Check browser permissions
- Try different camera (front/back)
- Ensure HTTPS in production

#### **3. Face Detection Not Working**
- Check lighting conditions
- Ensure face is clearly visible
- Adjust confidence threshold

#### **4. Auto-Capture Not Triggering**
- Check face quality indicator
- Manually capture to test
- Adjust quality threshold

### **📱 PERFORMANCE OPTIMIZATION:**

#### **1. Detection Frequency**
```javascript
// Adjust detection interval (default: 100ms)
startLiveDetection(video, canvas, callback, 100);
```

#### **2. Video Resolution**
```javascript
// Adjust camera resolution for performance
video: { 
  facingMode: 'environment',
  width: { ideal: 640 },    // Lower for better performance
  height: { ideal: 480 }
}
```

#### **3. Face Processing**
- Limit number of concurrent faces
- Implement face tracking to reduce processing
- Use Web Workers for heavy processing

### **🔒 PRIVACY & SECURITY:**

- All processing happens in browser
- No video frames sent to external servers
- Face data not stored permanently
- User consent required for camera access

### **🚀 NEXT PHASE:**

**Phase 2** will include:
- WebSocket support for real-time results
- Multiple face tracking
- Advanced face quality metrics
- Performance optimization
- Alert system for high-confidence matches

**The live face scanning feature is now ready for testing!**
