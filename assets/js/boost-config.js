window.BOOST_CONFIG = {
  cloudEnabled: true,
  supabaseUrl: "https://dxcajwarqojvmbteroco.supabase.co",
  supabaseAnonKey: "sb_publishable_ehUKOOksq5SlkTNb-wQ8ZA_Zh8XlWDF",
  region: "Pinal County"
};

(function loadPinal20260926Enhancements(){
  const scripts=[
    ['assets/js/pinal-dependency-freshness-v1.js?v=20260926c','Pinal revisit indicators'],
    ['assets/js/pinal-rosie-discover-context-v1.js?v=20260926b','Rosie Discover context']
  ];
  scripts.forEach(([src,label])=>{
    if(document.querySelector(`script[src^="${src.split('?')[0]}"]`))return;
    const s=document.createElement('script');s.src=src;s.async=false;s.onerror=()=>console.warn(label+' could not load.');document.head.appendChild(s);
  });
})();
