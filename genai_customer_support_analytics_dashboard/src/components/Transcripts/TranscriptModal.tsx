import React, { useEffect, useState } from 'react';
import { X, Clock, Mic, Loader2 } from 'lucide-react';
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
  const { getParsedFile, normalizeResponse, loading, error } = useRecordingsService();
  const [data, setData] = useState<ParsedFile | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await getParsedFile(fileKey);
      if (raw) setData(normalizeResponse(raw));
    })();
  }, [fileKey, getParsedFile, normalizeResponse]);

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
          <div className="p-10 flex items-center justify-center text-gray-600">
            <Loader2 className="animate-spin mr-2" /> Loading…
          </div>
        )}

        {error && !loading && (
          <div className="p-6 text-sm text-red-600">{error}</div>
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
                    data.segments.map((seg: TranscriptSegment) => (
                      <div key={seg.id} className="p-3 border rounded-md">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs font-medium uppercase text-blue-600">{seg.speaker}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-800">{seg.text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No transcript segments found.</div>
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

