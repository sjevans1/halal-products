export const onRequestGet=({env})=>{
  const enabled=env.HUB_SUBMISSIONS_ACTIVE==='true'&&!!env.WAITLIST_DB&&!!env.TURNSTILE_SITE_KEY&&!!env.TURNSTILE_SECRET;
  return Response.json({enabled,turnstileSiteKey:enabled?env.TURNSTILE_SITE_KEY:null},{headers:{'cache-control':'no-store'}});
};
export const onRequestPost=()=>new Response('Method Not Allowed',{status:405,headers:{Allow:'GET'}});
