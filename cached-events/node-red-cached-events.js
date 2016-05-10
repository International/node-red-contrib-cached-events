module.exports = function(RED) {
  var util = require("util"),
      _   = require("underscore"),
      fs  = require("fs");

  function DumbSet(initialData, addFunc) {
    this.container = [];
    this.addFunc   = addFunc;

    var initialInput = initialData || [];

    Array.prototype.slice.call(initialInput).forEach(e => {
      this.add(e);
    })
  }

  DumbSet.prototype.add = function(data) {
    if(this.addFunc(this.container, data)) {
      this.container.push(data);
      return true;
    }
    return false;
  }

  DumbSet.prototype.toArray = function () {
    return this.container;
  };

  CachedEvents.prototype.cloneEvent = function(msg) {
    var newObject = Object.assign({}, msg);
    delete newObject._msgid;
    return newObject;
  }

  function CachedEvents(config) {
    RED.nodes.createNode(this,config);
    this.file = config.file;

    this.on('input', function(msg) {
      var eventFile = [];

      try {
        eventFile = require(this.file);
      } catch(err) {
        console.log("[CachedEvents] falling back to empty array, as JSON not parseable");
      }

      var node      = this;

      var eventSet  = new DumbSet(eventFile, function(container, element) {
        return _.find(container, function(scannedElem) {
          return _.isEqual(this.cloneEvent(scannedElem), this.cloneEvent(element));
        }, node) === undefined;
      });

      if(eventSet.add(msg)) {
        node.send(msg);
        fs.writeFile(this.file, JSON.stringify(eventSet.toArray()), (err) => {
          if(err) {
            console.log("[CachedEvents] Error serializing event set");
            console.log(err.toString());
          }
        })
      }

    });
  }

  RED.nodes.registerType("cached-events", CachedEvents);
}
