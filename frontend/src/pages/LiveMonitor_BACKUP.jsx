import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { Plus, Trash2, Pencil, X, Loader2, Video, CameraOff, Wifi, WifiOff, Circle, RefreshCw, Eye, AlertTriangle } from 'lucide-react';

// Use relative path so it goes through the Vite dev proxy — avoids CORS on <img> tags
const STREAM_BASE = '/api/v1';

// Fallback to user camera if no IP cameras configured
const FALLBACK_STREAM = ''; // Will use getUserMedia for webcam

// Modal for Add/Edit camera
const CameraModal = ({ cameraData, onClose, onSave }) => {
    const cam = cameraData;
    const [form, setForm] = useState(cam || { name: '', location: '', rtsp_url: '', is_active: true });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!form.name || !form.rtsp_url) return;
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-surface border border-borderContent rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-base font-semibold text-textMain">{cam ? 'Edit Camera' : 'Add IP Camera'}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surfaceHover text-textMuted"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-textMuted mb-1 block">Camera Name *</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-[#18181b] border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                            placeholder="e.g. Entrance Gate A" />
                    </div>
                    <div>
                        <label className="text-xs text-textMuted mb-1 block">Location</label>
                        <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })}
                            className="w-full bg-[#18181b] border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                            placeholder="e.g. Main Building, Level 1" />
                    </div>
                    <div>
                        <label className="text-xs text-textMuted mb-1 block">RTSP / HTTP Stream URL *</label>
                        <input value={form.rtsp_url} onChange={e => setForm({ ...form, rtsp_url: e.target.value })}
                            className="w-full bg-[#18181b] border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm font-mono"
                            placeholder="rtsp://user:pass@192.168.1.10:554/stream1" />
                        <p className="text-xs text-textMuted mt-1.5 opacity-70">
                            Also supports: <span className="font-mono">http://ip/video</span> · <span className="font-mono">rtsp://ip:554/stream</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input id="is_active" type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                            className="w-4 h-4 rounded accent-primary" />
                        <label htmlFor="is_active" className="text-sm text-textMuted">Active (enabled for streaming)</label>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-borderContent rounded-xl text-sm text-textMuted hover:bg-surfaceHover transition-all">Cancel</button>
                    <button onClick={handleSave} disabled={saving || !form.name || !form.rtsp_url}
                        className="flex-1 py-2.5 bg-primary rounded-xl text-sm text-white font-semibold hover:bg-primaryHover transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Camera'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Webcam fallback component
const WebcamFeed = ({ cam, onEdit, onDelete, featured = false }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [stream, setStream] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    
    useEffect(() => {
        const initWebcam = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 480 } 
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    setLoaded(true);
                }
            } catch (err) {
                console.error('Webcam access denied:', err);
                setError(true);
            }
        };
        
        initWebcam();
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);
    
    return (
        <div className={`relative bg-black rounded-2xl overflow-hidden group ${featured ? 'col-span-2 row-span-2' : ''}`}>
            {/* Video area */}
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center">
                            <CameraOff className="w-12 h-12 mx-auto text-red-400 mb-3" />
                            <p className="text-white">Camera access denied</p>
                            <p className="text-sm text-gray-400 mt-1">Please allow camera permissions</p>
                        </div>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
                
                {/* Loading indicator */}
                {!loaded && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                )}
            </div>
            
            {/* Camera info overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-semibold">Webcam</h3>
                        <p className="text-white/80 text-sm">Local Camera</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {loaded ? (
                            <span className="flex items-center text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                                <Wifi className="w-3 h-3 mr-1" /> LIVE
                            </span>
                        ) : (
                            <span className="flex items-center text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                                <WifiOff className="w-3 h-3 mr-1" /> OFFLINE
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Single camera feed tile
const CameraFeed = ({ cam, onEdit, onDelete, featured = false }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [key, setKey] = useState(0);
    const [faceDetecting, setFaceDetecting] = useState(false);
    const [lastDetection, setLastDetection] = useState(null);
    const [detectionCount, setDetectionCount] = useState(0);
    
    // SAFE: Check if camera and camera.id exist before creating stream URL
    const streamUrl = cam?.id 
        ? `${STREAM_BASE}/cameras/${cam.id}/stream` 
        : null;
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionIntervalRef = useRef(null);

    const refresh = () => { setError(false); setLoaded(false); setKey(k => k + 1); };

    const captureFrame = () => {
        if (!videoRef.current || !loaded || faceDetecting) return;
        
        try {
            setFaceDetecting(true);
            console.log("📸 Capturing frame...");  // ✅ ADD DEBUG LOG
            
            // Create canvas to capture frame
            const canvas = canvasRef.current;
            const video = videoRef.current;
            
            // Set canvas size to smaller dimensions for performance
            canvas.width = 640;  // Increased from 320 for better detection
            canvas.height = 480; // Increased from 240 for better detection
            
            const ctx = canvas.getContext('2d');
            
            // Draw video frame to canvas with optimized scaling
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64 with optimized size for performance
            const imageData = canvas.toDataURL('image/jpeg', 0.6);
            
            console.log("🚀 Sending to backend...");  // ✅ ADD DEBUG LOG
            console.log(`Camera ${cam.id}: Sending frame for detection (${imageData.length} chars)`);
            
            // Non-blocking API call
            fetch('/api/v1/detection/live-scan', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData,
                    camera_id: cam.id,
                    location: cam.name || (`Camera ${cam.id}`)
                })
            })
            .then(res => res.json())
            .then(data => {
                console.log("DETECTION RESPONSE:", data);  // ✅ ADD DEBUG LOG
                setFaceDetecting(false);
                
                if (data.success) {
                    console.log(`Camera ${cam.id} detection result:`, data);
                    setDetectionCount(prev => prev + 1);
                    
                    if (data.face_detected) {
                        setLastDetection({
                            person_name: data.person_name,
                            match_type: data.match_type,
                            confidence: data.confidence,
                            log_id: data.log_id,
                            timestamp: new Date()
                        });
                        
                        // Clear detection after 3 seconds
                        setTimeout(() => setLastDetection(null), 3000);
                    }
                }
            })
            .catch(err => {
                console.error("DETECTION ERROR:", err);  // ✅ ADD DEBUG LOG
                setFaceDetecting(false);
            });
            
        } catch (err) {
            console.error(`Camera ${cam.id}: Frame capture error:`, err);
            setFaceDetecting(false);
        }
    };

    // Set up persistent face detection with shorter interval
    useEffect(() => {
        if (!cam.is_active || error || !loaded || !workerRef.current) return;
        
        // Run detection every 2 seconds for persistent scanning (as requested)
        detectionIntervalRef.current = setInterval(() => {
            captureFrame();
        }, 2000);
        
        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
            }
        };
    }, [cam.is_active, error, loaded]);

    // Add manual face detection button for immediate testing
    const handleManualDetect = () => {
        console.log(`Manual detection triggered for camera ${cam.id}`);
        if (!faceDetecting && loaded) {
            captureFrame();
        }
    };

    // Add debug info
    const handleDebugInfo = () => {
        console.log(`Camera ${cam.id} debug info:`, {
            loaded,
            error,
            faceDetecting,
            detectionCount,
            videoReady: videoRef.current ? true : false
        });
    };

    return (
        <div className={`bg-[#0c0c0f] border ${featured ? 'border-primary/30' : 'border-borderContent'} rounded-2xl overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-borderContent bg-[#111114] flex justify-between items-center">
                <div>
                    <p className="font-semibold text-textMain text-sm">{cam.name}</p>
                    {cam.location && <p className="text-xs text-textMuted">{cam.location}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {cam.is_active ? (
                        <span className="flex items-center text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse" /> REC
                        </span>
                    ) : (
                        <span className="text-xs text-zinc-500 bg-zinc-500/10 border border-zinc-500/20 px-2 py-0.5 rounded">INACTIVE</span>
                    )}
                    
                    {/* Detection count indicator */}
                    <span className="flex items-center text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                        <Eye className="w-3 h-3 mr-1" /> {detectionCount}
                    </span>
                    
                    {/* Face detection indicator */}
                    {faceDetecting && (
                        <span className="flex items-center text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> SCANNING
                        </span>
                    )}
                    
                    {/* Manual face detection button */}
                    <button 
                        onClick={handleManualDetect}
                        disabled={faceDetecting || !loaded}
                        className="p-1 rounded hover:bg-green-500/10 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Manual Face Detection"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Debug button */}
                    <button 
                        onClick={handleDebugInfo}
                        className="p-1 rounded hover:bg-purple-500/10 text-purple-400"
                        title="Debug Info (Check Console)"
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                    
                    <button onClick={refresh} className="p-1 rounded hover:bg-surfaceHover text-textMuted" title="Refresh stream">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onEdit(cam)} className="p-1 rounded hover:bg-surfaceHover text-textMuted" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(cam.id)} className="p-1 rounded hover:bg-red-500/10 text-textMuted hover:text-red-400" title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Detection alert */}
            {lastDetection && (
                <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20">
                    <div className="flex items-center text-xs text-green-400">
                        <AlertTriangle className="w-3 h-3 mr-2" />
                        <span className="font-medium">
                            {lastDetection.person_name ? `${lastDetection.person_name} detected` : 'Unknown person detected'}
                        </span>
                        <span className="ml-auto text-green-500">
                            {lastDetection.confidence_level.toUpperCase()} ({lastDetection.confidence_score.toFixed(2)})
                        </span>

// Add debug info
const handleDebugInfo = () => {
    console.log(`Camera ${cam.id} debug info:`, {
        loaded,
        error,
        faceDetecting,
        detectionCount,
        videoReady: videoRef.current ? true : false
    });
};

return (
    <div className={`bg-[#0c0c0f] border ${featured ? 'border-primary/30' : 'border-borderContent'} rounded-2xl overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-borderContent bg-[#111114] flex justify-between items-center">
            <div>
                <p className="font-semibold text-textMain text-sm">{cam.name}</p>
                {cam.location && <p className="text-xs text-textMuted">{cam.location}</p>}
            </div>
            <div className="flex items-center gap-2">
                {cam.is_active ? (
                    <span className="flex items-center text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse" /> REC
                    </span>
                ) : (
                    <span className="text-xs text-zinc-500 bg-zinc-500/10 border border-zinc-500/20 px-2 py-0.5 rounded">INACTIVE</span>
                )}
                
                {/* Detection count indicator */}
                <span className="flex items-center text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    <Eye className="w-3 h-3 mr-1" /> {detectionCount}
                </span>
                
                {/* Face detection indicator */}
                {faceDetecting && (
                    <span className="flex items-center text-xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" /> SCANNING
                    </span>
                )}
                
                {/* Manual face detection button */}
                <button 
                    onClick={handleManualDetect}
                    disabled={faceDetecting || !loaded}
                    className="p-1 rounded hover:bg-green-500/10 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Manual Face Detection"
                >
                    <Eye className="w-3.5 h-3.5" />
                </button>
                
                {/* Debug button */}
                <button 
                    onClick={handleDebugInfo}
                    className="p-1 rounded hover:bg-purple-500/10 text-purple-400"
                    title="Debug Info (Check Console)"
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                </button>
                
                <button onClick={refresh} className="p-1 rounded hover:bg-surfaceHover text-textMuted" title="Refresh stream">
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onEdit(cam)} className="p-1 rounded hover:bg-surfaceHover text-textMuted" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(cam.id)} className="p-1 rounded hover:bg-red-500/10 text-textMuted hover:text-red-400" title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>

        {/* Detection alert */}
        {lastDetection && (
            <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20">
                <div className="flex items-center text-xs text-green-400">
                    <AlertTriangle className="w-3 h-3 mr-2" />
                    <span className="font-medium">
                        {lastDetection.person_name ? `${lastDetection.person_name} detected` : 'Unknown person detected'}
                    </span>
                    <span className="ml-auto text-green-500">
                        {lastDetection.confidence_level.toUpperCase()} ({lastDetection.confidence_score.toFixed(2)})
                    </span>
                </div>
            </div>
        )}

        {/* Video area — 16:9 aspect ratio */}
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            {/* scan lines */}
            <div className="absolute inset-0 bg-black pointer-events-none"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.02) 2px, rgba(0,255,200,0.02) 4px)' }} />

            {cam?.is_active && !error && streamUrl ? (
                <>
                    {!loaded && (
                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 z-10">
                            <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
                            <p className="text-xs text-textMuted opacity-60">Connecting to stream...</p>
                        </div>
                    )}
                    <img
                        ref={videoRef}
                        key={key}
                        src={streamUrl}
                        alt={cam?.name || 'Camera'}
                        onLoad={() => setLoaded(true)}
                        onError={(e) => {
                            console.error('Camera stream error:', e);
                            setError(true);
                        }}
                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                        crossOrigin="anonymous"
                    />
                    {/* Hidden canvas for frame capture */}
                    <canvas ref={canvasRef} className="hidden" />
                </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <CameraOff className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-600">
                        {error ? 'Stream unavailable' : !cam?.id ? 'Camera not configured' : 'Camera inactive'}
                    </p>
                    {error && (
                        <button 
                            onClick={refresh}
                            className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                        >
                            Retry Connection
                        </button>
                    )}
                </div>
            )}
        </div>
    </div>
);

const LiveMonitor = () => {
    const [cameras, setCameras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editCam, setEditCam] = useState(null);
    const [showWebcam, setShowWebcam] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await axiosClient.get('/cameras/');
            setCameras(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSave = async (form) => {
        if (editCam) {
            await axiosClient.put(`/cameras/${editCam.id}`, form);
        } else {
            await axiosClient.post('/cameras/', form);
        }
        setShowModal(false);
        setEditCam(null);
        load();
    };

    const handleDelete = async (id) => {
        if (!confirm('Remove this camera?')) return;
        await axiosClient.delete(`/cameras/${id}`);
        load();
    };

    const activeCams = cameras.filter(c => c.is_active);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {showModal && (
                <CameraModal cameraData={editCam} onClose={() => { setShowModal(false); setEditCam(null); }} onSave={handleSave} />
            )}

            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-textMain">Live Monitor</h1>
                    <p className="text-textMuted text-sm mt-1">
                        {showWebcam ? 'Webcam Active' : `${activeCams.length} active node${activeCams.length !== 1 ? 's' : ''} streaming`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center text-sm text-textMuted font-mono border border-borderContent rounded-lg px-3 py-2 bg-surface">
                        <Circle className="w-2 h-2 mr-2 text-green-400 fill-green-400 animate-pulse" />
                        {time.toLocaleTimeString()}
                    </div>
                    {showWebcam && (
                        <button onClick={() => setShowWebcam(false)}
                            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all">
                            <Video className="w-4 h-4" /> IP Cameras
                        </button>
                    )}
                    <button onClick={() => { setEditCam(null); setShowModal(true); }}
                        className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <Plus className="w-4 h-4" /> Add Camera
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : cameras.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-borderContent rounded-2xl">
                    <Video className="w-12 h-12 mx-auto text-textMuted mb-3 opacity-30" />
                    <p className="text-textMuted font-medium">No cameras configured</p>
                    <p className="text-sm text-textMuted opacity-60 mt-1">Click "Add Camera" to connect your first IP camera via RTSP.</p>
                    <div className="mt-5 flex items-center justify-center gap-3">
                        <button onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primaryHover transition-all">
                            <Plus className="w-4 h-4" /> Add IP Camera
                        </button>
                        <button onClick={() => setShowWebcam(true)}
                            className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-all">
                            <Video className="w-4 h-4" /> Use Webcam
                        </button>
                    </div>
                </div>
            ) : showWebcam ? (
                <WebcamFeed />
            ) : (
                <>
                    {/* Featured - first active camera */}
                    {cameras[0] && <CameraFeed cam={cameras[0]} featured onEdit={c => { setEditCam(c); setShowModal(true); }} onDelete={handleDelete} />}

                    {/* Grid for rest */}
                    {cameras.length > 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {cameras.slice(1).map(cam => (
                                <CameraFeed key={cam.id} cam={cam} onEdit={c => { setEditCam(c); setShowModal(true); }} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LiveMonitor;
