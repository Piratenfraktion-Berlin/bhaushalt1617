var d3 = require('d3'),
    container = d3.select('.chart-tooltip'),
    utils = require('./utils'),
    Hogan = require('hogan.js');


var templateMarkup = document.getElementById('tt-template').innerHTML,
    template = Hogan.compile(templateMarkup);


function show() {
  container.classed('active', true);
}

function hide() {
  container.classed('active', false);
}

function update(data) {
  container.node().innerHTML = '';

  var html = template.render(data);
  container.node().innerHTML = html;
}

function setPosition(pos) {
  var visWidth = document.querySelector('#vis').offsetWidth;
  var tooltipWidth = container.node().offsetWidth;
  var x = pos[0] - (tooltipWidth / 2);
  var y = pos[1] - container.node().offsetHeight;

  if(x < 0){
    x = 0
  }else if(x + tooltipWidth > visWidth){
    x -= tooltipWidth/2;
  }

  container.style({
    top: (y < 0 ? 0 : y) + 'px',
    left: x + 'px'
  });
}

module.exports = {
  show : show,
  hide : hide,
  update : update,
  setPosition : setPosition
}