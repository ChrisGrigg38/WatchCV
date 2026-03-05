import { useEffect, useState } from "react";
import { getTracking } from "../../api/trackingApi";
import ViewsChart from "../ViewsChart/ViewsChart";
import type { TrackingDetail as TDetail } from "../../types";
import { Loader2 } from "lucide-react";

interface Props {
  trackingId: string;
}

const TrackingDetail = ({ trackingId }: Props) => {
  const [detail, setDetail] = useState<TDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTracking(trackingId)
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [trackingId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 flex items-center justify-center min-h-[320px]">
        <Loader2 className="animate-spin text-indigo-500" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <p className="text-red-500 text-sm">❌ {error}</p>
      </div>
    );
  }

  if (!detail) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">📊 Tracking Analytics</h3>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-indigo-50 rounded-xl px-4 py-3 flex-1 min-w-[120px]">
          <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide">Total Opens</p>
          <p className="text-3xl font-bold text-indigo-600 mt-0.5">{detail.events.length}</p>
        </div>
        <div className="bg-slate-50 rounded-xl px-4 py-3 flex-1 min-w-[120px]">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Created</p>
          <p className="text-sm font-semibold text-gray-700 mt-1">
            {new Date(detail.tracking.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl px-4 py-3 flex-1 min-w-[120px]">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Last Seen</p>
          <p className="text-sm font-semibold text-gray-700 mt-1">
            {detail.events.length > 0
              ? new Date(detail.tracking.lastUpdatedAt).toLocaleDateString()
              : "Never"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">
          Opens per Day
        </p>
        <ViewsChart events={detail.events} />
      </div>

      {detail.events.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
            Recent Events
          </p>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {[...detail.events].reverse().slice(0, 10).map((ev, i) => (
              <div
                key={ev.eventId}
                className={`flex justify-between items-center px-4 py-2.5 text-xs
                  ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <span className="text-gray-500">
                  {new Date(ev.createdAt).toLocaleString()}
                </span>
                <span className="text-gray-300 font-mono">{ev.ipAddress}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-300 font-mono break-all">{detail.tracking.trackingId}</p>
      </div>
    </div>
  );
}

export default TrackingDetail