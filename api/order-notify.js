const GRAPH_VERSION=process.env.WHATSAPP_GRAPH_VERSION||'v26.0';

function json(res,status,body){
  res.status(status).setHeader('Content-Type','application/json');
  res.end(JSON.stringify(body));
}

function normalizePhone(value){
  let p=String(value||'').replace(/\D/g,'');
  if(p.startsWith('0')&&p.length===11)p='234'+p.slice(1);
  return p;
}

async function getOrder(orderNumber){
  const url=process.env.SUPABASE_URL;
  const secretKey=process.env.SUPABASE_SECRET_KEY;
  if(!url||!secretKey)throw new Error('Server order verification is not configured.');

  const query=new URLSearchParams({
    select:'id,order_number,customer_name,phone,items,subtotal,total,delivery_method,delivery_state,delivery_city,delivery_address,status,admin_notified_at',
    order_number:`eq.${orderNumber}`,
    limit:'1'
  });

  const r=await fetch(`${url}/rest/v1/orders?${query}`,{
    headers:{apikey:secretKey}
  });
  if(!r.ok)throw new Error('Could not verify the new order.');
  const rows=await r.json();
  const order=rows?.[0];
  if(!order)throw new Error('Order was not found.');
  return order;
}

function orderText(o){
  const items=Array.isArray(o.items)?o.items:[];
  const lines=items.slice(0,8).map(i=>`• ${i.name}${i.color?` (${i.color})`:''} × ${i.qty}`).join('\n');
  const delivery=o.delivery_method==='home_delivery'
    ? `Home Delivery — ${o.delivery_city||''}, ${o.delivery_state||''}`
    : 'Store Pickup';
  return `NEW GMAX ORDER\n\nOrder: ${o.order_number}\nCustomer: ${o.customer_name}\nPhone: ${o.phone}\n${delivery}\nTotal now: ₦${Number(o.total||o.subtotal||0).toLocaleString('en-NG')}\n\n${lines}\n\nOpen GMAX Admin → Orders to attend to it.`;
}

async function sendFreeText(to,text){
  const token=process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId=process.env.WHATSAPP_PHONE_NUMBER_ID;
  if(!token||!phoneNumberId)throw new Error('WhatsApp Cloud API is not configured.');

  const r=await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,{
    method:'POST',
    headers:{
      Authorization:`Bearer ${token}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      messaging_product:'whatsapp',
      to,
      type:'text',
      text:{body:text}
    })
  });

  const data=await r.json();
  if(!r.ok){
    console.error('WhatsApp order notification error',data);
    throw new Error('WhatsApp rejected the order notification.');
  }
}

async function sendTemplate(to,o){
  const token=process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId=process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName=process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
  const language=process.env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE||'en';
  if(!token||!phoneNumberId||!templateName)throw new Error('WhatsApp template is not configured.');

  const r=await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,{
    method:'POST',
    headers:{
      Authorization:`Bearer ${token}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      messaging_product:'whatsapp',
      to,
      type:'template',
      template:{
        name:templateName,
        language:{code:language},
        components:[{
          type:'body',
          parameters:[
            {type:'text',text:String(o.order_number)},
            {type:'text',text:String(o.customer_name||'-')},
            {type:'text',text:String(o.phone||'-')},
            {type:'text',text:`₦${Number(o.total||o.subtotal||0).toLocaleString('en-NG')}`}
          ]
        }]
      }
    })
  });

  const data=await r.json();
  if(!r.ok){
    console.error('WhatsApp template order notification error',data);
    throw new Error('WhatsApp rejected the order alert template.');
  }
}

async function markNotified(orderId){
  const url=process.env.SUPABASE_URL;
  const secretKey=process.env.SUPABASE_SECRET_KEY;
  if(!url||!secretKey)return;

  await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,{
    method:'PATCH',
    headers:{
      apikey:secretKey,
      'Content-Type':'application/json',
      Prefer:'return=minimal'
    },
    body:JSON.stringify({admin_notified_at:new Date().toISOString()})
  }).catch(()=>{});
}

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Method not allowed.'});

  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const orderNumber=String(body.orderNumber||'').trim();
    if(!orderNumber)return json(res,400,{error:'Order number is required.'});

    const order=await getOrder(orderNumber);
    if(order.admin_notified_at)return json(res,200,{ok:true,alreadySent:true});

    const receiver=normalizePhone(process.env.WHATSAPP_RECEIVER_NUMBER);
    if(!receiver)throw new Error('Admin receiving WhatsApp number is not configured.');

    if(process.env.WHATSAPP_ORDER_TEMPLATE_NAME){
      await sendTemplate(receiver,order);
    }else{
      await sendFreeText(receiver,orderText(order));
    }

    await markNotified(order.id);
    return json(res,200,{ok:true});
  }catch(err){
    console.error(err);
    return json(res,503,{error:err.message||'Admin notification could not be sent.'});
  }
}
