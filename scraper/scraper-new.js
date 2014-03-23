// scraper dependencies
var keywords = require("keyword-extractor"),
    htmlToText = require('html-to-text'),
    crawler = require('crawler').Crawler,
    extractor = require('article'),    
    request = require('request')
    events = require('events');
    async = require('async');

this.moduleName = 'scraper';
this.emitter = new events.EventEmitter;

var self = this;

var someFunction = function () {
  console.log('can you access me?');
  setInterval(function () {
    self.emitter.emit('done');
  }, 1000);
};

module.exports = {
  init: function (models) {
    self.models = models;
  },
  run: function () {
    console.log(self.moduleName, 'running');
    console.log(this);
    someFunction();
  },
  emitter: self.emitter
};