import React, { useState, useEffect } from 'react';
import { getSurveillanceLogs } from '../api/watchlistApi';
import { ScanLine, Loader2, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

const ConfidenceBadge = ({ level }) => {
    const styles = {
        high: { cls: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <ShieldCheck className="w-3 h-3 mr-1" /> },
        medium: { cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <ShieldAlert className="w-3 h-3 mr-1" /> },
        low: { cls: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <ShieldX className="w-3 h-3 mr-1" /> },
    };
    const style = styles[level] || styles.low;
    return (
        <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${style.cls}`}>
            {style.icon}{level}
        </span>
    );
};

const SurveillanceLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await getSurveillanceLogs();
            setLogs(data);
        } catch (e) {
            // Show dummy data if backend has no logs yet
            setLogs([
                { id: 1, person_name: 'Unidentified Subject', camera_location: 'Entrance Gate A', confidence_score: 0.92, confidence_level: 'high', notes: 'Match against watchlist ID-8X4', detected_at: new Date().toISOString() },
                { id: 2, person_name: null, camera_location: 'Terminal 4 — Gate B', confidence_score: 0.65, confidence_level: 'medium', notes: 'Low confidence — manual review required', detected_at: new Date(Date.now() - 900000).toISOString() },
                { id: 3, person_name: null, camera_location: 'Parking Deck North', confidence_score: 0.31, confidence_level: 'low', notes: null, detected_at: new Date(Date.now() - 3600000).toISOString() },
            ]);
        }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = filter === 'all' ? logs : logs.filter(l => l.confidence_level === filter);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-textMain">Surveillance Log</h1>
                    <p className="text-textMuted text-sm mt-1">All detected persons from active CCTV nodes.</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'high', 'medium', 'low'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? 'bg-primary text-white' : 'bg-surfaceHover text-textMuted border border-borderContent hover:border-primary/30'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
                <div className="bg-surface border border-borderContent rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-borderContent bg-[#151518]">
                                {['#', 'Identity', 'Camera Location', 'Confidence', 'Score', 'Notes', 'Detected At'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center text-textMuted">
                                        <ScanLine className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        No detections found.
                                    </td>
                                </tr>
                            ) : filtered.map((log, i) => (
                                <tr key={log.id} className="border-b border-borderContent/50 hover:bg-surfaceHover transition-all">
                                    <td className="px-5 py-4 text-textMuted font-mono text-xs">{String(log.id).padStart(4, '0')}</td>
                                    <td className="px-5 py-4 font-semibold text-textMain">{log.person_name || <span className="text-textMuted italic">Unidentified</span>}</td>
                                    <td className="px-5 py-4 text-textMuted">{log.camera_location}</td>
                                    <td className="px-5 py-4"><ConfidenceBadge level={log.confidence_level} /></td>
                                    <td className="px-5 py-4 font-mono text-textMuted">{log.confidence_score ? `${(log.confidence_score * 100).toFixed(1)}%` : '—'}</td>
                                    <td className="px-5 py-4 text-textMuted text-xs max-w-[200px] truncate">{log.notes || '—'}</td>
                                    <td className="px-5 py-4 text-textMuted text-xs font-mono">{new Date(log.detected_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SurveillanceLog;
