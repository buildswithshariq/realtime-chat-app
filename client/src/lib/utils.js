import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {

  return twMerge(clsx(inputs));

}

export function formatLastSeen(lastSeen) {
  if (!lastSeen) return "Active while ago";

  const now = Date.now();
  const then = new Date(lastSeen).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Active now";
  if (diffMins < 60) {
    return `Active ${diffMins} ${diffMins === 1 ? "min" : "mins"} ago`;
  }
  if (diffHours < 24) {
    return `Active ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffHours < 48) return "Active yesterday";
  return "Active while ago";
}