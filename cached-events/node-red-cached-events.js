module.exports = function(RED) {

  function CachedEvents(config) {
    RED.nodes.createNode(this,config);
    this.file = config.file;
  }

  RED.nodes.registerType("cached-events", CachedEvents);
}
