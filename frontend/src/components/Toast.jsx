const ICONS = { success: "✅", error: "❌", info: "ℹ️" };
const BORDERS = { success: "border-l-emerald-500", error: "border-l-red-500", info: "border-l-indigo-500" };

function Toast({ toast }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border-l-4 shadow-xl text-sm font-medium text-gray-800 min-w-[220px] max-w-xs
        ${BORDERS[toast.type] || BORDERS.info}
        ${toast.leaving ? "animate-toastOut" : "animate-toastIn"}
      `}
    >
      <span className="text-lg">{ICONS[toast.type]}</span>
      <span>{toast.message}</span>
    </div>
  );
}

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} />
        </div>
      ))}
    </div>
  );
}