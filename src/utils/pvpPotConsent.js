/** Authoritative pot-fee quote for all-human sandbox Provider matches. */
export function consentMessage(quote,{buyIn=null,playerCount=null}={}){
 if(quote?.applicable!==true)return null;
 const t=quote.rtpConsent;
 if(!t||!Number.isSafeInteger(t.targetRtpBps)||t.targetRtpBps<100||t.targetRtpBps>9900||
   !Number.isSafeInteger(t.revision)||t.revision<0||quote.feeBps!==10000-t.targetRtpBps)
  throw new Error('Unable to verify the Provider PvP pot fee. Entry cancelled.');
 const fee=(quote.feeBps/100).toFixed(2);
 const gross=Number.isSafeInteger(buyIn)&&buyIn>0&&Number.isSafeInteger(playerCount)&&
   playerCount>=2&&playerCount<=4?buyIn*playerCount:null;
 const validPot=gross!==null&&Number.isSafeInteger(gross);
 const exact=validPot?('\nTotal pot: '+gross+' coins\nPot fee: '+Math.floor(gross*quote.feeBps/10000)+' coins\nWinner pool: '+(gross-Math.floor(gross*quote.feeBps/10000))+' coins'):'';
 return 'All-human Provider PvP pot fee: '+fee+'% of the gross pot.\n'+
   'Target aggregate pot return: '+(t.targetRtpBps/100).toFixed(2)+'%'+exact+'\n'+
   'Individual player win probability / RTP is NOT guaranteed.\n'+
   'The fee is frozen before coins are deducted.\n'+
   'Accept this pot fee and continue?';
}
export function acceptPvpTerms(quote,context={},confirmFn){
 const message=consentMessage(quote,context);
 if(message===null)return null;
 if(typeof confirmFn!=='function'||confirmFn(message)!==true)
  throw new Error('Match entry cancelled: pot fee not accepted.');
 return Object.freeze({targetRtpBps:quote.rtpConsent.targetRtpBps,revision:quote.rtpConsent.revision});
}
