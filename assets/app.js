(()=>{
const cfg=window.GMAX_CONFIG||{};
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const fmt=n=>'₦'+Number(n||0).toLocaleString('en-NG');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let products=[],client=null,floatTimer=null;

const configured=()=>!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY);

function toast(t){
  const e=$('.toast');
  if(!e)return;
  e.textContent=t;
  e.classList.add('show');
  setTimeout(()=>e.classList.remove('show'),2200);
}

function imagesFor(p){
  let list=[];
  if(Array.isArray(p?.image_urls))list=p.image_urls.filter(Boolean);
  if(!list.length&&p?.image_url)list=[p.image_url];
  return list.slice(0,4);
}

function colorsFor(p){
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

function art(p){
  const imgs=imagesFor(p);
  return imgs[0]
    ? `<img src="${esc(imgs[0])}" alt="${esc(p.name)}">`
    : `<div class="product-emoji">🔌</div>`;
}

function cartKey(id,color=''){
  return `${id}::${String(color||'').trim().toLowerCase()}`;
}

function cart(){
  try{
    return JSON.parse(localStorage.getItem('gmax_cart')||'[]').map(i=>({
      ...i,
      key:i.key||cartKey(i.id,i.color||'')
    }));
  }catch{return[]}
}

function save(c){
  localStorage.setItem('gmax_cart',JSON.stringify(c));
  updateCartCount();
}

function updateCartCount(){
  const n=cart().reduce((s,i)=>s+Number(i.qty||1),0);
  $$('[data-cart-count]').forEach(e=>e.textContent=n);
}

function card(p){
  return `<article class="product">
    <div class="product-image product-image-clickable" data-product-open="${esc(p.id)}" tabindex="0" role="button" aria-label="View ${esc(p.name)} details">
      ${art(p)}
      ${p.featured?'<span class="badge">Featured</span>':''}
      <span class="badge ${p.in_stock===false?'out':'stock'}">${p.in_stock===false?'Out of stock':'In stock'}</span>
    </div>
    <div class="product-body">
      <div class="product-cat">${esc(p.category||'Products')}</div>
      <button class="product-title-link" data-product-open="${esc(p.id)}">${esc(p.name)}</button>
      <div class="price-row">
        <span class="price">${fmt(p.price)}</span>
        ${p.old_price?`<span class="old">${fmt(p.old_price)}</span>`:''}
      </div>
      <div class="product-actions">
        <button class="add" data-add="${esc(p.id)}">Add to cart</button>
        <button class="view" data-view="${esc(p.id)}" aria-label="View details">⌕</button>
      </div>
    </div>
  </article>`;
}

function renderEmpty(el,message){
  if(el)el.innerHTML=`<div class="empty" style="grid-column:1/-1">${esc(message)}</div>`;
}

async function load(){
  if(!configured()||!window.supabase){
    products=[];
    renderFeatured();renderNewArrivals();setupFilters();renderShop();
    return;
  }
  try{
    client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
    const {data,error}=await client.from('products').select('*').eq('active',true).order('created_at',{ascending:false});
    if(error)throw error;
    products=data||[];
  }catch(e){
    console.warn('Could not load GMAX products:',e);
    products=[];
  }
  renderFeatured();
  renderNewArrivals();
  setupFilters();
  renderShop();
  if(products.length)setTimeout(startFloatingRecommendations,5500);
}

function bindProductEvents(){
  $$('[data-add]').forEach(b=>b.onclick=()=>{
    const p=products.find(x=>String(x.id)===String(b.dataset.add));
    if(!p)return;
    if(colorsFor(p).length)return view(p.id);
    add(p.id,1,'');
  });
  $$('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
  $$('[data-product-open]').forEach(el=>{
    el.onclick=()=>view(el.dataset.productOpen);
    el.onkeydown=e=>{
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        view(el.dataset.productOpen);
      }
    };
  });
}

function add(id,qty=1,color=''){
  const p=products.find(x=>String(x.id)===String(id));
  if(!p||p.in_stock===false)return toast('This item is out of stock.');

  const colors=colorsFor(p);
  if(colors.length&&!color){
    view(id);
    return toast('Choose your preferred colour first.');
  }

  qty=Math.max(1,Math.floor(Number(qty)||1));
  const stock=Number(p.stock_quantity||0);
  if(stock>0)qty=Math.min(qty,stock);

  const c=cart();
  const key=cartKey(p.id,color);
  const found=c.find(x=>x.key===key);

  if(found){
    const proposed=Number(found.qty||1)+qty;
    found.qty=stock>0?Math.min(proposed,stock):proposed;
  }else{
    c.push({
      key,
      id:p.id,
      name:p.name,
      price:Number(p.price),
      category:p.category,
      image_url:imagesFor(p)[0]||p.image_url||'',
      color:color||'',
      stock_quantity:stock,
      qty
    });
  }

  save(c);
  toast(`${qty} item${qty===1?'':'s'} added to cart`);
}

function renderFeatured(){
  const e=$('#featured-products');
  if(!e)return;
  if(!products.length)return renderEmpty(e,'No products have been added yet.');
  let list=products.filter(p=>p.featured&&p.in_stock!==false).slice(0,8);
  if(!list.length)list=products.filter(p=>p.in_stock!==false).slice(0,8);
  e.innerHTML=list.map(card).join('');
  bindProductEvents();
}

function renderNewArrivals(){
  const e=$('#new-arrivals');
  if(!e)return;
  if(!products.length)return renderEmpty(e,'New products will appear here after they are added from Admin.');
  e.innerHTML=products.slice(0,8).map(card).join('');
  bindProductEvents();
}

function setupFilters(){
  const cat=$('#filter-category'),brand=$('#filter-brand');
  if(!cat||!brand)return;
  cat.innerHTML='<option value="">All categories</option>';
  brand.innerHTML='<option value="">All brands</option>';
  [...new Set(products.map(p=>p.category).filter(Boolean))].sort()
    .forEach(v=>cat.insertAdjacentHTML('beforeend',`<option>${esc(v)}</option>`));
  [...new Set(products.map(p=>p.brand).filter(Boolean))].sort()
    .forEach(v=>brand.insertAdjacentHTML('beforeend',`<option>${esc(v)}</option>`));
  ['#shop-search','#filter-category','#filter-brand','#filter-sort'].forEach(s=>{
    const el=$(s);
    if(el)el.addEventListener(s==='#shop-search'?'input':'change',renderShop);
  });
}

function renderShop(){
  const shop=$('#shop-products');
  if(!shop)return;
  let list=[...products];
  const q=($('#shop-search')?.value||'').toLowerCase().trim();
  const c=$('#filter-category')?.value||'';
  const b=$('#filter-brand')?.value||'';
  const s=$('#filter-sort')?.value||'';
  if(q)list=list.filter(p=>`${p.name} ${p.category} ${p.brand||''} ${colorsFor(p).join(' ')}`.toLowerCase().includes(q));
  if(c)list=list.filter(p=>p.category===c);
  if(b)list=list.filter(p=>p.brand===b);
  if(s==='low')list.sort((a,b)=>Number(a.price)-Number(b.price));
  if(s==='high')list.sort((a,b)=>Number(b.price)-Number(a.price));
  const r=$('#result-count');
  if(r)r.textContent=`${list.length} product${list.length===1?'':'s'}`;
  shop.innerHTML=list.length?list.map(card).join(''):'<div class="empty">No products are available here yet.</div>';
  bindProductEvents();
}

function view(id){
  const p=products.find(x=>String(x.id)===String(id));
  if(!p)return;

  let specs=p.specs||{};
  if(typeof specs==='string'){
    try{specs=JSON.parse(specs)}catch{specs={}}
  }

  const imgs=imagesFor(p);
  const colors=colorsFor(p);
  const stock=Math.max(0,Number(p.stock_quantity||0));
  const maxQty=stock>0?stock:99;

  const gallery=imgs.length
    ? `<div class="product-gallery">
         <div class="gallery-main">
           <img id="gallery-main-image" src="${esc(imgs[0])}" alt="${esc(p.name)}">
         </div>
         ${imgs.length>1?`
           <div class="gallery-thumbs">
             ${imgs.map((u,i)=>`
               <button class="gallery-thumb ${i===0?'active':''}" data-gallery-src="${esc(u)}" aria-label="View product photo ${i+1}">
                 <img src="${esc(u)}" alt="${esc(p.name)} photo ${i+1}">
               </button>`).join('')}
           </div>`:''}
       </div>`
    : `<div class="product-image" style="height:260px;border-radius:16px"><div class="product-emoji">🔌</div></div>`;

  const colorField=colors.length
    ? `<div class="detail-option">
         <label for="detail-color">Choose colour</label>
         <select id="detail-color">
           ${colors.length>1?'<option value="">Select a colour</option>':''}
           ${colors.map((c,i)=>`<option value="${esc(c)}" ${colors.length===1&&i===0?'selected':''}>${esc(c)}</option>`).join('')}
         </select>
       </div>`
    : '';

  $('#product-modal-content').innerHTML=`
    ${gallery}
    <div class="product-cat" style="margin-top:18px">${esc(p.category)}</div>
    <h2 style="color:var(--navy);margin:6px 0">${esc(p.name)}</h2>
    <div class="price-row">
      <span class="price">${fmt(p.price)}</span>
      ${p.old_price?`<span class="old">${fmt(p.old_price)}</span>`:''}
    </div>
    <div class="detail-stock">${p.in_stock===false?'Out of stock':stock>0?`${stock} available`:'In stock'}</div>
    <p style="color:var(--muted);line-height:1.7">${esc(p.description||'')}</p>
    <div class="specs">
      ${Object.entries(specs).map(([k,v])=>`<div class="spec"><small>${esc(k)}</small><strong>${esc(v)}</strong></div>`).join('')}
    </div>

    <div class="detail-purchase">
      ${colorField}
      <div class="detail-option">
        <label>Quantity</label>
        <div class="detail-qty">
          <button type="button" id="detail-qty-minus">−</button>
          <input id="detail-qty-input" type="number" min="1" max="${maxQty}" value="1">
          <button type="button" id="detail-qty-plus">+</button>
        </div>
      </div>
    </div>

    <div class="detail-actions">
      <button class="btn btn-primary" id="modal-add" ${p.in_stock===false?'disabled':''}>Add to cart</button>
      <button class="btn btn-yellow" id="modal-buy-now" ${p.in_stock===false?'disabled':''}>Buy now</button>
    </div>`;

  $$('.gallery-thumb',$('#product-modal-content')).forEach(btn=>{
    btn.onclick=()=>{
      const main=$('#gallery-main-image');
      if(main)main.src=btn.dataset.gallerySrc;
      $$('.gallery-thumb',$('#product-modal-content')).forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  const qtyInput=$('#detail-qty-input');
  const clampQty=()=>{
    let q=Math.max(1,Math.floor(Number(qtyInput.value)||1));
    q=Math.min(q,maxQty);
    qtyInput.value=q;
    return q;
  };
  $('#detail-qty-minus').onclick=()=>{qtyInput.value=Math.max(1,clampQty()-1)};
  $('#detail-qty-plus').onclick=()=>{qtyInput.value=Math.min(maxQty,clampQty()+1)};
  qtyInput.onchange=clampQty;

  const selected=()=>{
    const color=$('#detail-color')?.value||'';
    if(colors.length&&!color){
      toast('Please choose a colour.');
      return null;
    }
    return {qty:clampQty(),color};
  };

  $('#modal-add').onclick=()=>{
    const choice=selected();
    if(!choice)return;
    add(id,choice.qty,choice.color);
    $('#product-modal').classList.remove('show');
  };

  $('#modal-buy-now').onclick=()=>{
    const choice=selected();
    if(!choice)return;
    add(id,choice.qty,choice.color);
    $('#product-modal').classList.remove('show');
    renderCart();
    $('#cart-modal').classList.add('show');
  };

  $('#product-modal').classList.add('show');
}

function startFloatingRecommendations(){
  const eligible=products.filter(p=>p.in_stock!==false);
  if(!eligible.length||$('#gmax-suggestion'))return;
  document.body.insertAdjacentHTML('beforeend',
    '<aside class="gmax-suggestion" id="gmax-suggestion"><button class="suggest-close" id="suggest-close" aria-label="Close">×</button><div id="suggest-content"></div></aside>');
  const box=$('#gmax-suggestion'),content=$('#suggest-content');
  let last=-1;

  function rotate(){
    if(!box||!document.body.contains(box))return;
    let idx=Math.floor(Math.random()*eligible.length);
    if(eligible.length>1&&idx===last)idx=(idx+1)%eligible.length;
    last=idx;
    const p=eligible[idx];
    content.innerHTML=`
      <div class="suggest-label">You may also like</div>
      <div class="suggest-row">
        <button class="suggest-img suggest-img-button" data-suggest-view="${esc(p.id)}">${art(p)}</button>
        <div class="suggest-info">
          <strong>${esc(p.name)}</strong>
          <span>${fmt(p.price)}</span>
          <div class="suggest-actions">
            <button data-suggest-view="${esc(p.id)}">View</button>
            <button class="buy" data-suggest-add="${esc(p.id)}">${colorsFor(p).length?'Choose options':'Add to cart'}</button>
          </div>
        </div>
      </div>`;
    $$('[data-suggest-view]',box).forEach(b=>b.onclick=()=>view(p.id));
    $('[data-suggest-add]',box).onclick=()=>colorsFor(p).length?view(p.id):add(p.id,1,'');
  }

  rotate();
  floatTimer=setInterval(rotate,9000);
  $('#suggest-close').onclick=()=>{clearInterval(floatTimer);box.remove()};
}

function renderCart(){
  const list=$('#cart-list');
  if(!list)return;
  const c=cart();

  list.innerHTML=c.length?c.map(i=>`
    <div class="cart-item">
      <div class="cart-thumb">${i.image_url?`<img src="${esc(i.image_url)}" alt="">`:'🔌'}</div>
      <div>
        <strong>${esc(i.name)}</strong>
        ${i.color?`<div class="cart-meta">Colour: ${esc(i.color)}</div>`:''}
        <div style="color:var(--blue);font-weight:900;margin-top:4px">${fmt(i.price)}</div>
        <div class="qty">
          <button data-dec="${esc(i.key)}">−</button>
          <b>${i.qty}</b>
          <button data-inc="${esc(i.key)}">+</button>
          <span class="remove" data-remove="${esc(i.key)}">Remove</span>
        </div>
      </div>
      <strong>${fmt(i.price*i.qty)}</strong>
    </div>`).join('')
    : '<div class="empty"><h3>Your cart is empty</h3><p>Add products from the store to continue.</p></div>';

  const total=c.reduce((s,i)=>s+i.price*i.qty,0);
  if($('#cart-subtotal'))$('#cart-subtotal').textContent=fmt(total);
  if($('#cart-total'))$('#cart-total').textContent=fmt(total);

  $$('[data-inc]').forEach(b=>b.onclick=()=>changeQty(b.dataset.inc,1));
  $$('[data-dec]').forEach(b=>b.onclick=()=>changeQty(b.dataset.dec,-1));
  $$('[data-remove]').forEach(b=>b.onclick=()=>{
    save(cart().filter(i=>i.key!==b.dataset.remove));
    renderCart();
  });
}

function changeQty(key,d){
  const c=cart();
  const i=c.find(x=>x.key===key);
  if(!i)return;
  let q=Number(i.qty||1)+d;
  if(i.stock_quantity>0)q=Math.min(q,Number(i.stock_quantity));
  if(q<=0){
    save(c.filter(x=>x.key!==key));
  }else{
    i.qty=q;
    save(c);
  }
  renderCart();
}

if($('#cart-open'))$('#cart-open').onclick=()=>{
  renderCart();
  $('#cart-modal').classList.add('show');
};

if($('[data-cart-close]'))$('[data-cart-close]').onclick=()=>$('#cart-modal').classList.remove('show');
if($('[data-close]'))$('[data-close]').onclick=()=>$('#product-modal').classList.remove('show');
$$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')}));
if($('#mobile-menu'))$('#mobile-menu').onclick=()=>$('#navlinks').classList.toggle('open');

$$('[data-cat-link]').forEach(a=>a.addEventListener('click',()=>{
  const c=a.dataset.catLink;
  setTimeout(()=>{
    if($('#filter-category')){
      $('#filter-category').value=c;
      renderShop();
    }
  },50);
}));

if($('#global-search'))$('#global-search').onsubmit=e=>{
  e.preventDefault();
  const q=$('#global-search-input').value;
  location.hash='shop';
  if($('#shop-search')){
    $('#shop-search').value=q;
    renderShop();
  }
};

if($('#contact-form'))$('#contact-form').onsubmit=async e=>{
  e.preventDefault();
  const f=new FormData(e.target);
  const o=Object.fromEntries(f.entries());
  if(configured()&&window.supabase){
    try{
      if(!client)client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
      const {error}=await client.from('contact_messages').insert({...o,status:'new'});
      if(!error){
        e.target.reset();
        return toast('Message sent successfully.');
      }
    }catch{}
  }
  const text=`Website enquiry from ${o.name}\nPhone: ${o.phone||'-'}\nEmail: ${o.email}\nSubject: ${o.subject}\n\n${o.message}`;
  window.open(`https://wa.me/${cfg.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,'_blank');
};

function selectedDelivery(){
  return document.querySelector('input[name="delivery_method"]:checked')?.value||'pickup';
}

function setDeliveryFields(){
  const method=selectedDelivery();
  const box=$('#home-delivery-fields');
  const summary=$('#delivery-summary');
  if(box)box.hidden=method!=='home_delivery';
  if(summary)summary.textContent=method==='home_delivery'?'Awaiting courier quotation':'Store pickup: ₦0';
  if(box){
    ['delivery_state','delivery_city','delivery_address'].forEach(n=>{
      const el=document.querySelector(`[name="${n}"]`);
      if(el)el.required=method==='home_delivery';
    });
  }
}

document.querySelectorAll('input[name="delivery_method"]').forEach(r=>r.addEventListener('change',setDeliveryFields));
setDeliveryFields();

if($('#checkout-form'))$('#checkout-form').onsubmit=async e=>{
  e.preventDefault();
  const c=cart();
  if(!c.length)return toast('Your cart is empty.');

  const f=new FormData(e.target);
  const method=f.get('delivery_method')||'pickup';
  const subtotal=c.reduce((s,i)=>s+i.price*i.qty,0);
  const no='GMAX-'+Date.now().toString().slice(-8);

  if(method==='home_delivery'&&(!f.get('delivery_state')||!f.get('delivery_city')||!f.get('delivery_address'))){
    return toast('Please complete the home delivery address.');
  }

  const address=method==='pickup'
    ? 'Store Pickup — GMAX Technology, Ikeja, Lagos'
    : `${f.get('delivery_address')}, ${f.get('delivery_city')}, ${f.get('delivery_state')}`;

  const order={
    order_number:no,
    customer_name:f.get('name'),
    phone:f.get('phone'),
    email:f.get('email'),
    address,
    notes:f.get('notes'),
    items:c,
    subtotal,
    delivery_method:method,
    delivery_state:method==='home_delivery'?f.get('delivery_state'):null,
    delivery_city:method==='home_delivery'?f.get('delivery_city'):null,
    delivery_address:method==='home_delivery'?f.get('delivery_address'):null,
    delivery_landmark:method==='home_delivery'?f.get('delivery_landmark'):null,
    delivery_fee:method==='pickup'?0:null,
    delivery_status:method==='pickup'?'not_required':'quote_pending',
    payment_status:'unpaid',
    total:subtotal,
    status:method==='pickup'?'new':'delivery_quote_pending'
  };

  if(!configured()||!window.supabase)return toast('The ordering database is not connected.');

  try{
    if(!client)client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
    const {error}=await client.from('orders').insert(order);
    if(error)throw error;
  }catch(err){
    console.warn(err);
    return toast('Could not save the order. Please try again.');
  }

  // Ask the server to alert the admin. Failure never cancels the customer's order.
  fetch('/api/order-notify',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({orderNumber:no}),
    keepalive:true
  }).catch(err=>console.warn('Admin WhatsApp alert was not sent:',err));

  localStorage.setItem('gmax_last_order',JSON.stringify({
    order_number:no,phone:order.phone,total:subtotal,delivery_method:method
  }));

  const result=$('#checkout-result');
  if(result)result.innerHTML=`<div class="order-success"><b>Order created: ${no}</b><br>${method==='home_delivery'?'GMAX will obtain a courier quote before you pay.':'Your current total is '+fmt(subtotal)+'.'}</div>`;

  const lines=c.map(i=>`• ${i.name}${i.color?` (${i.color})`:''} × ${i.qty} — ${fmt(i.price*i.qty)}`).join('\n');
  const deliveryText=method==='home_delivery'
    ? `HOME DELIVERY\nState: ${order.delivery_state}\nCity/Area: ${order.delivery_city}\nAddress: ${order.delivery_address}\nLandmark: ${order.delivery_landmark||'-'}\nDelivery fee: Awaiting courier quotation\nFinal total: To be confirmed`
    : `STORE PICKUP\nDelivery fee: ₦0\nTotal: ${fmt(subtotal)}`;

  const text=`Hello GMAX Technology, I have placed an order.\n\nOrder: ${no}\nCustomer: ${order.customer_name}\nPhone: ${order.phone}\n\n${lines}\n\nSubtotal: ${fmt(subtotal)}\n\n${deliveryText}\n\nNotes: ${order.notes||'-'}`;
  window.open(`https://wa.me/${cfg.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,'_blank');

  save([]);
  renderCart();
};

if($('#receipt-form'))$('#receipt-form').onsubmit=async e=>{
  e.preventDefault();
  const form=e.target;
  const status=$('#receipt-status');
  const fd=new FormData(form);
  const file=form.elements.receipt.files[0];

  if(!file)return;
  const allowed=['image/jpeg','image/png','application/pdf'];
  if(!allowed.includes(file.type)){
    status.innerHTML='<div class="notice bad">Please choose a JPG, PNG or PDF receipt.</div>';
    return;
  }
  if(file.size>2.5*1024*1024){
    status.innerHTML='<div class="notice bad">Receipt is too large. Keep it below 2.5 MB.</div>';
    return;
  }

  status.innerHTML='<div class="notice">Sending receipt to GMAX WhatsApp...</div>';
  const base64=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result).split(',')[1]);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });

  try{
    const res=await fetch('/api/send-receipt',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        orderNumber:String(fd.get('order_number')||'').trim(),
        customerName:String(fd.get('customer_name')||'').trim(),
        phone:String(fd.get('phone')||'').trim(),
        amountPaid:Number(fd.get('amount_paid')),
        fileName:file.name,
        mimeType:file.type,
        dataBase64:base64
      })
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'Receipt could not be sent.');
    status.innerHTML='<div class="notice ok"><b>Receipt sent to GMAX WhatsApp.</b><br>Please wait for staff to verify the payment before dispatch.</div>';
    form.reset();
  }catch(err){
    status.innerHTML=`<div class="notice bad">${esc(err.message)}<br>Please contact GMAX on WhatsApp if the problem continues.</div>`;
  }
};

updateCartCount();
load();
})();