export const ONBOARDING_STORAGE_KEY = "siagabencana_onboarding_completed_v1";
export const ONBOARDING_COOKIE_NAME = "fg_onboarding";

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
  } catch {
    // Ignore storage write failures (private mode, storage limits, etc).
  }

  document.cookie = `${ONBOARDING_COOKIE_NAME}=1; Max-Age=31536000; Path=/; SameSite=Lax`;
}
