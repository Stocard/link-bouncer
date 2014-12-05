
var locale = require('locale');
var mustache = require('mustache');
var fs = require('fs');

module.exports = createMiddleware;

function createMiddleware(trackFn, redirectLinks) {
  // init response template
  var bouncerTemplate = fs.readFileSync('./bouncer-template.html', 'utf8');
  mustache.parse(bouncerTemplate);

  return trackShareClick;

  function trackShareClick(req, res, next) {
    var analyticsDict = {};

    // track sender_id
    var sender_id = req.query.s;
    if (sender_id) {
      analyticsDict['sender_id'] = sender_id;
    }
    // track languages
    if (req.headers['accept-language']) {
        var userLocale = new locale.Locales(req.headers['accept-language']).best();
        analyticsDict['language code'] = userLocale.language;
        if (userLocale.country) {
          analyticsDict['mp_country_code'] = userLocale.country;
        }
    }
    // identify bounce url
    var target_url = 'http://www.stocardapp.com';
    if (req.headers['user-agent'].indexOf('Android') > -1) {
      target_url = redirectLinks.Android;
      analyticsDict['$os'] = 'Android';
    } else if (req.headers['user-agent'].indexOf('iPhone') > -1) {
      target_url = redirectLinks.iPhone;
      analyticsDict['$os'] = 'iPhone OS';
    } else if (req.headers['user-agent'].indexOf('Windows Phone') > -1) {
      target_url = redirectLinks.Windows;
      analyticsDict['$os'] = 'Windows Phone';
    }
    // generate response template
    var values = {
      'target_url' : target_url
    };
    var content = mustache.render(bouncerTemplate, values);

    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(content),
      'Content-Type': 'text/html'
    });
    // track and bounce
    trackFn('share link visited', analyticsDict);
    res.write(content);
    res.end();
    if (next) {
      next();
    }
  }
}
