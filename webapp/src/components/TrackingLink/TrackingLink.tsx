import { useState } from "react";
import { Link, Loader2, Copy, Check } from "lucide-react";
import { createTracking } from "../../api/trackingApi";

interface Props {
  onCreated: (trackingId: string, label: string) => void;
}

const TrackingLink = ({ onCreated }: Props) => {
  const [url, setUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isValidUrl = (val: string) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!url.trim() || !isValidUrl(url.trim())) {
      setError("Please enter a valid URL including https://");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedLink(null);

    try {
      const { trackingId } = await createTracking();
      const trackingUrl = `${window.location.origin}/api/redirect?trackingId=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(url.trim())}`;
      setGeneratedLink(trackingUrl);
      onCreated(trackingId, url.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate tracking link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white">
      <div className="flex flex-start gap-2 mb-1">
        <h2 className="text-xl font-bold mb-1">📄 Generate Tracking Link</h2>
      </div>
      <p className="text-indigo-100 text-sm mb-5 leading-relaxed">
        Enter any URL and we'll create a tracking link. When someone clicks it, the
        open is recorded and they're redirected to your destination.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          data-testid="trackinglink-url"
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
            setGeneratedLink(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="https://your-portfolio.com"
          className="flex-1 text-black text-sm border border-gray-200 rounded-lg px-3 py-2.5
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
            placeholder:text-gray-900 transition-all"
        />
        <button
          onClick={handleGenerate}
          disabled={(loading || !url.trim())}
          data-testid="trackinglink-generate"
          className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold
        px-5 py-2.5 rounded-lg cursor-pointer shadow-md hover:bg-indigo-50 transition-colors"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
            : <><Link size={14} /> Generate</>
          }
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">❌ {error}</p>
      )}

      {generatedLink && (
        <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
            ✅ Your tracking link is ready
          </p>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Share this link instead of your original URL. Anyone who clicks it will be
            tracked and then redirected to your destination automatically.
          </p>
          <div className="flex items-center gap-2 bg-white border border-indigo-200 rounded-lg px-3 py-2">
            <p className="flex-1 text-xs font-mono text-gray-600 break-all leading-relaxed">
              {generatedLink}
            </p>
            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="shrink-0 text-indigo-400 hover:text-indigo-600 transition-colors p-1"
            >
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackingLink