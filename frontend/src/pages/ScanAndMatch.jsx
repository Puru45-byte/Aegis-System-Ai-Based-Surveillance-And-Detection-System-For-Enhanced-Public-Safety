import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, ScanLine, Loader2, AlertTriangle, UserCheck, ShieldAlert, CheckCircle } from 'lucide-react';
import { scanPhoto } from '../api/scanApi';

const ScanAndMatch = () => {
    const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    const startCamera = async () => {
        setMode('camera');
        setFile(null);
        setPreview(null);
        setResults(null);
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError("Camera access denied or unavailable.");
            setMode('upload');
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    // Handle Upload Mode
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setResults(null);
        setError(null);
    };

    // Handle Camera Snapshot
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
            setFile(capturedFile);
            setPreview(URL.createObjectURL(capturedFile));
            stopCamera();
            setMode('upload');
        }, 'image/jpeg', 0.9);
    };

    const runScan = async () => {
        if (!file) return;
        setScanning(true);
        setError(null);
        setResults(null);

        try {
            const data = await scanPhoto(file);
            setResults(data);
        } catch (err) {
            setError(err?.response?.data?.detail || "Scan failed connecting to engine.");
        } finally {
            setScanning(false);
        }
    };

    const getConfidenceColor = (conf) => {
        if (conf >= 80) return "text-red-400 border-red-500/30 bg-red-500/10";
        if (conf >= 60) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
        return "text-green-400 border-green-500/30 bg-green-500/10";
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-textMain flex items-center gap-3">
                    <ScanLine className="w-8 h-8 text-primary" />
                    Biometrics Scan & Match
                </h1>
                <p className="text-textMuted text-sm mt-1">
                    Upload or capture a face to run against active suspect intelligence database.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT - Input Section */}
                <div className="bg-surface border border-borderContent rounded-2xl p-6 flex flex-col items-center justify-center min-h-[400px]">
                    {/* Mode Toggle */}
                    <div className="flex bg-[#111114] p-1 rounded-xl mb-6 w-full max-w-sm border border-borderContent">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'upload' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-textMain'}`}
                            onClick={() => { stopCamera(); setMode('upload'); }}
                        >
                            <Upload className="w-4 h-4" /> Upload
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'camera' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-textMain'}`}
                            onClick={startCamera}
                        >
                            <Camera className="w-4 h-4" /> Camera
                        </button>
                    </div>

                    {/* Camera Feed Context */}
                    {mode === 'camera' && (
                        <div className="w-full flex flex-col items-center">
                            <div className="relative w-full max-w-md aspect-video bg-black rounded-2xl overflow-hidden border border-borderContent">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                {/* Face alignment overlay helper */}
                                <div className="absolute inset-0 border-[3px] border-dashed border-primary/50 m-8 rounded-[40px] pointer-events-none" />
                            </div>
                            <button
                                onClick={capturePhoto}
                                className="mt-6 w-16 h-16 bg-primary rounded-full border-4 border-[#18181b] shadow-[0_0_0_2px_#3b82f6] hover:scale-105 transition-transform"
                            />
                            <p className="text-sm text-textMuted mt-4">Position face in frame and tap to capture</p>
                        </div>
                    )}

                    {/* Upload Context */}
                    {mode === 'upload' && (
                        <div className="w-full max-w-md text-center">
                            {preview ? (
                                <div className="space-y-4">
                                    <img src={preview} alt="Target" className="w-full max-h-[300px] object-contain rounded-2xl border border-borderContent bg-black" />
                                    <div className="flex gap-3">
                                        <label className="flex-1 py-2.5 border border-borderContent rounded-xl text-sm text-textMuted hover:bg-surfaceHover transition-all cursor-pointer">
                                            Clear / Retake
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </label>
                                        <button
                                            onClick={runScan}
                                            disabled={scanning}
                                            className="flex-1 py-2.5 bg-primary hover:bg-primaryHover text-white font-semibold rounded-xl text-sm transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ScanLine className="w-4 h-4" /> Run Analysis</>}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-[300px] border-2 border-dashed border-borderContent hover:border-primary/50 rounded-2xl cursor-pointer transition-all bg-[#111114]">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                        <Upload className="w-8 h-8 text-primary/80" />
                                    </div>
                                    <p className="text-base font-medium text-textMain">Drop image here</p>
                                    <p className="text-sm text-textMuted mt-1">or click to browse from device</p>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            )}
                        </div>
                    )}

                    {/* Hidden canvas for capturing video frames */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* RIGHT - Results Section */}
                <div className="bg-surface border border-borderContent rounded-2xl p-6 flex flex-col h-[520px]">
                    <h2 className="text-lg font-bold text-textMain border-b border-borderContent pb-4 mb-4 flex items-center justify-between">
                        <span>Analysis Results</span>
                        {scanning && <span className="flex items-center text-xs font-mono text-primary animate-pulse"><ScanLine className="w-3.5 h-3.5 mr-1" /> ENGINE ACTIVE</span>}
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {!results && !error && !scanning && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                <ScanLine className="w-16 h-16 text-textMuted mb-4" />
                                <p className="text-textMuted">Upload a subject and run analysis<br />to search active database.</p>
                            </div>
                        )}

                        {scanning && (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-surface border-t-primary rounded-full animate-spin" />
                                    <div className="w-16 h-16 border-4 border-surface border-b-primary rounded-full animate-spin absolute inset-0 direction-reverse" style={{ animationDirection: 'reverse' }} />
                                </div>
                                <p className="text-textMain font-mono text-sm animate-pulse">EXTRACTING VECTORS...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start text-red-400">
                                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm">Scan Engine Error</p>
                                    <p className="text-xs mt-1 opacity-80">{error}</p>
                                </div>
                            </div>
                        )}

                        {results && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between bg-[#111114] p-3 rounded-lg border border-borderContent">
                                    <span className="text-sm text-textMuted">Faces Detected: {results.faces_detected}</span>
                                    <span className="text-sm text-textMuted">Matches: <strong className="text-textMain">{results.matches.length}</strong></span>
                                </div>

                                {results.matches.length === 0 ? (
                                    <div className="text-center py-10 bg-[#0c0c0f] border border-dashed border-borderContent rounded-xl">
                                        <CheckCircle className="w-12 h-12 mx-auto text-green-500/50 mb-3" />
                                        <p className="text-textMain font-semibold">No Matches Found</p>
                                        <p className="text-sm text-textMuted mt-1">Subject clears active database check.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {results.matches.map((match, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 border border-borderContent rounded-xl bg-[#0c0c0f] hover:border-primary/30 transition-colors">
                                                <div className="w-20 h-24 rounded-lg bg-black border border-borderContent overflow-hidden flex-shrink-0">
                                                    <img 
                                                        src={match.photo_url} 
                                                        onError={(e) => { 
                                                            e.target.src = `https://picsum.photos/seed/default${match.id}/200/240.jpg`; 
                                                        }}
                                                        className="w-full h-full object-cover object-top" 
                                                        alt={match.name} 
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-bold text-textMain text-sm">{match.name}</h3>
                                                            <p className="text-xs text-textMuted">
                                                                {match.type === 'missing' ? 'Missing Person' : match.type === 'criminal' ? 'Criminal' : 'Unknown'}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                                                            match.type === 'missing' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                                                            match.type === 'criminal' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                                                            'bg-gray-500/20 text-gray-500 border-gray-500/30'
                                                        }`}>
                                                            {match.match}% MATCH
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                                            match.type === 'missing' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                                                            match.type === 'criminal' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                                                            'bg-gray-500/20 text-gray-500 border-gray-500/30'
                                                        }`}>
                                                            {match.type === 'missing' ? 'MISSING PERSON' : match.type === 'criminal' ? 'CRIMINAL' : 'UNKNOWN'}
                                                        </span>
                                                        <span className="text-[10px] text-textMuted bg-surface px-2 py-0.5 rounded border border-borderContent font-mono">
                                                            ID: {match.id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanAndMatch;
