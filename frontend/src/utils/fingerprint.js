/**
 * Deterministic source message fingerprinting for duplicate detection.
 * Normalizes input text and generates a stable 64-bit FNV-1a hash.
 */

export function normalizeMessageText(rawText) {
  if (!rawText || typeof rawText !== 'string') return ''
  return rawText
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function computeMessageFingerprint(rawText) {
  const normalized = normalizeMessageText(rawText)
  if (!normalized) return ''

  // 64-bit FNV-1a implementation using two 32-bit lanes
  let h1 = 0x811c9dc5
  let h2 = 0x84222325
  const prime1 = 0x01000193
  const prime2 = 0x01000193

  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i)
    h1 = Math.imul(h1 ^ (code & 0xff), prime1)
    h2 = Math.imul(h2 ^ ((code >> 8) & 0xff), prime2)
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0')
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0')
  return `fp_${hex1}${hex2}`
}
