(()=>{
const cfg=window.GMAX_CONFIG||{};
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const fmt=n=>'₦'+Number(n||0).toLocaleString('en-NG');
let client=null, editing=null, cache=[], badgeTimer=null;

const configured=()=>!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY);
const pendingStatuses=['new','delivery_quote_pending','quoted','payment_pending','paid_verified','processing','dispatched'];

function note(t,ok=true){
  const e=$('.toast');
  if(!e)return;
  e.textContent=t;
  e.style.background=ok?'#071b33':'#a52f36';
  e.classList.add('show');
  setTimeout(()=>e.classList.remove('show'),3200);
}

function tab(n){
  $$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===n));
  $$('.panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+n));
  if(n==='orders')loadOrders();
  if(n==='messages')loadMessages();
}

function setBadge(id,count){
  const e=$(id);
  if(!e)return;
  const n=Number(count||0);
  e.textContent=n>99?'99+':String(n);
  e.hidden=n<1;
}

async function refreshBadges(){
  if(!client)return;
  try{
    const [orders,messages]=await Promise.all([
      client.from('orders').select('*',{count:'exact',head:true}).in('status',pendingStatuses),
      client.from('contact_messages').select('*',{count:'exact',head:true}).eq('status','new')
    ]);
    if(!orders.error)setBadge('#orders-badge',orders.count);
    if(!messages.error)setBadge('#messages-badge',messages.count);
  }catch(e){
    console.warn('Badge refresh failed',e);
  }
}

function productImages(p){
  let list=[];
  if(Array.isArray(p?.image_urls))list=p.image_urls.filter(Boolean);
  if(!list.length&&p?.image_url)list=[p.image_url];
  return list.slice(0,4);
}

function productColors(p){
  let list=p?.colors;
  if(Array.isArray(list))return list.map(x=>String(x).trim()).filter(Boolean);
  if(typeof list==='string'){
    try{
      const parsed=JSON.parse(list);
      if(Array.isArray(parsed))return parsed.map(x=>String(x).trim()).filter(Boolean);
    }catch{}
    return list.split(',').map(x=>x.trim()).filter(Boolean);
  }
  return [];
}

function showExistingImages(urls){
  const box=$('#existing-images-preview');
  if(!box)return;
  if(!urls.length){
    box.innerHTML='<small style="color:#94a3b8">No photographs saved yet.</small>';
    return;
  }
  box.innerHTML=urls.map((u,i)=>`
    <div class="admin-preview-item">
      <img src="${u}" alt="Saved product image ${i+1}">
      <span>Photo ${i+1}</span>
    </div>`).join('');
}

async function init(){
  if(!configured()){
    $('#setup').style.display='block';
    return;
  }
  client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
  const {data}=await client.auth.getSession();
  if(data.session)show();
  else $('#login').style.display='block';
}

$('#login-form').onsubmit=async e=>{
  e.preventDefault();
  const f=new FormData(e.target);
  const {data,error}=await client.auth.signInWithPassword({
    email:f.get('email'),
    password:f.get('password')
  });
  if(error){
    $('#login-msg').innerHTML='<div class="notice bad">'+error.message+'</div>';
    return;
  }
  const {data:a,error:adminErr}=await client.from('admin_users').select('user_id').eq('user_id',data.user.id).maybeSingle();
  if(adminErr){
    $('#login-msg').innerHTML='<div class="notice bad">'+adminErr.message+'</div>';
    return;
  }
  if(!a){
    await client.auth.signOut();
    $('#login-msg').innerHTML='<div class="notice bad">This account is not registered as a GMAX administrator.</div>';
    return;
  }
  show();
};

async function show(){
  $('#login').style.display='none';
  $('#dash').style.display='grid';
  await Promise.all([loadProducts(),loadOrders(),loadMessages(),refreshBadges()]);
  clearInterval(badgeTimer);
  badgeTimer=setInterval(refreshBadges,60000);
}

$$('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));

$('#new-product').onclick=()=>{
  editing=null;
  const f=$('#product-form');
  f.reset();
  f.elements.existing_images.value='[]';
  showExistingImages([]);
  tab('form');
};

$('#logout').onclick=async()=>{
  clearInterval(badgeTimer);
  if(client)await client.auth.signOut();
  location.reload();
};

async function loadProducts(){
  const {data,error}=await client.from('products').select('*').order('created_at',{ascending:false});
  if(error)return note(error.message,false);
  cache=data||[];
  $('#products-body').innerHTML=cache.map(p=>{
    const imgs=productImages(p);
    const colors=productColors(p);
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          ${imgs[0]?`<img src="${imgs[0]}" alt="" style="width:46px;height:46px;border-radius:9px;object-fit:cover">`:''}
          <div>
            <b>${p.name}</b><br>
            <small>${p.category||''} · ${imgs.length} photo${imgs.length===1?'':'s'}${colors.length?' · '+colors.join(', '):''}</small>
          </div>
        </div>
      </td>
      <td>${fmt(p.price)}</td>
      <td>${p.in_stock?'In stock':'Out'}</td>
      <td>
        <button class="mini edit" data-edit="${p.id}">Edit</button>
        <button class="mini delete" data-del="${p.id}">Delete</button>
      </td>
    </tr>`;
  }).join('');
  $$('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));
  $$('[data-del]').forEach(b=>b.onclick=()=>del(b.dataset.del));
}

function edit(id){
  const p=cache.find(x=>x.id===id);
  if(!p)return;
  editing=id;
  const f=$('#product-form');
  ['name','category','brand','price','old_price','description','stock_quantity']
    .forEach(k=>f.elements[k].value=p[k]??'');
  f.elements.colors.value=productColors(p).join(', ');
  const imgs=productImages(p);
  f.elements.existing_images.value=JSON.stringify(imgs);
  f.elements.featured.checked=!!p.featured;
  f.elements.in_stock.checked=!!p.in_stock;
  f.elements.specs.value=Object.entries(p.specs||{}).map(([k,v])=>`${k}: ${v}`).join('\n');
  f.elements.images.value='';
  showExistingImages(imgs);
  tab('form');
}

async function del(id){
  if(!confirm('Delete this product?'))return;
  const {error}=await client.from('products').delete().eq('id',id);
  if(error)return note(error.message,false);
  await loadProducts();
  note('Product deleted');
}

$('#product-images-input').addEventListener('change',e=>{
  const files=[...e.target.files];
  if(files.length>4){
    e.target.value='';
    note('Please choose no more than 4 photographs.',false);
    return;
  }
  if(!files.length)return;
  const box=$('#existing-images-preview');
  box.innerHTML=files.map((file,i)=>{
    const url=URL.createObjectURL(file);
    return `<div class="admin-preview-item"><img src="${url}" alt="New image ${i+1}"><span>New photo ${i+1}</span></div>`;
  }).join('');
});

$('#product-form').onsubmit=async e=>{
  e.preventDefault();
  const f=e.target;
  const fd=new FormData(f);
  const newFiles=[...f.elements.images.files];
  if(newFiles.length>4)return note('Please choose no more than 4 photographs.',false);

  let image_urls=[];
  try{
    image_urls=JSON.parse(fd.get('existing_images')||'[]');
    if(!Array.isArray(image_urls))image_urls=[];
  }catch{image_urls=[]}

  if(newFiles.length){
    image_urls=[];
    for(let i=0;i<newFiles.length;i++){
      const file=newFiles[i];
      if(file.size>5*1024*1024)return note(`Photo ${i+1} is too large. Keep each photo below 5 MB.`,false);
      const safe=file.name.replace(/[^a-z0-9._-]/gi,'-');
      const path=`products/${Date.now()}-${i+1}-${safe}`;
      const {error}=await client.storage.from('product-images').upload(path,file,{upsert:false});
      if(error)return note('Image upload failed: '+error.message,false);
      const publicUrl=client.storage.from('product-images').getPublicUrl(path).data.publicUrl;
      image_urls.push(publicUrl);
    }
  }

  image_urls=image_urls.filter(Boolean).slice(0,4);
  const image_url=image_urls[0]||'';

  let specs={};
  String(fd.get('specs')||'').split('\n').filter(Boolean).forEach(line=>{
    const i=line.indexOf(':');
    if(i>0)specs[line.slice(0,i).trim()]=line.slice(i+1).trim();
  });

  const colors=String(fd.get('colors')||'')
    .split(/[,\n]/)
    .map(x=>x.trim())
    .filter(Boolean)
    .filter((x,i,a)=>a.findIndex(y=>y.toLowerCase()===x.toLowerCase())===i);

  const o={
    name:fd.get('name'),
    category:fd.get('category'),
    brand:fd.get('brand'),
    price:Number(fd.get('price')),
    old_price:fd.get('old_price')?Number(fd.get('old_price')):null,
    stock_quantity:Number(fd.get('stock_quantity')||0),
    colors,
    description:fd.get('description'),
    image_url,
    image_urls,
    specs,
    featured:fd.get('featured')==='on',
    in_stock:fd.get('in_stock')==='on',
    active:true
  };

  const r=editing
    ? await client.from('products').update(o).eq('id',editing)
    : await client.from('products').insert(o);

  if(r.error)return note(r.error.message,false);

  editing=null;
  f.reset();
  f.elements.existing_images.value='[]';
  showExistingImages([]);
  await loadProducts();
  tab('products');
  note('Product saved successfully.');
};

async function loadOrders(){
  const {data,error}=await client.from('orders').select('*').order('created_at',{ascending:false}).limit(100);
  if(error)return note(error.message,false);
  const orders=data||[];
  setBadge('#orders-badge',orders.filter(o=>pendingStatuses.includes(o.status)).length);

  $('#orders-body').innerHTML=orders.map(o=>{
    const subtotal=Number(o.subtotal??o.total??0);
    const fee=o.delivery_fee===null||o.delivery_fee===undefined?'':Number(o.delivery_fee);
    const total=Number(o.total??subtotal);
    const delivery=o.delivery_method==='home_delivery'
      ? `<b>Home Delivery</b><br><small>${o.delivery_address||o.address||''}<br>${o.delivery_city||''}, ${o.delivery_state||''}<br>Landmark: ${o.delivery_landmark||'-'}</small>`
      : '<b>Store Pickup</b>';
    return `<tr>
      <td><b>${o.order_number}</b><br><small>${new Date(o.created_at).toLocaleString()}</small></td>
      <td>${o.customer_name}<br><small>${o.phone}</small></td>
      <td>${delivery}</td>
      <td>${fmt(subtotal)}</td>
      <td>${o.delivery_method==='home_delivery'
        ? `<input class="quote-input" type="number" min="0" data-fee="${o.id}" value="${fee}" placeholder="Courier fee">`
        : '₦0'}</td>
      <td><b>${fmt(total)}</b></td>
      <td>
        <select class="order-status-select" data-status="${o.id}">
          ${['new','delivery_quote_pending','quoted','payment_pending','paid_verified','processing','dispatched','completed','cancelled']
            .map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s.replaceAll('_',' ')}</option>`).join('')}
        </select>
      </td>
      <td>
        ${o.delivery_method==='home_delivery'?`<button class="mini edit" data-save-quote="${o.id}">Save quote</button>`:''}
        <button class="mini edit" data-wa-order="${o.id}">WhatsApp</button>
      </td>
    </tr>`;
  }).join('');

  $$('[data-save-quote]').forEach(b=>b.onclick=()=>saveQuote(b.dataset.saveQuote,orders));
  $$('[data-status]').forEach(s=>s.onchange=()=>saveStatus(s.dataset.status,s.value));
  $$('[data-wa-order]').forEach(b=>b.onclick=()=>whatsAppOrder(b.dataset.waOrder,orders));
}

async function saveQuote(id,orders){
  const o=orders.find(x=>x.id===id);
  if(!o)return;
  const input=document.querySelector(`[data-fee="${id}"]`);
  const fee=Number(input?.value);
  if(!Number.isFinite(fee)||fee<0)return note('Enter a valid courier fee.',false);
  const subtotal=Number(o.subtotal??o.total??0);
  const total=subtotal+fee;
  const {error}=await client.from('orders').update({
    delivery_fee:fee,total,delivery_status:'quoted',status:'quoted'
  }).eq('id',id);
  if(error)return note(error.message,false);
  note('Courier quote saved. Final total: '+fmt(total));
  await loadOrders();
  refreshBadges();
}

async function saveStatus(id,status){
  const patch={status};
  if(status==='paid_verified')patch.payment_status='verified';
  const {error}=await client.from('orders').update(patch).eq('id',id);
  if(error)return note(error.message,false);
  note('Order status updated.');
  await loadOrders();
  refreshBadges();
}

function whatsAppOrder(id,orders){
  const o=orders.find(x=>x.id===id);
  if(!o)return;
  let phone=String(o.phone||'').replace(/\D/g,'');
  if(phone.startsWith('0')&&phone.length===11)phone='234'+phone.slice(1);
  if(!phone)return note('This order has no usable phone number.',false);
  const subtotal=Number(o.subtotal??o.total??0);
  const fee=Number(o.delivery_fee||0);
  const total=Number(o.total??subtotal+fee);
  const delivery=o.delivery_method==='home_delivery'
    ? `Home Delivery\nCourier fee: ${o.delivery_fee==null?'Awaiting quote':fmt(fee)}`
    : 'Store Pickup\nDelivery fee: ₦0';
  const text=`Hello ${o.customer_name||''}, this is GMAX Technology.\n\nOrder: ${o.order_number}\nSubtotal: ${fmt(subtotal)}\n${delivery}\nFinal amount: ${fmt(total)}\n\n${o.delivery_method==='home_delivery'&&o.delivery_fee==null?'We are still obtaining your courier quotation. Please do not pay yet.':'If you have not paid yet, please pay only this confirmed amount. After payment, use the Payment Receipt section on our website.'}`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,'_blank');
}

async function loadMessages(){
  const {data,error}=await client.from('contact_messages').select('*').order('created_at',{ascending:false}).limit(100);
  if(error)return note(error.message,false);
  const messages=data||[];
  setBadge('#messages-badge',messages.filter(m=>(m.status||'new')==='new').length);

  $('#messages-body').innerHTML=messages.map(m=>{
    const status=m.status||'new';
    return `<tr>
      <td>${m.name}<br><small>${m.email}</small></td>
      <td><b>${m.subject||''}</b><br>${m.message}</td>
      <td>${new Date(m.created_at).toLocaleString()}</td>
      <td><span class="status-pill ${status==='new'?'status-new':'status-done'}">${status==='new'?'New':'Attended'}</span></td>
      <td>${status==='new'?`<button class="mini edit" data-attend-message="${m.id}">Mark attended</button>`:'—'}</td>
    </tr>`;
  }).join('');

  $$('[data-attend-message]').forEach(b=>b.onclick=()=>markMessageAttended(b.dataset.attendMessage));
}

async function markMessageAttended(id){
  const {error}=await client.from('contact_messages').update({status:'attended'}).eq('id',id);
  if(error)return note(error.message,false);
  note('Message marked as attended.');
  await loadMessages();
  refreshBadges();
}

document.addEventListener('DOMContentLoaded',init);
})();