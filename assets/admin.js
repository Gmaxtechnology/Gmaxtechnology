(()=>{
const cfg=window.GMAX_CONFIG||{},
$=s=>document.querySelector(s),
$$=s=>[...document.querySelectorAll(s)],
fmt=n=>'₦'+Number(n||0).toLocaleString('en-NG');

let client=null, editing=null, cache=[];

const configured=()=>!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY);

function note(t,ok=true){
  const e=$('.toast');
  e.textContent=t;
  e.style.background=ok?'#071b33':'#a52f36';
  e.classList.add('show');
  setTimeout(()=>e.classList.remove('show'),3200);
}

function tab(n){
  $$('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===n));
  $$('.panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+n));
}

function productImages(p){
  let list=[];
  if(Array.isArray(p?.image_urls)) list=p.image_urls.filter(Boolean);
  if(!list.length && p?.image_url) list=[p.image_url];
  return list.slice(0,4);
}

function showExistingImages(urls){
  const box=$('#existing-images-preview');
  if(!box) return;
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
  if(data.session) show();
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

  const {data:a,error:adminErr}=await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id',data.user.id)
    .maybeSingle();

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
  await Promise.all([loadProducts(),loadOrders(),loadMessages()]);
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
  if(client) await client.auth.signOut();
  location.reload();
};

async function loadProducts(){
  const {data,error}=await client
    .from('products')
    .select('*')
    .order('created_at',{ascending:false});

  if(error) return note(error.message,false);

  cache=data||[];

  $('#products-body').innerHTML=cache.map(p=>{
    const imgs=productImages(p);
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          ${imgs[0]?`<img src="${imgs[0]}" alt="" style="width:46px;height:46px;border-radius:9px;object-fit:cover">`:''}
          <div><b>${p.name}</b><br><small>${p.category||''} · ${imgs.length} photo${imgs.length===1?'':'s'}</small></div>
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
  if(!p) return;

  editing=id;
  const f=$('#product-form');

  ['name','category','brand','price','old_price','description','stock_quantity']
    .forEach(k=>f.elements[k].value=p[k]??'');

  const imgs=productImages(p);
  f.elements.existing_images.value=JSON.stringify(imgs);
  f.elements.featured.checked=!!p.featured;
  f.elements.in_stock.checked=!!p.in_stock;
  f.elements.specs.value=Object.entries(p.specs||{})
    .map(([k,v])=>`${k}: ${v}`)
    .join('\n');

  // Browsers do not allow us to pre-fill a file picker. We simply show saved photos below.
  f.elements.images.value='';
  showExistingImages(imgs);
  tab('form');
}

async function del(id){
  if(!confirm('Delete this product?')) return;

  const {error}=await client.from('products').delete().eq('id',id);
  if(error) return note(error.message,false);

  loadProducts();
  note('Product deleted');
}

$('#product-images-input').addEventListener('change',e=>{
  const files=[...e.target.files];

  if(files.length>4){
    e.target.value='';
    note('Please choose no more than 4 photographs.',false);
    return;
  }

  if(!files.length) return;

  const box=$('#existing-images-preview');
  box.innerHTML=files.map((file,i)=>{
    const url=URL.createObjectURL(file);
    return `<div class="admin-preview-item">
      <img src="${url}" alt="New image ${i+1}">
      <span>New photo ${i+1}</span>
    </div>`;
  }).join('');
});

$('#product-form').onsubmit=async e=>{
  e.preventDefault();

  const f=e.target;
  const fd=new FormData(f);
  const newFiles=[...f.elements.images.files];

  if(newFiles.length>4){
    return note('Please choose no more than 4 photographs.',false);
  }

  let image_urls=[];
  try{
    image_urls=JSON.parse(fd.get('existing_images')||'[]');
    if(!Array.isArray(image_urls)) image_urls=[];
  }catch{
    image_urls=[];
  }

  // If any new photographs were chosen, replace the old set with the new set.
  if(newFiles.length){
    image_urls=[];

    for(let i=0;i<newFiles.length;i++){
      const file=newFiles[i];

      if(file.size > 5*1024*1024){
        return note(`Photo ${i+1} is too large. Keep each photo below 5 MB.`,false);
      }

      const safe=file.name.replace(/[^a-z0-9._-]/gi,'-');
      const path=`products/${Date.now()}-${i+1}-${safe}`;

      const {error}=await client.storage
        .from('product-images')
        .upload(path,file,{upsert:false});

      if(error){
        return note('Image upload failed: '+error.message,false);
      }

      const publicUrl=client.storage
        .from('product-images')
        .getPublicUrl(path).data.publicUrl;

      image_urls.push(publicUrl);
    }
  }

  image_urls=image_urls.filter(Boolean).slice(0,4);
  const image_url=image_urls[0]||'';

  let specs={};
  String(fd.get('specs')||'')
    .split('\n')
    .filter(Boolean)
    .forEach(line=>{
      const i=line.indexOf(':');
      if(i>0) specs[line.slice(0,i).trim()]=line.slice(i+1).trim();
    });

  const o={
    name:fd.get('name'),
    category:fd.get('category'),
    brand:fd.get('brand'),
    price:Number(fd.get('price')),
    old_price:fd.get('old_price')?Number(fd.get('old_price')):null,
    stock_quantity:Number(fd.get('stock_quantity')||0),
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

  if(r.error) return note(r.error.message,false);

  editing=null;
  f.reset();
  f.elements.existing_images.value='[]';
  showExistingImages([]);
  await loadProducts();
  tab('products');
  note('Product saved with '+image_urls.length+' photograph'+(image_urls.length===1?'':'s'));
};

async function loadOrders(){
  const {data}=await client
    .from('orders')
    .select('*')
    .order('created_at',{ascending:false})
    .limit(100);

  $('#orders-body').innerHTML=(data||[]).map(o=>`
    <tr>
      <td><b>${o.order_number}</b><br><small>${new Date(o.created_at).toLocaleString()}</small></td>
      <td>${o.customer_name}<br><small>${o.phone}</small></td>
      <td>${fmt(o.total)}</td>
      <td>${o.status}</td>
    </tr>`).join('');
}

async function loadMessages(){
  const {data}=await client
    .from('contact_messages')
    .select('*')
    .order('created_at',{ascending:false})
    .limit(100);

  $('#messages-body').innerHTML=(data||[]).map(m=>`
    <tr>
      <td>${m.name}<br><small>${m.email}</small></td>
      <td><b>${m.subject||''}</b><br>${m.message}</td>
      <td>${new Date(m.created_at).toLocaleString()}</td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded',init);
})();