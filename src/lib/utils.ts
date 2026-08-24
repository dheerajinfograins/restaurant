import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely copy text to clipboard using the modern Clipboard API
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy text to clipboard:", err);
    return false;
  }
}
