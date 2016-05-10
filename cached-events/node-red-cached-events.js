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

  function CachedEvents(config) {
    RED.nodes.createNode(this,config);
    this.file = config.file;

    this.on('input', function(msg) {
      var eventFile = [];

      try {
        eventFile = JSON.parse(fs.readFileSync(this.file));
      } catch(err) {
        console.log("[CachedEvents] falling back to empty array, as JSON not parseable");
      }

      var node      = this;

      var eventSet  = new DumbSet(eventFile, function(container, element) {
        return _.find(container, function(scannedElem) {
          return _.isEqual(scannedElem, element)
        }, node) === undefined;
      });

      var newEventToAdd = {
        payload: msg.payload
      }

      var payloadableEvents = _.flatten(_.map(eventSet.toArray(), (e) => { return e.payload }));

      if(eventSet.add(newEventToAdd)) {
        newEventToAdd.payload = _.filter(newEventToAdd.payload, (elem) => { 
          return !_.findWhere(payloadableEvents, elem) 
        });

        if(newEventToAdd.payload.length > 0)
          node.send(newEventToAdd);

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
