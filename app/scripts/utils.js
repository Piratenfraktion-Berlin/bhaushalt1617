/**
 * Here you implement your functions you want to use everywhere in your application.
 * See this functions as an example.
 */


var debugMode = true;

/////////////////////
/// devices helper //
/////////////////////

// < IE9
var isOldBrowser = !(('querySelector' in document) && ('localStorage' in window) && ('addEventListener' in window)),
  // includes tables and smartphones
  isMobile = !isUndefined(window.orientation),
  // smartphone detection (android,iphone,blackberry,windows phone)
  isSmartphone = /android.*mobile|mobile.*android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  // device depending click event
  clickEvent = isMobile ? 'touchstart' : 'click';



///////////////////////
/// helper functions //
///////////////////////

function isUndefined(obj) {
  return typeof obj === 'undefined';
}

function isNumeric(number) {
  if(isUndefined(number)){
    return false;
  }

  return !isNaN(number) && isFinite(number);
}

function numberFormat(number) {

  if (!isNumeric(number)) {
    return false;
  }

  var formattedNumber = number.toString().split('.');

  if(number > 9999) {
    formattedNumber[0] = formattedNumber[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  return formattedNumber.join(','); 
}

function getReadableNumber(number){

  var isBillion = number >= 1000000000,
    divisor = isBillion ? 1000000000 : 1000000,
    label = isBillion ? 'Mrd.' : 'Mio.';

  var num = (number / divisor).toFixed(1);
  num = num.replace('\.0', '').replace('\.', ','); 

  return  num + ' ' + label;
}

// add some classes to the html element
function addHelperClasses() {
  var htmlElement = document.getElementsByTagName('html')[0],
    className = [];

  if (isOldBrowser) {
    className.push('is-oldbrowser');
  }

  if (isMobile) {
    className.push('is-mobile');
  }

  if (isSmartphone) {
    className.push('is-smartphone');
  }

  htmlElement.className = className.join(' ');
}

function log(){
  if(!debugMode) {
    return false;
  }
  
  var args = Array.prototype.slice.call(arguments);

  if(args.length === 1){
    args = args[0];
  } 
}

//http://davidwalsh.name/javascript-debounce-function
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

//https://github.com/gka/d3-jetpack/blob/master/d3-jetpack.js
function splitLabel(line, maxCharactersPerLine) {
    var w = line.split(' '),
      lines = [],
      words = [],
      maxChars = maxCharactersPerLine || 40,
      l = 0;
  w.forEach(function(d) {
      if (l+d.length > maxChars) {
          lines.push(words.join(' '));
          words.length = 0;
          l = 0;
      }
      l += d.length;
      words.push(d);
  });
  if (words.length) {
      lines.push(words.join(' '));
  }

  if(lines.length > 2) {
    for(var i = 2; i < lines.length; i++) {
      lines[1] += ' ' + lines[i];
    }
  }

  return lines;
}

module.exports = {

  isMobile: isMobile,
  isSmartphone: isSmartphone,
  isOldBrowser: isOldBrowser,
  clickEvent: clickEvent,

  isUndefined: isUndefined,
  isNumeric: isNumeric,
  numberFormat: numberFormat,
  addHelperClasses: addHelperClasses,
  log : log,
  debounce : debounce,
  splitLabel : splitLabel,
  getReadableNumber : getReadableNumber

};