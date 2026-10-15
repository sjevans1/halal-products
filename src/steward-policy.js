/** Stewardship is listing-specific permission to propose corrections, never verification. */
export const validEmail = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value === value.trim() && value === value.toLowerCase();
export const validSource = value => {
  if(typeof value !== 'string' || value.length < 12 || value.length > 700) return false;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && u.hostname.includes('.') && !(/(^localhost$|\.local$|\.internal$)/i.test(u.hostname)) && !/^(\d+\.){3}\d+$/.test(u.hostname) && !u.hostname.includes(':'); }
  catch {return false;}
};
export const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value;
export const grantReviewers = (env,email) => (env.HUB_STEWARD_GRANT_REVIEWERS || '').split(',').map(v=>v.trim().toLowerCase()).includes(email) && !!email;
export const validGrant = (d,listingIds,reviewer) => {
  if(!d || typeof d !== 'object' || Array.isArray(d)) return 'Invalid grant request';
  if(!listingIds.has(d.listingId)) return 'Choose an existing published listing';
  if(!validEmail(d.email) || d.email === reviewer) return 'A different verified organization contact is required';
  if(!validSource(d.sourceUrl)) return 'A public HTTPS authorization source is required';
  if(!validDay(d.expiresAt)) return 'Choose a valid expiry date';
  const now = new Date().toISOString().slice(0,10);
  const deadline = new Date();deadline.setUTCFullYear(deadline.getUTCFullYear()+1);
  if(d.expiresAt <= now || d.expiresAt > deadline.toISOString().slice(0,10)) return 'Use a future expiry within one year';
  if(typeof d.note !== 'string' || d.note.trim().length<40 || d.note.length>800) return 'Record at least 40 characters of independent authorization evidence';
  return null;
};
export const validProposal = d => {
  if(!d || typeof d !== 'object' || Array.isArray(d)) return 'Invalid proposal';
  if(!Number.isSafeInteger(d.grantId) || d.grantId < 1) return 'Choose an assigned listing';
  if(!validSource(d.sourceUrl)) return 'Provide a public HTTPS source';
  if(typeof d.note !== 'string' || d.note.trim().length < 30 || d.note.length > 1000) return 'Explain the proposed correction in at least 30 characters';
  return null;
};
