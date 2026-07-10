// Strip HTML/markup that models sometimes emit into text fields. Previews render
// with white-space: pre-wrap, so raw tags print literally on screen — normalize
// them to plain text with real newlines before storing.
export function stripHTML(text: string): string {
  let t = String(text || '')
  t = t.replace(/<\s*\/?\s*br\s*\/?\s*>/gi, '\n')
  t = t.replace(/&lt;\s*\/?\s*br\s*\/?\s*&gt;/gi, '\n')
  t = t.replace(/<\s*\/?\s*p\s*>/gi, '\n')
  t = t.replace(/&lt;\s*\/?\s*p\s*&gt;/gi, '\n')
  t = t.replace(/<\/?[a-z][^>]*>/gi, '')
  t = t.replace(/&lt;\/?[a-z][^&]*&gt;/gi, '')
  t = t.replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&')
  t = t.replace(/\n{3,}/g, '\n\n')
  return t.trim()
}

export function stripHTMLInline(text: string): string {
  return stripHTML(text).replace(/[\r\n]+/g, ' ').replace(/[ \t]{2,}/g, ' ').trim()
}
