/**
 * Custom Hook for Live Face Scanning
 * Manages real-time face detection and auto-capture functionality
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  loadFaceDetectionModels, 
  detectFaces, 
  getBestQualityFace, 
  startLiveDetection, 
  stopLiveDetection,
  isModelsLoaded 
} from '../utils/faceDetection';

export const useLiveFaceScanning = (cameraLocation = "Main Entrance") => {
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [currentDetections, setCurrentDetections] = useState([]);
  const [bestFace, setBestFace] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [detectionQuality, setDetectionQuality] = useState(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const lastCaptureTime = useRef(0);
  const qualityHistoryRef = useRef([]);
  
  // Load face detection models on mount
  useEffect(() => {
    const loadModels = async () => {
      const loaded = await loadFaceDetectionModels();
      setModelsReady(loaded);
    };
    
    loadModels();
  }, []);
  
  // Handle face detection results
  const handleDetectionResults = useCallback((detections) => {
    setCurrentDetections(detections);
    
    // Find best quality face
    const best = getBestQualityFace(detections);
    setBestFace(best);
    
    // Update quality score
    if (best) {
      setDetectionQuality(best.quality.score);
      
      // Maintain quality history for stability
      qualityHistoryRef.current.push(best.quality.score);
      if (qualityHistoryRef.current.length > 10) {
        qualityHistoryRef.current.shift();
      }
      
      // Auto-capture if enabled and quality is good
      if (autoCaptureEnabled && shouldAutoCapture(best)) {
        captureAndScanFace(best);
      }
    } else {
      setDetectionQuality(0);
      qualityHistoryRef.current = [];
    }
  }, [autoCaptureEnabled]);
  
  // Determine if face should be auto-captured
  const shouldAutoCapture = useCallback((faceData) => {
    const now = Date.now();
    const timeSinceLastCapture = now - lastCaptureTime.current;
    
    // Minimum time between captures (5 seconds for surveillance)
    if (timeSinceLastCapture < 5000) return false;
    
    // Quality threshold for auto-capture
    if (faceData.quality.score < 70) return false;
    
    // Check quality stability (avoid capturing on fleeting detections)
    const avgQuality = qualityHistoryRef.current.reduce((a, b) => a + b, 0) / qualityHistoryRef.current.length;
    if (qualityHistoryRef.current.length < 5 || avgQuality < 65) return false;
    
    return true;
  }, []);
  
  // Capture and scan face
  const captureAndScanFace = useCallback(async (faceData) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      // Create canvas for face capture
      const captureCanvas = document.createElement('canvas');
      const captureCtx = captureCanvas.getContext('2d');
      
      // Extract face region with some padding
      const box = faceData.detection.detection.box;
      const padding = 50;
      
      captureCanvas.width = box.width + (padding * 2);
      captureCanvas.height = box.height + (padding * 2);
      
      // Draw face region to capture canvas
      captureCtx.drawImage(
        videoRef.current,
        Math.max(0, box.x - padding),
        Math.max(0, box.y - padding),
        box.width + (padding * 2),
        box.height + (padding * 2),
        0, 0,
        captureCanvas.width,
        captureCanvas.height
      );
      
      // Convert to blob
      captureCanvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const capturedFile = new File([blob], `live_capture_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        
        // Update last capture time
        lastCaptureTime.current = Date.now();
        
        // Add to scan history
        const scanEntry = {
          id: Date.now(),
          timestamp: new Date(),
          file: capturedFile,
          quality: faceData.quality.score,
          detections: currentDetections.length,
          status: 'processing'
        };
        
        setScanHistory(prev => [scanEntry, ...prev.slice(0, 9)]); // Keep last 10
        
        // Trigger scan callback for UI update
        onFaceCapture?.(capturedFile, faceData);
        
        // Update scan entry status
        setScanHistory(prev => prev.map(entry => 
          entry.id === scanEntry.id 
            ? { ...entry, status: 'completed' }
            : entry
        ));
        
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Face capture error:', error);
    }
  }, [currentDetections.length, onFaceCapture]);
  
  // Start live scanning
  const startLiveScanning = useCallback(() => {
    if (!modelsReady || !videoRef.current || !canvasRef.current) {
      console.error('Cannot start live scanning: models not ready or refs missing');
      return;
    }
    
    setIsLiveScanning(true);
    
    // Start detection loop
    startLiveDetection(
      videoRef.current, 
      canvasRef.current, 
      handleDetectionResults,
      100 // Detect every 100ms
    );
  }, [modelsReady, handleDetectionResults]);
  
  // Stop live scanning
  const stopLiveScanning = useCallback(() => {
    setIsLiveScanning(false);
    stopLiveDetection();
    
    // Clear detection canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    // Reset state
    setCurrentDetections([]);
    setBestFace(null);
    setDetectionQuality(0);
    qualityHistoryRef.current = [];
  }, []);
  
  // Manual capture
  const manualCapture = useCallback(() => {
    if (bestFace) {
      captureAndScanFace(bestFace);
    } else if (currentDetections.length > 0) {
      captureAndScanFace({ detection: currentDetections[0], quality: { score: 50 } });
    }
  }, [bestFace, currentDetections, captureAndScanFace]);
  
  // Toggle auto-capture
  const toggleAutoCapture = useCallback(() => {
    setAutoCaptureEnabled(prev => !prev);
  }, []);
  
  // Clear scan history
  const clearScanHistory = useCallback(() => {
    setScanHistory([]);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveDetection();
    };
  }, []);
  
  return {
    // State
    isLiveScanning,
    modelsReady,
    currentDetections,
    bestFace,
    scanHistory,
    autoCaptureEnabled,
    detectionQuality,
    
    // Refs
    videoRef,
    canvasRef,
    
    // Actions
    startLiveScanning,
    stopLiveScanning,
    manualCapture,
    toggleAutoCapture,
    clearScanHistory,
    
    // Configuration
    setAutoCaptureEnabled,
    
    // Callback setter
    onFaceCapture: null // To be set by parent component
  };
};
