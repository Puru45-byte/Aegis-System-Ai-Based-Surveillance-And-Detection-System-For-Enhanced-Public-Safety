import React, { useState, useEffect } from 'react';
import { getTips, markTipReviewed } from '../api/watchlistApi';
import { MessageSquareText, CheckCheck, Loader2, Clock } from 'lucide-react';

const ViewTips = () => {
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await getTips();
            setTips(data);
        } catch (e) {
            // Show dummy data if backend has no tips yet
            setTips([
                { id: 1, submitted_by: 'Anonymous', title: 'Suspicious vehicle near Terminal 4', content: 'A grey van has been parked near Terminal 4 Gate B for 3 days. The occupants were seen watching the entrance cameras.', is_reviewed: false, submitted_at: new Date().toISOString() },
                { id: 2, submitted_by: 'Field Agent K-21', title: 'Possible weapons cache', content: 'Informant reported that a warehouse on 5th street may contain illegal weapons. Address: 14B Industrial Road.', is_reviewed: true, submitted_at: new Date(Date.now() - 86400000).toISOString() },
                { id: 3, submitted_by: 'Anonymous', title: 'Known associate sighted', content: 'ID-6X1 was spotted at the downtown market at roughly 14:00. No contact was made.', is_reviewed: false, submitted_at: new Date(Date.now() - 7200000).toISOString() },
            ]);
        }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleMarkReviewed = async (id) => {
        try { await markTipReviewed(id); }
        catch (e) { /* ignore for demo */ }
        setTips(prev => prev.map(t => t.id === id ? { ...t, is_reviewed: true } : t));
    };

    const filtered = filter === 'all' ? tips : tips.filter(t => filter === 'reviewed' ? t.is_reviewed : !t.is_reviewed);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-textMain">Intelligence Tips</h1>
                    <p className="text-textMuted text-sm mt-1">Submitted reports and field tips awaiting review.</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'reviewed'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${filter === f ? 'bg-primary text-white' : 'bg-surfaceHover text-textMuted border border-borderContent hover:border-primary/30'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-borderContent rounded-2xl">
                    <MessageSquareText className="w-12 h-12 mx-auto text-textMuted mb-3 opacity-40" />
                    <p className="text-textMuted">No tips found in this category.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(tip => (
                        <div key={tip.id}
                            className={`bg-surface border rounded-2xl p-5 transition-all ${tip.is_reviewed ? 'border-borderContent opacity-70' : 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {tip.is_reviewed ? (
                                            <span className="flex items-center text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                                <CheckCheck className="w-3 h-3 mr-1" /> Reviewed
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                                <Clock className="w-3 h-3 mr-1" /> Pending Review
                                            </span>
                                        )}
                                        <span className="text-xs text-textMuted">From: {tip.submitted_by || 'Anonymous'}</span>
                                    </div>
                                    <h3 className="font-semibold text-textMain text-base mb-2">{tip.title}</h3>
                                    <p className="text-sm text-textMuted leading-relaxed">{tip.content}</p>
                                    <p className="text-xs text-textMuted mt-3 font-mono">{new Date(tip.submitted_at).toLocaleString()}</p>
                                </div>
                                {!tip.is_reviewed && (
                                    <button onClick={() => handleMarkReviewed(tip.id)}
                                        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-xl hover:bg-green-500/20 transition-all">
                                        <CheckCheck className="w-4 h-4" /> Mark Reviewed
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewTips;
