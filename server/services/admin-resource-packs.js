import {RESOURCE_PACKS} from '../../src/lib/resourcePacks.js';
export async function fulfillAdminResourcePack({orderId,playerId,txHash,senderAccountId,db,nearPayment,paymentService,receiver,network,flush}) {
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{statusCode:status,code:message})};
 const order=await db.findTransactionById(String(orderId||'').trim());
 if(!order||(playerId&&String(order.user_id)!==String(playerId)))fail('PAYMENT_ORDER_NOT_FOUND',404);
 if(!RESOURCE_PACKS.some(pack=>pack.id===order.item_id)||order.payment_method!=='near')fail('NEAR_PACK_ORDER_REQUIRED');
 if(order.status==='success')return {order,alreadyGranted:true};
 if(order.status!=='pending')fail('PAYMENT_ORDER_NOT_PENDING',409);
 if(!txHash||!senderAccountId)fail('NEAR_PAYMENT_DETAILS_REQUIRED');
 const verified=await nearPayment.verifyNearTransaction({txHash:String(txHash).trim(),senderAccountId:String(senderAccountId).trim(),receiverAccountId:receiver,expectedYoctoAmount:order.nearAmountYocto||order.near_amount_yocto,network});
 if(!verified.confirmed)fail('NEAR_PAYMENT_NOT_CONFIRMED');
 const result=await paymentService.confirmNearPayment({orderId:order.id,txHash:verified.txHash,amount:order.near_amount_locked,recipient:verified.recipient,senderAccountId:verified.senderAccountId,confirmed:true});
 await flush([order.user_id]);return {order:result,alreadyGranted:false};
}
