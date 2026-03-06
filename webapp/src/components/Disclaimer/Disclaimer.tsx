import { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

const DISCLAIMER_COOKIE = "watchcv_disclaimer_accepted";

const hasAccepted = (): boolean => {
  return document.cookie.split("; ").some((row) => row.startsWith(`${DISCLAIMER_COOKIE}=true`));
}

const setAccepted = () => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 2);
  document.cookie = `${DISCLAIMER_COOKIE}=true; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export const Disclaimer = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasAccepted()) setVisible(true);
  }, []);

  const handleAccept = () => {
    setAccepted();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl
        border border-gray-700 p-5 flex flex-col sm:flex-row gap-4 items-start">

        {/* Icon */}
        <div className="shrink-0 bg-indigo-500/20 rounded-xl p-2.5">
          <ShieldCheck size={22} className="text-indigo-400" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white mb-1">Privacy &amp; Data Notice</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            When you create a tracking link or tracked PDF, we store the{" "}
            <span className="text-white font-medium">IP address range</span> (e.g.{" "}
            <span className="font-mono text-xs bg-gray-800 px-1.5 py-0.5 rounded">
              192.168.1.0/24
            </span>
            ) of the person who created it — not your exact IP address. This is used solely
            to prevent abuse and spam creation of tracking links.{" "}
            <span className="text-white font-medium">
              No IP information of any kind is stored when someone opens your CV or clicks
              your tracking link.
            </span>{" "}
            By using WatchCV you agree to your IP address range being stored for this purpose.
          </p>
        </div>

        {/* Accept button */}
        <div className="flex items-center gap-2 shrink-0 self-center sm:self-start mt-1 sm:mt-0">
          <button
            onClick={handleAccept}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold
              px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            I understand
          </button>
          <button
            onClick={handleAccept}
            title="Dismiss"
            className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded-lg
              hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}