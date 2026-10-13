window.PINAL_BOOST_CONFIG = Object.freeze({
  url: 'https://dxcajwarqojvmbteroco.supabase.co',
  key: 'sb_publishable_ehUKOOksq5SlkTNb-wQ8ZA_Zh8XlWDF',
  region: 'Pinal County',
  authRedirect: 'https://pinalworkforce1-del.github.io/BOOST_Pathway-Portal/'
});

(()=>{
  if(/staff-dashboard\.html$/i.test(location.pathname)){
    const s=document.createElement('script');
    s.src='assets/js/talentsync-coach.js?v=2';
    s.defer=true;
    document.head.appendChild(s);
  }
  if(/talentsync\.html$/i.test(location.pathname)){
    window.addEventListener('DOMContentLoaded',()=>{
      const tabs=document.querySelector('.view-tabs');
      if(!tabs||tabs.querySelector('a[href="talentsync-qa.html"]'))return;
      const a=document.createElement('a');
      a.className='view-tab';
      a.href='talentsync-qa.html';
      a.textContent='Quality Assurance';
      a.style.cssText='text-decoration:none;display:inline-flex;align-items:center';
      const back=tabs.querySelector('a[href="staff-dashboard.html"]');
      tabs.insertBefore(a,back||null);
    });
  }
})();