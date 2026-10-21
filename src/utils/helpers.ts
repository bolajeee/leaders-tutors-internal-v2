export const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
export const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export function removeUnderscore(name: string) {
  return name
    .replace(/_/g, " ") // Replace underscores with spaces
    .toLowerCase() // Convert to lowercase
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word
}
export const capitalizeWords = (label: string) => {
  return label
    ? label
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";
};

export function timeAge(isoDate: string): string {
  const now = new Date();
  const past = new Date(isoDate);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  let s = "";

  if (seconds < 60) {
    s = seconds > 1 ? "secs" : "sec";
    return `${seconds} ${s} ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    s = minutes > 1 ? "mins" : "min";
    return `${minutes} ${s} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    s = hours > 1 ? "hrs" : "hr";
    return `${hours} ${s} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    s = days > 1 ? "days" : "day";
    return `${days} ${s} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    s = months > 1 ? "months" : "month";
    return `${months} ${s} ago`;
  }

  const years = Math.floor(months / 12);
  s = years > 1 ? "years" : "year";
  return `${years} ${s} ago`;
}

export function getInitials(name?: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean) // remove extra spaces
    .map((part) => part[0].toUpperCase())
    .join("");
}
export const convertToDuration = (estimated_learning_time: number): string => {
  if (!estimated_learning_time || estimated_learning_time < 0) return "0s";

  const hours = Math.floor(estimated_learning_time / 3600);
  const minutes = Math.floor((estimated_learning_time % 3600) / 60);
  const seconds = estimated_learning_time % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
};
