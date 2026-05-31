/**
 * Cross-platform haptic feedback utility utilizing the HTML5 Vibration API.
 * Safely checks for navigator support and handles standard tactile click responses.
 */
export const haptic = {
  /**
   * Triggers a custom vibration pattern.
   * @param pattern Vibration pattern in milliseconds.
   */
  vibrate(pattern: number | number[]): boolean {
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      try {
        return navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Vibration API blocked or failed:', e);
        return false;
      }
    }
    return false;
  },

  /**
   * Extremely light tactile feedback for quick interactions (navigation clicks, toggle switches).
   */
  light() {
    return this.vibrate(12);
  },

  /**
   * Standard tactile feedback for significant actions (confirmations, submissions, button triggers).
   */
  medium() {
    return this.vibrate(30);
  },

  /**
   * Double pulse for successful events (e.g. check-in success).
   */
  success() {
    return this.vibrate([40, 50, 40]);
  },

  /**
   * Multi-pulse signature for validation errors or failures.
   */
  error() {
    return this.vibrate([60, 50, 100]);
  },
};
