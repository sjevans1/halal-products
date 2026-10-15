/** Community contribution journey. A browser submission never confers stewardship or certification. */
(() => {
  'use strict';
  const form = document.querySelector('#steward-form');
  const data = window.TAYYIB_HUB;
  if (!form || !data?.listings) return;
  const $ = selector => document.querySelector(selector);
  const choices = [...form.querySelectorAll('input[name="intent"]')];
  const title = $('#steward-title');
  const source = $('#steward-source');
  const note = $('#steward-note');
  const context = $('#steward-context');
  const submit = $('#steward-submit');
  const status = $('#steward-status');
  const understood = $('#steward-understand');
  const params = new URLSearchParams(location.search);
  const options = ['correction','listing','event','representative'];
  const requestedIntent = params.get('intent');
  const chosenIntent = options.includes(requestedIntent) ? requestedIntent : 'correction';
  const listingId = params.get('record');
  const record = data.listings.find(item => item.id === listingId);
  let active = false, challengeToken = null, widgetId = null, inFlight = false;
  const setStatus = (message, state = '') => {
    status.textContent = message;
    status.className = `hub-form-status ${state}`;
  };
  const getIntent = () => choices.find(x => x.checked)?.value || 'correction';
  function canSubmit() { return active && !!challengeToken && !inFlight; }
  function syncButton() { submit.disabled = !canSubmit(); }
  function updateChoice() {
    const intent = getIntent();
    choices.forEach(c => c.closest('label').classList.toggle('selected', c.checked));
    if (record && intent === 'correction') {
      context.hidden = false;
      context.replaceChildren();
      const b = document.createElement('strong');b.textContent = `Updating: ${record.name}`;
      const p = document.createElement('p');p.textContent = `Current directory source: ${record.sourceLabel}. If you have a newer official source, replace the link below.`;
      context.append(b,p);
    } else {
      context.hidden = true;
      context.replaceChildren();
    }
    const labels = {
      correction: 'Describe which published detail needs updating.',
      listing: 'Which place or service should the community be able to find?',
      event: 'Use the organizer’s public announcement with its date and location.',
      representative: 'Explain what official public information your organization wants checked. Identity is NOT verified through this form.'
    };
    note.placeholder = labels[intent];
  }
  choices.find(x => x.value === chosenIntent).checked = true;
  if (record) {
    title.value = record.name;
    source.value = record.sourceUrl;
  }
  choices.forEach(c => c.addEventListener('change', updateChoice));
  updateChoice();

  async function setup() {
    try {
      const response = await fetch('/api/hub-config', {cache:'no-store'});
      if (!response.ok) return;
      const config = await response.json();
      if (config.enabled !== true || typeof config.turnstileSiteKey !== 'string' || !config.turnstileSiteKey) return;
      const renderChallenge=()=>{
        if (!window.turnstile) {setStatus('Security verification is unavailable. Try again later.','error');return;}
        try {
          widgetId = window.turnstile.render('#steward-turnstile', {
            sitekey: config.turnstileSiteKey,
            callback: t => {challengeToken = t; syncButton();setStatus('Ready for review. Check your source and details before sending.');},
            'expired-callback': () => {challengeToken = null;syncButton();setStatus('Security check expired. Complete it again.','error');},
            'error-callback': () => {challengeToken = null;syncButton();setStatus('Security verification failed. Please try again.','error');}
          });
          active = true;
          syncButton();
          setStatus('Complete the security check, then send your information for review.');
        } catch {setStatus('Security verification is unavailable. Try again later.','error');}
      };
      if(window.turnstile)renderChallenge();
      else {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.onload = renderChallenge;
        script.onerror = () => setStatus('Security verification could not load.','error');
        document.head.append(script);
      }
    } catch {setStatus('Submissions are unavailable. You can still read how contributions work.');}
  }
  setup();

  function validate() {
    if (!understood.checked) return 'Please acknowledge the independent review process.';
    if (title.value.trim().length < 3 || title.value.trim().length > 120) return 'Enter the name as shown by your source (3–120 characters).';
    try {
      const u = new URL(source.value.trim());
      if (u.protocol !== 'https:' || !u.hostname.includes('.') || u.username || u.password || u.port || source.value.trim().length > 700) throw Error();
    } catch {return 'Add a valid public HTTPS source link.';}
    if (!note.value.trim()) return 'Please explain what the community should know or correct.';
    return null;
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!canSubmit()) {setStatus('Complete the security check first.','error');return;}
    const error = validate();
    if (error) {setStatus(error,'error');return;}
    const intent = getIntent();
    const prefix = intent === 'representative'
      ? 'Representative suggestion (identity not verified). '
      : record && intent === 'correction' ? `Existing listing ID: ${record.id}. ` : '';
    const payload = {
      type: intent === 'listing' ? 'listing' : intent === 'event' ? 'event' : 'correction',
      title: title.value.trim(), sourceUrl: source.value.trim(),
      note: `${prefix}${note.value.trim()}`,
      website: form.elements.website.value,turnstileToken:challengeToken
    };
    if (payload.note.length > 1000) {setStatus('Shorten the explanation to fit within 1,000 characters.','error');return;}
    inFlight = true;syncButton();setStatus('Sending your suggestion securely…');
    try {
      const response = await fetch('/api/hub-suggest', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) throw Error(result?.error || 'Submission unavailable. Please try again later.');
      form.reset();
      choices.find(x => x.value === chosenIntent).checked = true;
      if (record) {title.value=record.name;source.value=record.sourceUrl;}
      updateChoice();
      setStatus('Your suggestion was received for human review. It has not been published, verified or approved.','success');
    } catch (err) {setStatus(err.message || 'Unable to submit. Please try again.','error');}
    finally {
      challengeToken = null;
      inFlight = false;
      if (window.turnstile && widgetId != null) window.turnstile.reset(widgetId);
      syncButton();
    }
  });
})();
