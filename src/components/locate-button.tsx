"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocateIcon } from "@/components/icons";

export function LocateButton({ variant = "solid" }: { variant?: "solid" | "outline" }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "locating" | "denied" | "error">("idle");

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setState("error");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/near?lat=${latitude.toFixed(5)}&lon=${longitude.toFixed(5)}`);
      },
      (error) => {
        setState(error.code === error.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const base =
    variant === "solid"
      ? "bg-ink text-paper hover:-translate-y-px"
      : "border border-line bg-card text-ink-soft hover:border-line-strong hover:text-ink";

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={locate}
        disabled={state === "locating"}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.88rem] font-semibold transition-transform disabled:opacity-60 ${base}`}
      >
        <LocateIcon className={`size-4 ${state === "locating" ? "animate-spin" : ""}`} />
        {state === "locating" ? "Finding you…" : "Use my location"}
      </button>
      {state === "denied" ? (
        <p className="max-w-sm text-[0.78rem] leading-relaxed text-brick">
          Location permission was denied. You can still browse by area —{" "}
          <a href="/areas" className="link-underline">
            pick your area
          </a>{" "}
          instead.
        </p>
      ) : null}
      {state === "error" ? (
        <p className="max-w-sm text-[0.78rem] leading-relaxed text-brick">
          We could not read your location. Pick your area from the list instead.
        </p>
      ) : null}
    </div>
  );
}
