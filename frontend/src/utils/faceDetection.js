/**
 * Face Detection Utility for Live Scanning
 * Uses face-api.js for real-time face detection in video streams
 */

// Face detection models will be loaded dynamically
let modelsLoaded = false;
let isDetecting = false;

// Face detection configuration
const DETECTION_CONFIG = {
  // Tiny face detector for better performance
  detector: new (window.faceapi?.TinyFaceDetectorOptions || function() {
    return { inputSize: 416, scoreThreshold: 0.5 };
  })(),
  
  // Face landmark points for alignment
  landmarkModel: 68,
  
  // Face recognition descriptor extraction
  descriptorModel: 128,
  
  // Minimum face size for detection
  minFaceSize: 100,
  
  // Maximum face size for detection
  maxFaceSize: 400,
  
  // Confidence threshold for face detection
  confidenceThreshold: 0.6,
  
  // Quality assessment thresholds
  qualityThresholds: {
    minSize: 80,
    maxSize: 300,
    minSharpness: 0.3,
    minBrightness: 0.2,
    maxBrightness: 0.8
  }
};

/**
 * Load face detection models
 */
export const loadFaceDetectionModels = async () => {
  if (modelsLoaded) return true;
  
  try {
    // Check if face-api is available
    if (!window.faceapi) {
      console.error('face-api.js not loaded');
      return false;
    }
    
    // Load required models
    const MODEL_URL = '/models';
    
    await Promise.all([
      window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    
    modelsLoaded = true;
    console.log('Face detection models loaded successfully');
    return true;
    
  } catch (error) {
    console.error('Failed to load face detection models:', error);
    return false;
  }
};

/**
 * Detect faces in video frame
 */
export const detectFaces = async (videoElement, canvasElement) => {
  if (!modelsLoaded || !videoElement || !canvasElement) {
    return [];
  }
  
  try {
    const detections = await window.faceapi
      .detectAllFaces(videoElement, DETECTION_CONFIG.detector)
      .withFaceLandmarks()
      .withFaceDescriptors();
    
    // Filter by confidence and size
    const validDetections = detections.filter(detection => {
      const box = detection.detection.box;
      const faceSize = Math.max(box.width, box.height);
      const confidence = detection.detection.score;
      
      return confidence >= DETECTION_CONFIG.confidenceThreshold &&
             faceSize >= DETECTION_CONFIG.qualityThresholds.minSize &&
             faceSize <= DETECTION_CONFIG.qualityThresholds.maxSize;
    });
    
    // Draw detection boxes on canvas
    if (canvasElement) {
      const displaySize = { 
        width: videoElement.videoWidth, 
        height: videoElement.videoHeight 
      };
      
      window.faceapi.matchDimensions(canvasElement, displaySize);
      
      const resizedDetections = window.faceapi.resizeResults(
        validDetections, 
        displaySize
      );
      
      const ctx = canvasElement.getContext('2d');
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      window.faceapi.draw.drawDetections(canvasElement, resizedDetections);
      window.faceapi.draw.drawFaceLandmarks(canvasElement, resizedDetections);
    }
    
    return validDetections;
    
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
};

/**
 * Assess face quality for auto-capture
 */
export const assessFaceQuality = (detection) => {
  if (!detection) return { score: 0, issues: [] };
  
  const box = detection.detection.box;
  const faceSize = Math.max(box.width, box.height);
  const confidence = detection.detection.score;
  
  const issues = [];
  let score = 0;
  
  // Size assessment
  if (faceSize < DETECTION_CONFIG.qualityThresholds.minSize) {
    issues.push('Face too small');
  } else if (faceSize > DETECTION_CONFIG.qualityThresholds.maxSize) {
    issues.push('Face too large');
  } else {
    score += 30;
  }
  
  // Confidence assessment
  if (confidence >= DETECTION_CONFIG.confidenceThreshold) {
    score += 40;
  } else {
    issues.push('Low confidence');
  }
  
  // Landmark quality (check if landmarks are detected)
  if (detection.landmarks && detection.landmarks.positions.length >= 68) {
    score += 30;
  } else {
    issues.push('Poor landmark detection');
  }
  
  return { score, issues, faceSize, confidence };
};

/**
 * Extract best quality face from detections
 */
export const getBestQualityFace = (detections) => {
  if (!detections || detections.length === 0) return null;
  
  let bestFace = null;
  let bestScore = 0;
  
  detections.forEach(detection => {
    const quality = assessFaceQuality(detection);
    if (quality.score > bestScore) {
      bestScore = quality.score;
      bestFace = { detection, quality };
    }
  });
  
  return bestFace;
};

/**
 * Start continuous face detection
 */
export const startLiveDetection = (videoElement, canvasElement, callback, interval = 100) => {
  if (isDetecting) return;
  
  isDetecting = true;
  
  const detectLoop = async () => {
    if (!isDetecting) return;
    
    try {
      const detections = await detectFaces(videoElement, canvasElement);
      
      if (callback) {
        callback(detections);
      }
      
      // Continue detection loop
      setTimeout(detectLoop, interval);
      
    } catch (error) {
      console.error('Detection loop error:', error);
      setTimeout(detectLoop, interval);
    }
  };
  
  detectLoop();
};

/**
 * Stop continuous face detection
 */
export const stopLiveDetection = () => {
  isDetecting = false;
};

/**
 * Check if models are loaded
 */
export const isModelsLoaded = () => modelsLoaded;

/**
 * Get detection configuration
 */
export const getDetectionConfig = () => ({ ...DETECTION_CONFIG });
