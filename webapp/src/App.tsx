import { useState } from "react";
import { useTrackings } from "./hooks/useTrackings";
import PdfInjector from "./components/PdfInjector/PdfInjector";
import TrackingLink from "./components/TrackingLink/TrackingLink";
import TrackingList from "./components/TrackingList/TrackingList";
import TrackingDetail from "./components/TrackingDetail/TrackingDetail";
import { Disclaimer } from "./components/Disclaimer/Disclaimer";
import Header from "./components/Header/Header";

const App = () => {
  const { trackings, addTracking, removeTracking } = useTrackings();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleCreated = (trackingId: string, label: string) => {
    addTracking(trackingId, label);
    setSelectedId(trackingId);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">

        {/* Left column */}
        <div className="flex flex-col gap-4">
          <PdfInjector onCreated={handleCreated} />
          <TrackingLink onCreated={handleCreated} />

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Your Tracked CVs or Links</h3>
            <TrackingList
              trackings={trackings}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={(id: string) => {
                removeTracking(id);
                if (selectedId === id) setSelectedId(null);
              }}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="sticky top-6">
          {selectedId ? (
            <TrackingDetail trackingId={selectedId} />
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center min-h-[320px]">
              <span className="text-5xl mb-4">📈</span>
              <p className="text-gray-400 text-sm text-center max-w-xs">
                Select a tracked CV on the left to view its open history and analytics.
              </p>
            </div>
          )}
        </div>
      </main>

      <Disclaimer />
    </div>
  );
}

export default App