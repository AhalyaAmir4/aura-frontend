// 6-point browser fingerprint for anti-proxy
export async function getDeviceFingerprint(): Promise<string> {
  const parts: string[] = [];

  // 1. User agent + platform
  parts.push(navigator.userAgent);
  parts.push(navigator.platform || '');

  // 2. Screen
  parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // 3. Timezone
  parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // 4. Language
  parts.push(navigator.language);

  // 5. Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#069';
      ctx.fillText('AURA-fp-🎓', 2, 2);
      ctx.strokeStyle = 'rgba(255,0,255,0.7)';
      ctx.strokeText('AURA-fp-🎓', 4, 4);
      parts.push(canvas.toDataURL().slice(-64));
    }
  } catch {}

  // 6. WebGL renderer
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) parts.push(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
    }
  } catch {}

  // SHA-256 hash
  const data = new TextEncoder().encode(parts.join('|'));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getGeolocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}
