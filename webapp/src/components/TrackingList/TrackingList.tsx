import { Trash2, Eye } from "lucide-react";
import type { StoredTracking } from "../../types";

interface Props {
  trackings: StoredTracking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

const TrackingList = ({ trackings, selectedId, onSelect, onRemove }: Props) => {
  if (trackings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No trackings yet.</p>
        <p className="text-xs mt-1 text-gray-300">Upload a CV above to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {trackings.map((t) => (
        <div
          key={t.trackingId}
          onClick={() => onSelect(t.trackingId)}
          className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer
            border-2 transition-all duration-150 select-none
            ${selectedId === t.trackingId
              ? "bg-indigo-50 border-indigo-400"
              : "bg-gray-50 border-transparent hover:bg-gray-100"
            }`}
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 break-all">{t.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(t.createdAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-300 font-mono mt-0.5 truncate">
              {t.trackingId.slice(0, 20)}…
            </p>
          </div>
          <div className="flex items-center gap-1.5 ml-3">
            <button
              title="View stats"
              onClick={(e) => { e.stopPropagation(); onSelect(t.trackingId); }}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg p-1.5 transition-colors"
            >
              <Eye size={14} />
            </button>
            <button
              title="Remove from list"
              onClick={(e) => { e.stopPropagation(); onRemove(t.trackingId); }}
              className="bg-red-100 hover:bg-red-200 text-red-500 rounded-lg p-1.5 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TrackingList