import test from 'node:test';
import assert from 'node:assert/strict';
import {consumeProviderHandoff,isProviderHandoffFragment} from '../src/services/providerLaunchHandoff.js';
const tok='T'.repeat(43),id='p110-launch-000001';
const mk=fragment=>{
 let stripped=false;
 const win={location:{hash:fragment,pathname:'/',search:''},
  history:{state:null,replaceState(_state,_unused,href){stripped=true;win.location.hash='';assert.equal(href,'/');}},
  crypto:{randomUUID:()=> '11111111-2222-4333-8444-555555555555'}};
 return {win,wasStripped:()=>stripped};
};
test('valid one-use Provider handoff requires exact two params and strips secret from URL',()=>{
 const x=mk('#provider_launch_token='+tok+'&provider_launch_id='+id);
 const a=consumeProviderHandoff(x.win);
 assert.equal(a.launchToken,tok);assert.ok(x.wasStripped());
 assert.equal(a.exchangeId,'11111111-2222-4333-8444-555555555555');
});
test('malformed, duplicate, mixed and incomplete Provider fragments never authorize Demo fallback',()=>{
 const bad=[
 '#provider_launch_token=bad&provider_launch_id='+id,
 '#provider_launch_token='+tok,
 '#provider_launch_id='+id,
 '#provider_launch_token='+tok+'&provider_launch_id=x',
 '#provider_launch_token='+tok+'&provider_launch_token='+tok+'&provider_launch_id='+id,
 '#provider_launch_token='+tok+'&provider_launch_id='+id+'&provider_launch_id='+id,
 '#platform_launch_token='+tok+'&provider_launch_id='+id,
 '#provider_launch_token='+tok+'&provider_launch_id='+id+'&local=1'
 ];
 for(const b of bad){
  assert.equal(isProviderHandoffFragment(b),true);
  const x=mk(b);
  assert.throws(()=>consumeProviderHandoff(x.win),{code:'PROVIDER_LAUNCH_INVALID'});
  assert.ok(x.wasStripped(),'strip invalid bearer token');
 }
});
test('normal Demo visit without Provider fragments stays untouched',()=>{
 const x=mk('');
 assert.equal(isProviderHandoffFragment(''),false);
 assert.equal(consumeProviderHandoff(x.win),null);
 assert.equal(x.wasStripped(),false);
});
