// emile.js (c) 2009 Thomas Fuchs
// Licensed under the terms of the MIT license.
// Animation processing and Internet Explorer opacity handling added by Erik Raetz

(function(emile, container){

  var parseEl = document.createElement('div'),
    props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth '+
    'borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize '+
    'fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight '+
    'maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft '+
    'paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' ');

  function interpolate(source,target,pos){ return (source+(target-source)*pos).toFixed(3); }
  function s(str, p, c){ return str.substr(p,c||1); }
  function color(source,target,pos){
    var i = 2, j, c, tmp, v = [], r = [];
    while(j=3,c=arguments[i-1],i--)
      if(s(c,0)=='r') { c = c.match(/\d+/g); while(j--) v.push(~~c[j]); } else {
        if(c.length==4) c='#'+s(c,1)+s(c,1)+s(c,2)+s(c,2)+s(c,3)+s(c,3);
        while(j--) v.push(parseInt(s(c,1+j*2,2), 16)); }
    while(j--) { tmp = ~~(v[j+3]+(v[j]-v[j+3])*pos); r.push(tmp<0?0:tmp>255?255:tmp); }
    return 'rgb('+r.join(',')+')';
  }

  function parse(prop){
    if (typeof prop != 'string') prop = prop.toString();
    var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/,'');
    return isNaN(p) ? { v: q, f: color, u: ''} : { v: p, f: interpolate, u: q };
  }

  function normalize(style){
    var css, rules = {}, i = props.length, v;
    parseEl.innerHTML = '<div style="'+style+'"></div>';
    css = parseEl.childNodes[0].style;
    while(i--) if(v = css[props[i]]) rules[props[i]] = parse(v);
    return rules;
  }

  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    window.requestAnimationFrame = window[vendors[i]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[i]+'CancelAnimationFrame'] || window[vendors[i]+'RequestCancelAnimationFrame'];
  }
  if (window.requestAnimationFrame) console.log('using the new requestAnimationFrame');
  else console.log('using setTimeout for animation');
  if (!window.requestAnimationFrame) window.requestAnimationFrame = function(callback, element) { return window.setTimeout(callback, 15); };
  if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function(interval) { clearTimeout(interval); };

  container[emile] = function(el, style, opts, after){
    el = typeof el == 'string' ? document.getElementById(el) : el;
    opts = opts || {}; if(!el.processingDir) el.processingDir = {};
    var target = normalize(style), comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
      prop, current = {}, start = +new Date, dur = opts.duration||200, finish = start+dur, interval,
      //internet explorer css functionality check (http://blogs.msdn.com/b/ie/archive/2010/08/17/ie9-opacity-and-alpha.aspx)
      chkOpacity = typeof document.createElement("div").style.opacity === 'undefined' ? false : true,
      chkFilter = typeof document.createElement("div").style.filter === 'undefined' ? false : true,
      easing = opts.easing || function(pos){ return (-Math.cos(pos*Math.PI)/2) + 0.5; };
    for(prop in target) current[prop] = parse(comp[prop]);
    if(target[prop].v > current[prop].v) el.processingDir[prop] = 'asc';
    else if(target[prop].v < current[prop].v) el.processingDir[prop] = 'desc';
    var loop = function(){
      var quit = false, time = +new Date, pos = time>finish ? 1 : (time-start)/dur;
      for(prop in target) {
        if(((target[prop].v > current[prop].v) && (el.processingDir[prop] == 'desc')) || ((target[prop].v < current[prop].v) && (el.processingDir[prop] == 'asc'))) { quit = true; cancelAnimationFrame(interval); break; }
        var v = target[prop].f(current[prop].v,target[prop].v,easing(pos)) + target[prop].u;
        el.style[prop] = v;
        if((prop == "opacity") && (chkOpacity == false) && (chkFilter == true)) { el.style.filter = "alpha(opacity="+(v*100)+")"; }  // use filter only when opacity is not found and filters is known
      }
      if(time>finish) { cancelAnimationFrame(interval); opts.after && opts.after(); after && setTimeout(after,1); } else if (quit == false) { interval = requestAnimationFrame(loop, el); }
    }
    interval = requestAnimationFrame(loop, el);
  }
})('emile', this);