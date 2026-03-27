import { useEffect, useRef, useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = (id) => {
    const timerSet = timersRef.current.get(id);
    if (timerSet) {
      clearTimeout(timerSet.leaveTimer);
      clearTimeout(timerSet.removeTimer);
      timersRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((p) => [...p, { id, message, type, leaving: false }]);

    const leaveTimer = setTimeout(() => {
      setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
    }, 2800);

    const removeTimer = setTimeout(() => {
      removeToast(id);
    }, 3400);

    timersRef.current.set(id, { leaveTimer, removeTimer });
    return id;
  };

  useEffect(() => () => {
    timersRef.current.forEach(({ leaveTimer, removeTimer }) => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    });
    timersRef.current.clear();
  }, []);

  return { toasts, toast, removeToast };
}