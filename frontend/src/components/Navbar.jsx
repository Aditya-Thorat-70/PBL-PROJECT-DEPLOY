export default function Navbar({ appMode, setAppMode, view, setView, status, onReset }) {
  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/90 px-3 sm:px-4 md:px-6 py-3">
      <div className="max-w-6xl mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Logo */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-lg shadow-md">
              🖨️
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 truncate" style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}>
              QuickPrint
            </span>
          </div>

          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2">
          <div className="hidden sm:flex bg-gray-100 rounded-xl p-1 gap-1">
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

          {/* View Toggle */}
          {appMode === "quickprint" && (
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-full sm:w-auto">
              <button
                onClick={() => setView("pc")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  view === "pc" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
                style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
              >
                🖥 PC
              </button>
              <button
                onClick={() => setView("mobile")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  view === "mobile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
                style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
              >
                📱 Mobile
              </button>
            </div>
          )}

          {/* Reset */}
          {appMode === "quickprint" && (
            <button
              onClick={onReset}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-all"
            >
              ↻ Reset Room
            </button>
          )}
        </div>
      </div>

      <div className="sm:hidden mt-2 flex bg-gray-100 rounded-xl p-1 gap-1 max-w-xs mx-auto">
        <button
          onClick={() => setAppMode("quickprint")}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            appMode === "quickprint" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
          style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
        >
          QuickPrint
        </button>
        <button
          onClick={() => setAppMode("student-drive")}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            appMode === "student-drive" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
          style={{ fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif" }}
        >
          Drive
        </button>
      </div>

      <div className="sm:hidden mt-2 text-center">
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
    </nav>
  );
}