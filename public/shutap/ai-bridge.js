/* Lovable AI bridge — exposes:
     window.claude.complete({system, messages, prompt, maxTokens}) -> Promise<string>
     window.claude.stream({system, messages, prompt, maxTokens, onChunk, signal}) -> Promise<string>
   Both POST /api/complete (Lovable AI Gateway). stream() uses text streaming. */
(function () {
  if (window.claude && typeof window.claude.complete === 'function' && typeof window.claude.stream === 'function') return;

  function buildBody(opts, stream) {
    opts = opts || {};
    var messages = Array.isArray(opts.messages) ? opts.messages : null;
    if (!messages) {
      var prompt = opts.prompt != null ? String(opts.prompt) : '';
      messages = [{ role: 'user', content: prompt }];
    }
    var body = { messages: messages, maxTokens: opts.maxTokens || 600 };
    if (opts.system) body.system = opts.system;
    if (stream) body.stream = true;
    return body;
  }

  async function complete(opts) {
    var res;
    try {
      res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildBody(opts, false)),
        signal: opts && opts.signal,
      });
    } catch (e) {
      throw new Error('network: ' + ((e && e.message) || 'failed'));
    }
    var data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error('ai ' + res.status + (data && data.error ? ': ' + data.error : ''));
    if (data && data.fallback) throw new Error(data.error || 'ai unavailable');
    return (data && typeof data.text === 'string') ? data.text : '';
  }

  async function stream(opts) {
    opts = opts || {};
    var onChunk = typeof opts.onChunk === 'function' ? opts.onChunk : null;
    var res;
    try {
      res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildBody(opts, true)),
        signal: opts.signal,
      });
    } catch (e) {
      throw new Error('network: ' + ((e && e.message) || 'failed'));
    }
    if (!res.ok) {
      var errText = '';
      try { errText = await res.text(); } catch (_) {}
      throw new Error('ai ' + res.status + (errText ? ': ' + errText.slice(0, 200) : ''));
    }
    var ct = (res.headers.get('content-type') || '').toLowerCase();
    // If server fell back to JSON (no streaming), handle that gracefully
    if (ct.indexOf('application/json') !== -1) {
      var data = await res.json();
      if (data && data.fallback) throw new Error(data.error || 'ai unavailable');
      var text = (data && typeof data.text === 'string') ? data.text : '';
      if (text && onChunk) onChunk(text, text);
      return text;
    }
    if (!res.body || !res.body.getReader) {
      var full = await res.text();
      if (full && onChunk) onChunk(full, full);
      return full;
    }
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var acc = '';
    while (true) {
      var step = await reader.read();
      if (step.done) break;
      var chunk = decoder.decode(step.value, { stream: true });
      if (!chunk) continue;
      acc += chunk;
      if (onChunk) {
        try { onChunk(chunk, acc); } catch (_) {}
      }
    }
    var tail = decoder.decode();
    if (tail) {
      acc += tail;
      if (onChunk) { try { onChunk(tail, acc); } catch (_) {} }
    }
    return acc;
  }

  window.claude = Object.assign(window.claude || {}, { complete: complete, stream: stream });
})();
