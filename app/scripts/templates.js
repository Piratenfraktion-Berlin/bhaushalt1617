var Hogan = require('hogan.js'),
 data, template, cardWrapper;

function init(_data){

  data = _data;

  var templateHTML = document.getElementById('card-template').innerHTML;
  
  template = Hogan.compile(templateHTML);
  cardWrapper = document.getElementById('cards');
  
  data.forEach(createCard);

  renderTemplates();
}

function createCard(d, index){
    d.iconClass = d.change < 0 ? 'fa-arrow-down' : 'fa-arrow-up';
    d.percentage = d.change.toFixed(1).replace('.', ',');
    
    var card = template.render(d),
      container = document.createElement('div');
    
    container.innerHTML = card;

    cardWrapper.appendChild(container);

    if(index < data.length-1){
      var hr = document.createElement('hr');  
      cardWrapper.appendChild(hr);
    }

}

function renderTemplates() {

  var data = datavisApp.config;

  var container = document.querySelectorAll('*[data-template]');
  for(var i = 0; i < container.length; i++) {
    var _this = container[i];

    var templateHTML = document.getElementById(_this.getAttribute('data-template')).innerHTML,
        template = Hogan.compile(templateHTML);

    _this.innerHTML = (template.render(data));
  }
}


module.exports = {
  init : init
}