export async function onRequestGet({env}) {
  const enabled=Boolean(env.WAITLIST_ACTIVE==='true'&&env.WAITLIST_DB&&env.TURNSTILE_SECRET&&env.TURNSTILE_SITE_KEY);
  return Response.json({enabled,turnstileSiteKey:enabled?env.TURNSTILE_SITE_KEY:null},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
