import { useEffect, useMemo, useState } from "react";

const SECOND_IN_MS = 1000;

const formatTimeLeft = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / SECOND_IN_MS));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
};

export default function SessionTimer({ expiresAt, roomId, compact = false }) {
  const expiryTime = useMemo(() => {
    if (!expiresAt) return null;
    const timestamp = new Date(expiresAt).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }, [expiresAt]);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!expiryTime) return () => {};

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, SECOND_IN_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [expiryTime]);

  if (!expiryTime) {
    return null;
  }

  const timeLeftMs = expiryTime - now;
  const isExpired = timeLeftMs <= 0;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
          isExpired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
        }`}
      >
        <span>{isExpired ? "Session expired" : "Session time left"}</span>
        {!isExpired && <span className="font-extrabold tracking-wide">{formatTimeLeft(timeLeftMs)}</span>}
      </div>
    );
  }

  return (
    <div className={`w-full rounded-xl border px-4 py-3 ${isExpired ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide ${isExpired ? "text-red-600" : "text-amber-700"}`}>
        Room Session Timer{roomId ? ` (${roomId})` : ""}
      </div>
      <div className={`mt-1 text-lg font-extrabold ${isExpired ? "text-red-700" : "text-amber-900"}`} style={{ fontFamily: "Syne, sans-serif" }}>
        {isExpired ? "Session expired" : formatTimeLeft(timeLeftMs)}
      </div>
      <div className={`mt-1 text-xs ${isExpired ? "text-red-600" : "text-amber-700"}`}>
        {isExpired ? "This room is no longer active." : "Time remaining before this room session expires."}
      </div>
    </div>
  );
}
