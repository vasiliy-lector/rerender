var Benchmark = require('benchmark'),
    html = require('./lib/html.js').default,
    htmlNoCache = require('./lib/htmlNoCache.js').default;

var suite = new Benchmark.Suite,
    templates = ['<div class="block" style=',' id="id1" title=','><p id="id2" class=','>text of p</p></div>'],
    values = [{ background: 'red' }, 'title', 'classname'];

function cache() {
    return html(templates, values[0], values[1], values[2]);
}

function noCache() {
    return htmlNoCache(templates, values[0], values[1], values[2]);
}

console.log('noCache', noCache()); // eslint-disable-line no-console
console.log('cache', cache()); // eslint-disable-line no-console

suite
.add('noCache', noCache)
.add('cache', cache)
.on('cycle', function(event) {
    console.log(String(event.target)); // eslint-disable-line no-console
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name')); // eslint-disable-line no-console
})
.run({ 'async': true });
