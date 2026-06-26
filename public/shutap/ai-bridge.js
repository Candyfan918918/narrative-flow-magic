/* Lovable AI bridge — exposes window.claude.complete({system, messages, prompt, maxTokens})
   POSTs to /api/complete which runs Lovable AI Gateway (google/gemini-3-flash-preview by default). */
(function(){
  if (window.claude && typeof window.claude.complete === 'function') return;
  async function complete(opts){
    opts = opts || {};
    var messages = Array.isArray(opts.messages) ? opts.messages : null;
    if (!messages) {
      var prompt = opts.prompt != null ? String(opts.prompt) : '';
      messages = [{ role:'user', content: prompt }];
    }
    var body = { messages: messages, maxTokens: opts.maxTokens || 600 };
    if (opts.system) body.system = opts.system;
    var res;
    try {
      res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (e) {
      throw new Error('network: ' + (e && e.message || 'failed'));
    }
    var data = null;
    try { data = await res.json(); } catch(_) {}
    if (!res.ok) throw new Error('ai ' + res.status + (data && data.error ? ': ' + data.error : ''));
    if (data && data.fallback) throw new Error(data.error || 'ai unavailable');
    return (data && typeof data.text === 'string') ? data.text : '';
  }
  window.claude = Object.assign(window.claude || {}, { complete: complete });
})();
