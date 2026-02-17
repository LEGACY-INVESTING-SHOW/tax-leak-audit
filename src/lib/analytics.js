export function trackEvent(eventName, properties = {}) {
  // Replace with GA4, Segment, Pixel, or your preferred analytics destination.
  if (window?.dataLayer) {
    window.dataLayer.push({ event: eventName, ...properties });
  }

  // Development fallback to ensure instrumentation is visible while integrating.
  if (import.meta.env.DEV) {
    console.info("[analytics]", eventName, properties);
  }
}
