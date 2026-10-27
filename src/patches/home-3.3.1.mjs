// HOME-3.3.1 patches (see src/mods/home-3.3.1.js)
export default [
  {
    // expose the desktop internals (they live inside a closure) to the mod
    name: 'HOME-3.3.1 expose desktop internals',
    find: 'window.DSKX2={dropApp:function(id,e)',
    replace: 'window.DSKI={lnks:function(){return LNKS},desk:DESK,dp:function(){return DP},saveL:saveL,saveDP:saveDP,addLnk:addLnk,geom:geom,items:items,layout:layout,ddir:DDIR};\nwindow.DSKX2={dropApp:function(id,e)',
  },
  {
    // show the real reason when moving to the Recycle Bin fails
    name: 'HOME-3.3.1 trash error reason',
    find: "}catch(e){f++;try{await NF.remove({paths:[TRD+'/'+id]})}catch(x){}}}\ntrSave();if(n)toast(n+' item'+(n>1?'s':'')+' moved to Recycle Bin');if(f)toast('Could not move '+f+' item(s)');return n}",
    replace: "}catch(e){f++;window.__trErr=e;try{await NF.remove({paths:[TRD+'/'+id]})}catch(x){}}}\ntrSave();if(n)toast(n+' item'+(n>1?'s':'')+' moved to Recycle Bin');if(f){var _te=window.__trErr,_tm=_te&&(_te.message||String(_te));toast('Could not move '+f+' item(s)'+(_tm?': '+String(_tm).slice(0,120):''),6000)}return n}",
  },
];
