var scraper = require('./scraper-new');

scraper.emitter.on('done', function () {
  console.log('scraper is done');
});

scraper.init({a: 'Model'});
scraper.run();