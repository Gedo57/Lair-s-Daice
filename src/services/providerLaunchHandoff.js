/** P110 Liar's Dice Provider launch: strict fail-closed browser boundary.
 * Only a 45-second P99 server-issued ticket may identify a synthetic QA player.
 */
export function isProviderHandoffFragment(fragment=''){
 const value=String(fragment||'').replace(/^#/,'');
 return /(?:^|&)(?:provider_launch_token|provider_launch_id)=/.test(value);
}
export function consumeProviderHandoff(win){
 const raw=String(win?.location?.hash||'').replace(/^#/,'');
 if(!isProviderHandoffFragment(raw))return null;
 // Strip the bearer-style ticket from browser history, even when invalid or duplicated.
 try{win.history?.replaceState?.(win.history.state,'',
   String(win.location.pathname||'/')+String(win.location.search||''));}catch{}
 const p=new URLSearchParams(raw);
 const launchToken=p.get('provider_launch_token')||'',launchId=p.get('provider_launch_id')||'';
 const good=[...p.keys()].length===2 &&
  p.getAll('provider_launch_token').length===1 &&
  p.getAll('provider_launch_id').length===1 &&
  /^[A-Za-z0-9_-]{43}$/.test(launchToken) &&
  /^[A-Za-z0-9_.:-]{8,128}$/.test(launchId);
 if(!good){
  const e=Error('Invalid Game Provider launch. Return to G Provider for a new ticket.');
  e.code='PROVIDER_LAUNCH_INVALID';throw e;
 }
 return {launchToken,exchangeId:win.crypto?.randomUUID?.()||
  'liars-'+Date.now()+'-'+Math.random().toString(16).slice(2)};
}
