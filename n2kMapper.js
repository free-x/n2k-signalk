var n2kMappings = require("./n2kMappings.js").mappings;
var through = require('through');


var toFlat = function (n2k) {
  var theMappings = n2kMappings[n2k.pgn];
  if (typeof theMappings != 'undefined') {
    return theMappings
      .filter(function (theMapping) {
        try {
          return typeof theMapping.filter === 'undefined' || theMapping.filter(n2k);
        } catch (ex) {
          process.stderr.write(ex + ' ' + n2k);
          return false;
        }
      })
      .map(function (theMapping) {
        try {
          return  {
            path: theMapping.node,
            value: typeof theMapping.source != 'undefined' ?
              Number(n2k.fields[theMapping.source]) :
              theMapping.value(n2k),
            source: {
              pgn: n2k.pgn,
              timestamp: n2k.timestamp,
              src: n2k.src
            }
          }
        } catch (ex) {
          process.stderr.write(ex + ' ' + n2k);
        }
      })
      .filter(function (x) {
        return x != undefined;
      });
  }
  return [];
}

var flatToNested = function (msg) {
  var result = {};
  var temp = result;
  var parts = msg.path.split('.');
  for (var i = 0; i < parts.length - 1; i++) {
    temp[parts[i]] = {};
    temp = temp[parts[i]];
  }
  temp[parts[parts.length - 1]] = msg;
  msg.path = undefined;
  return result;
}

exports.toFlat = toFlat;
exports.toNested = function (n2k) {
  return toFlat(n2k).map(flatToNested);
}

exports.toFlatTransformer = function (options) {
  var stream = through(function (data) {
    if (options.debug) {
      console.log(data);
    }
    exports.toFlat(data).forEach(stream.queue);
  });
  return stream;
}

exports.toNestedTransformer = function (options) {
  var stream = through(function (data) {
    if (options.debug) {
      console.log(data);
    }
    exports.toNested(data).forEach(stream.queue);
  });
  return stream;
}