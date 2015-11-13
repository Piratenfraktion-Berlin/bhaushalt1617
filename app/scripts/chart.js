var d3 = require('d3'),
    config = require('./config').chart,
    userConfig = datavisApp.config,
    utils = require('./utils'),
    Velocity = require('velocity-animate'),
    tooltip = require('./tooltip');

var parent, svg, chart,
    legend,
    colorScale,
    bubbleScale,
    xScale,
    yScale,
    xAxis,
    yAxis,
    extent = {};

function init(cb) {
  if(!datavisApp.data){
    return console.warn('no data found.')
  }

  var json =  formatData(datavisApp.data);

  loadSuccess(json);
    
  if(!utils.isUndefined(cb)) {
    cb(json);
  }

  return this;
}

function loadSuccess(json) {

  data = json;

  parent = d3.select('#vis');
  legend = d3.select('.chart-info .legend');
  
  extent.data1617 = d3.extent(data, function(d) {return d.data1617;});
  extent.data15 = d3.extent(data, function(d) {return d.data15;});
  extent.change = d3.extent(data, function(d) {return d.change;});
  
  svg = parent
    .insert('svg', ':first-child')
    .attr({
      height : config.height + config.padding.top + config.padding.bottom,
      width : getChartWidth() + config.padding.right + config.padding.left
    });

  chart = svg.append('g')
    .attr('transform', 'translate(' + config.padding.left + ',' + config.padding.top + ')');

  initScales();
  initEvents();

  render();

  parent.classed('loading', false);
}

function formatData(json) {
  if(userConfig.sortBy == 'name') {
    json = json.sort(function(a,b) {
      if(a.name < b.name) return -1;
      if(a.name > b.name) return 1;
      return 0;
    });
  }
  else if(userConfig.sortBy == 'size'){
    var json = json.sort(function(a,b) {
      return Math.abs(b['data1617']) - Math.abs(a['data1617']);
    });
  }
  else {
    var json = json.sort(function(a,b) {
      return Math.abs(b['change']) - Math.abs(a['change']);
    });
  }

  json.forEach(function(d,i) {
    d.id = createId(d);
    d.updown = d.change > 0 ? 'Zunahme' : 'Abnahme';
    d.formattedData1617 = utils.numberFormat(d.data1617);
    d.readableData1617 = utils.getReadableNumber(d.data1617);
    d.absVal = Math.abs(d.change).toFixed(1).replace('.', ',');
  });
  
  return json;
}

function createId(d){
  return d.name.toLowerCase()
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace(/\)/g, '')
    .replace(/\(/g, '')
    .replace(/\s/g, '-')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/--/g, '-')
}

function initScales() {
  colorScale = d3.scale.category20();
  
  var bubbleSize = window.innerWidth < config.breakpoint ? config.mobileBubbleSize : config.bubbleSize;

  bubbleScale = d3.scale.sqrt()
    .domain([0,extent.data1617[1]])
    .range([3,bubbleSize]);

  xScale = d3.scale.linear()
    .domain([0,data.length])
    .range([50,getChartWidth()]);

  yScale = d3.scale.linear()
    .domain([config.yMax, config.yMin])
    .range([0,config.height]);
}

function initEvents() {
  d3.select(window)
    .on('resize', utils.debounce(resize, 250));

  d3.select('.scroll-top')
    .on('click', scrollTop)
}

function createAxis() {
  xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom');

  yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('right')
    .tickFormat(function(d) {
      return d + '%';
    })
    .tickSize(getChartWidth());

  // chart
  //   .append('g')
  //   .classed('x axis', true)
  //   .attr('transform', 'translate(0,' + config.height + ')')
  //   .call(xAxis);

  chart
    .append('g')
    .classed('y axis', true)
    .call(yAxis)
    .call(customizeYAxis);

}

//http://bl.ocks.org/mbostock/4323929
function customizeYAxis(g) {
  g.selectAll('text')
      .attr('x', 8)
      .attr('dy', -4);

  //highlight zero tick
  g.selectAll('g.tick')
    .filter(function(d) {
      return d == 0;
    })
    .classed('zero', true);

  //add chart labels
  g.selectAll('g.tick')
    .filter(function(d) {
      return d == config.yMin;
    })
    .select('text')
    .html(function(d) {
      return '<tspan>' + d3.select(this).text() + ' ' + '</tspan><tspan class="bold">' + config.yAxisLabel + '</tspan>';
    });
}

function createBubbles() {
  var bubbles = chart.append('g')
    .classed('bubbles', true);

  bubbles
    .selectAll('circle')
    .data(data)
    .enter()
    .append('g')
    .call(labelBubbles)
    .append('circle')
    .classed('bubble', true)
    .attr({
      r: function(d) {return bubbleScale(d.data1617)},
      cx: function(d,i) {return xScale(i)},
      cy: function(d) {return yScale(d.change)},
      fill: function(d) {return d.color || colorScale(d.name);},
      stroke: function(d) {return d.color || colorScale(d.name);}
    })
    .on('mouseenter', bubbleEnter)
    .on('mouseleave', bubbleLeave)
    .on('mousemove', bubbleMove)
    .on('click', bubbleClick)
    .on('touchstart', bubbleClick);
}

function labelBubbles(bubbles) {
  
  //short names
  bubbles
    .append('text')
    .classed('bubble-label', true)
    .attr({
      x : getLabelX,
      y : getLabelY,
      'text-anchor': getLabelTextAnchor
    })
    .attr('fill', function(d,i) {
      return d.color || colorScale(d.name);
    })
    .call(createLabel);
}

function createLabel(selection) {

  var longNames = selection.filter(function(d) {
    return d.name.length > config.labelLength;
  });

  var shortNames = selection.filter(function(d) {
    return d.name.length <= config.labelLength;
  });

  shortNames.text(function(d) {
    return d.name;
  });

  //first row
  longNames
    .append('tspan')
    .text(function(d) {
      return utils.splitLabel(d.name, config.labelLength)[0];
    });

  longNames
    .append('tspan')
    .text(function(d) {
      return utils.splitLabel(d.name, config.labelLength)[1];
    })
    .attr('dy', '1em')
    .attr('x', function(d) {
      var parent = d3.select(this.parentNode);
      if(parent.data()[0].labelPosition.match(/top|right|left/)) {
        parent.attr('y', parent.attr('y') - 8);
      }
      return parent.attr('x');
    });
}

function getLabelX(d,i) {
  var x,pos = d.labelPosition, r = bubbleScale(d.data1617);

  if(pos == 'left') {
    x = xScale(i) - r;
  }
  else if(pos == 'top' || pos == 'bottom') {
    x = xScale(i);
  }
  else {
    x = xScale(i) + r + 5;
  }

  return x;
}

function getLabelY(d) {
  var y,pos = d.labelPosition, r = bubbleScale(d.data1617);

  if(pos == 'left' || pos == 'right') {
    y = yScale(d.change) + 5;
  }
  else if(pos == 'top') {
    y = yScale(d.change) - r - (d.name.length > config.labelLength ? 10 : 5);
  }
  else {
    y = yScale(d.change) + r + 15;
  }
  
  return y;
}

function getLabelTextAnchor(d) {
  var a = 'left', pos = d.labelPosition;

  if(pos == 'top' || pos == 'bottom') {
    a = 'middle';
  }
  else if(pos == 'left') {
    a = 'right';
  }

  return a;
}

function createLegend() {
  legend.selectAll('*').remove();

  var r1 = bubbleScale(config.legend.outerValue);

  var l = legend.append('svg')
    .attr('width', r1*2 + 2)
    .attr('height', r1*2 + 2)

  //create outer bubble
  l.append('circle')
    .attr({
      r : r1,
      cx : r1,
      cy : r1
    });

  //create inner bubble
  var r2 = bubbleScale(config.legend.innerValue);
  l.append('circle')
    .attr({
      r : r2,
      cx : r1,
      cy : r1*2 - r2
    });

  //create legend labels
  l.append('text')
    .text(legendNumberFormat(config.legend.innerValue))
    .attr({
      'text-anchor': 'middle',
      x : r1,
      y : r1*2 - r2 + 5
    });

  //create legend labels
  l.append('text')
    .text(legendNumberFormat(config.legend.outerValue))
    .attr({
      'text-anchor': 'middle',
      x : r1,
      y : r2 + 5
    });
}

function legendNumberFormat(n) {
  var dec = n / 1000000000;
  return dec.toFixed(0) + ' Mrd';
}

function render() {
  //clear container before rendering
  chart.selectAll('*').remove();

  initScales();
  createAxis();
  createBubbles();
  createLegend();
}

function resize() {

  svg.attr('width', getChartWidth);
  render();
}

function getChartWidth() {
  return d3.select('.app-wrapper').node().getBoundingClientRect().width;
}

function bubbleEnter(d,i) {
  d3.select(this)
    .classed('active', true);
  tooltip.update(d);
  tooltip.show();
}

function bubbleMove(d,i,evt) {
  var evt = d3.event;
  var pos = [evt.offsetX, evt.offsetY - bubbleScale(d.data1617)];

  tooltip.setPosition(pos, i)
}

function bubbleLeave(d,i) {
  d3.select(this)
    .classed('active', false);

  tooltip.hide();
}

function bubbleClick(d,i) {
  Velocity(document.querySelectorAll('#' + d.id), 'scroll', { duration : 500 });
  window.location.hash = d.id;
}

function scrollTop() {
  Velocity(document.querySelectorAll('body,html'), 'scroll', { offset : 0, duration : 500});
  window.location.hash = 'top';
}

module.exports = {
  init : init
}