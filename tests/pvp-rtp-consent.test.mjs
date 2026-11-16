import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {consentMessage,acceptPvpTerms} from '../src/utils/pvpPotConsent.js';
const quote={applicable:true,rtpConsent:{targetRtpBps:9500,revision:2},feeBps:500};
test('player sees true 5% pot deduction before accepting a Provider match',()=>{
 const text=consentMessage(quote,{buyIn:100,playerCount:2});
 assert.match(text,/5\.00%/);
 assert.match(text,/Total pot: 200 coins/);
 assert.match(text,/Pot fee: 10 coins/);
 assert.match(text,/Winner pool: 190 coins/);
 assert.match(text,/Individual player win probability \/ RTP is NOT guaranteed/);
});
test('declined/invalid fee quote never permits match entry',()=>{
 assert.deepEqual(acceptPvpTerms(quote,{},()=>true),{targetRtpBps:9500,revision:2});
 assert.throws(()=>acceptPvpTerms(quote,{},()=>false),/not accepted/);
 assert.throws(()=>acceptPvpTerms({...quote,feeBps:300},{},()=>true),/Unable to verify/);
 assert.equal(acceptPvpTerms({applicable:false},{},()=>{throw Error('no confirm')}),null);
});
test('private room, public table queue and room join all transmit accepted fee terms',()=>{
 const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
 const bridge=readFileSync(new URL('../src/services/backendBridge.js',import.meta.url),'utf8');
 const api=readFileSync(new URL('../src/api/roomsApi.js',import.meta.url),'utf8');
 assert.match(bridge,/getPvpTerms: \(\) => roomsApi.getPvpTerms/);
 assert.match(app,/reviewPvpFee/);
 assert.match(app,/backendBridge\.createRoom\(\{\.\.\.roomSettings,rtpConsent\}\)/);
 assert.match(app,/startSocketMatchmaking\(\{\.\.\.selectedTable,rtpConsent\}/);
 assert.match(app,/backendBridge\.joinRoom\(\{\.\.\.r,rtpConsent\}\)/);
 assert.match(api,/rtpConsent:room\.rtpConsent/);
});
