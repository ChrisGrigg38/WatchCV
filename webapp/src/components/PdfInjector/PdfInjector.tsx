import { useState, useRef } from "react";
import { createTracking } from "../../api/trackingApi";
import { Upload, Loader2 } from "lucide-react";
import { usePDFTrackings } from "../../hooks/usePDFTrackings";

interface Props {
  onCreated: (trackingId: string, filename: string) => void;
}

const PdfInjector = ({ onCreated }: Props) => {
  const { embedJavascriptPDF, savePDF } = usePDFTrackings()
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setStatus("Creating tracking ID...");

    try {
      const { trackingId } = await createTracking();
      setStatus("Injecting tracking into PDF...");

      const data = await embedJavascriptPDF(file, window.location.origin + "/api/addTracking", trackingId )
      const outputName = savePDF(data, file)

      setStatus(`✅ Done! "${outputName}" downloaded.`);
      onCreated(trackingId, outputName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus(null);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white">
      <h2 className="text-xl font-bold mb-1">📄 Track Your CV</h2>
      <p className="text-indigo-100 text-sm mb-5 leading-relaxed">
        Select your CV PDF to embed invisible tracking. Every time someone opens it
        in Adobe Acrobat, you'll see it logged here.
      </p>

      <label className={`inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold
        px-5 py-2.5 rounded-lg cursor-pointer shadow-md hover:bg-indigo-50 transition-colors
        ${loading ? "opacity-60 pointer-events-none" : ""}`}>
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
          : <><Upload size={16} /> Select CV PDF</>
        }
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFile}
          disabled={loading}
        />
      </label>

      {status && (
        <p className="mt-3 text-sm text-indigo-100">{status}</p>
      )}
      {error && (
        <p className="mt-3 text-sm bg-red-500/20 border border-red-300/30 rounded-lg px-3 py-2">
          ❌ {error}
        </p>
      )}
    </div>
  );
}

export default PdfInjector