/** SVG icon for the player's chosen class. Renders to the left of date in topnav. */
export function ClassIcon({ classTitle, className }: { classTitle: string | null | undefined; className?: string }) {
  const c = (classTitle ?? '').toLowerCase();

  if (c.includes('farmer')) {
    // Sickle
    return (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={10} style={{ transform: 'rotate(180deg)', transformOrigin: 'center' }} className={className} aria-hidden>
        <path d="M4.7,27.5L4.7,27.5c-2-2-2-5.2,0-7.1l3.6-3.6l7.1,7.1l-3.6,3.6C9.8,29.4,6.6,29.4,4.7,27.5z" />
        <path d="M24.8,9.1L23,7.3C22,6.2,22,4.5,23,3.4l0.2-0.2l5.7,5.7l-0.2,0.2C27.7,10.2,25.9,10.2,24.8,9.1z" />
        <path d="M16.1,16L16.1,16c-0.8-0.8-0.8-2.1,0-2.9l6.4-6.4l2.9,2.9L18.9,16C18.1,16.8,16.9,16.8,16.1,16z" />
        <line x1="9" y1="23.2" x2="16.1" y2="16" />
      </svg>
    );
  }
  if (c.includes('archer')) {
    // Bow
    return (
      <svg viewBox="0 0 512 512" fill="currentColor" style={{ transform: 'rotate(180deg)', transformOrigin: 'center' }} className={className} aria-hidden>
        <polygon points="380.141,162.138 481.76,166.699 512,136.474 381.402,130.59 375.534,0.007 345.31,30.233 349.854,131.867 347.301,134.42 319.337,162.384 314.792,60.75 284.56,90.983 289.112,192.609 257.527,224.195 251.166,124.376 221.342,154.201 227.71,254.012 90.698,391.031 56.097,356.431 0,511.993 155.57,455.911 120.969,421.31 257.665,284.614 361.152,287.321 390.14,258.319 390.47,256.627 288.328,253.943 319.392,222.872 421.025,227.44 451.25,197.216 349.624,192.655 377.573,164.706" />
      </svg>
    );
  }
  if (c.includes('healer')) {
    // Heart
    return (
      <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
        <path d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z" />
      </svg>
    );
  }
  if (c.includes('monk')) {
    // Sun (starburst)
    return (
      <svg viewBox="0 -0.1 122.88 122.88" fill="currentColor" fillRule="evenodd" clipRule="evenodd" className={className} aria-hidden>
        <path d="M122.88,62.58l-12.91,8.71l7.94,13.67l-15.03,3.23l2.72,15.92l-15.29-2.25l-2.76,15.58l-14.18-8.11 l-7.94,13.33l-10.32-11.93l-12.23,9.55l-4.97-15.16l-15.54,4.59l1.23-15.54L7.69,92.43l6.75-13.93L0,71.03l11.29-10.95L0.38,48.66 l14.65-6.5L9.42,27.51l15.58-0.76l0-15.8l14.78,5.22l5.99-14.82l11.93,9.98L68.15,0l7.6,13.33l14.18-6.5l2.12,15.07l15.8-1.15 l-3.86,15.46l15.41,4.2l-9.21,12.95L122.88,62.58L122.88,62.58z M104.96,61.1c0-12.14-4.29-22.46-12.87-31 c-8.58-8.54-18.94-12.82-31.04-12.82c-12.1,0-22.42,4.29-30.96,12.82c-8.54,8.53-12.82,18.85-12.82,31 c0,12.1,4.29,22.46,12.82,31.08c8.53,8.62,18.85,12.95,30.96,12.95c12.1,0,22.46-4.33,31.04-12.95 C100.67,83.56,104.96,73.2,104.96,61.1L104.96,61.1L104.96,61.1z" />
      </svg>
    );
  }
  // Knight (default) — sword
  return (
    <svg viewBox="-2.5 -2.5 24 24" fill="currentColor" preserveAspectRatio="xMinYMin meet" className={className} aria-hidden>
      <path d="M9.646 14.096a1 1 0 1 1-1.414 1.414l-1.414-1.414-2.828 2.829a1 1 0 0 1-1.415 1.414l-1.414-1.414a1 1 0 0 1 1.414-1.415l2.829-2.828-1.414-1.414a1 1 0 0 1 1.414-1.414l4.242 4.242zm.708-.707L6.11 9.146 14.596.661l3.536.707.707 3.536-8.485 8.485z" />
    </svg>
  );
}
