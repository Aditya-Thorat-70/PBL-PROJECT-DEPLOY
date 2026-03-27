import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = (message, type = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type, leaving: false }]);
    setTimeout(
      () => setToasts((p) => p.map((t) => (t.id === id ? { ...t, leaving: true } : t))),
      2800
    );
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  };

  return { toasts, toast };
}