import { useState } from "react";

export default function Navbar({ appMode, setAppMode, view, setView, status, onReset }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleAppModeChange = (nextMode) => {
    setAppMode(nextMode);
    if (nextMode === "student-drive") {
      setView("pc");
    }
    closeMobileMenu();
  };

  const handleViewChange = (nextView) => {
    setView(nextView);
    closeMobileMenu();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/90 px-3 sm:px-4 md:px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-lg shadow-md">
            🖨️
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 truncate" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
            QuickPrint
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setAppMode("quickprint")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                appMode === "quickprint" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
            >
              QuickPrint
            </button>
            <button
              onClick={() => setAppMode("student-drive")}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                appMode === "student-drive" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
            >
              Student Drive
            </button>
          </div>

          {appMode === "quickprint" && (
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setView("pc")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  view === "pc" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
                style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
              >
                🖥 PC
              </button>
              <button
                onClick={() => setView("mobile")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  view === "mobile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
                style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
              >
                📱 Mobile
              </button>
            </div>
          )}

          {appMode === "quickprint" && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-all"
            >
              ↻ Reset Room
            </button>
          )}

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === "Active" ? "bg-green-500 animate-pulse" : "bg-yellow-500 animate-pulse"
              }`}
            />
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === "Active" ? "bg-green-500 animate-pulse" : "bg-yellow-500 animate-pulse"
              }`}
            />
            {status}
          </span>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="navbar-mobile-menu"
          >
            <span className="text-lg leading-none">{mobileMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="navbar-mobile-menu" className="sm:hidden mt-3 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAppModeChange("quickprint")}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                  appMode === "quickprint" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                QuickPrint
              </button>
              <button
                onClick={() => handleAppModeChange("student-drive")}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                  appMode === "student-drive" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                Student Drive
              </button>
            </div>
          </div>

          {appMode === "quickprint" && (
            <div className="p-3 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleViewChange("pc")}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                    view === "pc" ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  🖥 PC
                </button>
                <button
                  onClick={() => handleViewChange("mobile")}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                    view === "mobile" ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  📱 Mobile
                </button>
              </div>
            </div>
          )}

          {appMode === "quickprint" && (
            <div className="p-3">
              <button
                onClick={() => {
                  onReset();
                  closeMobileMenu();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all"
              >
                ↻ Reset Room
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}