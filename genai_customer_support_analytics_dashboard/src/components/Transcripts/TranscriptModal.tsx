import React, { useEffect, useState } from 'react';
import { X, Clock, Mic, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import useRecordingsService, { ParsedFile, TranscriptSegment } from '../../services/recordingsService';

interface Props {
  fileKey: string; // e.g. Auto1_GUID_001_AGENT_AndrewK_DT2025-02-20T07-55-51.wav.json
  onClose: () => void;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
};

const TranscriptModal: React.FC<Props> = ({ fileKey, onClose }) => {
  const { getParsedFile, normalizeResponse, loading, error, isReady } = useRecordingsService();
  const [data, setData] = useState<ParsedFile | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const loadData = async () => {
    setLocalError(null);
    try {
      console.log('📥 Loading transcript data for:', fileKey);
      const raw = await getParsedFile(fileKey);
      if (raw) {
        const normalized = normalizeResponse(raw);
        setData(normalized);
        console.log('✅ Transcript data loaded successfully');
      } else {
        setLocalError('No data received from server');
      }
    } catch (err) {
      console.error('❌ Error loading transcript:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to load transcript');
    }
  };

  useEffect(() => {
    if (fileKey && isReady) {
      loadData();
    }
  }, [fileKey, isReady]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Conversation Details</h3>
            <p className="text-xs text-gray-500 break-all">{fileKey}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-gray-600">Loading transcript...</p>
          </div>
        )}

        {(error || localError) && !loading && (
          <div className="p-10 flex flex-col items-center justify-center gap-4">
            <AlertCircle className="text-red-600" size={40} />
            <p className="text-red-600 font-semibold">Failed to load transcript</p>
            <p className="text-gray-600 text-sm">{error || localError}</p>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        )}

        {!loading && data && (
          <div className="grid lg:grid-cols-3 gap-6 p-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Audio Player */}
              {data.audioUrl && (
                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Mic size={16} /> Recording
                  </div>
                  <audio src={data.audioUrl} controls className="w-full" />
                </div>
              )}

              {/* Transcript */}
              <div>
                <h4 className="text-md font-semibold mb-2">Transcript</h4>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {data.segments?.length ? (
                    data.segments.map((seg: TranscriptSegment, idx: number) => {
                      const speakerColor = seg.speaker.toLowerCase().includes('agent') ? 'text-blue-600' : 'text-green-600';
                      const bgColor = seg.speaker.toLowerCase().includes('agent') ? 'bg-blue-50' : 'bg-green-50';
                      
                      return (
                        <div key={seg.id || idx} className={`p-3 border rounded-md ${bgColor}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className={`text-xs font-medium uppercase ${speakerColor}`}>{seg.speaker}</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-800">{seg.text}</div>
                          {seg.confidence && (
                            <div className="text-xs text-gray-500 mt-1">
                              Confidence: {Math.round(seg.confidence * 100)}%
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm text-gray-500">No transcript segments found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Meta Panel */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-gray-50">
                <div className="text-xs text-gray-500">Media</div>
                <div className="text-sm font-medium">
                  {data.Recording?.MediaFormat || '—'}
                </div>
              </div>
              {data.Transcript?.TranscriptUrl && (
                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="text-xs text-gray-500">Transcript File</div>
                  <a className="text-sm text-blue-600 underline break-all" href={data.Transcript.TranscriptUrl} target="_blank" rel="noreferrer">
                    Open transcript
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptModal;

