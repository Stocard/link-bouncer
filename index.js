
var locale = require("locale");
var url = require('url');
var Mixpanel = require('Mixpanel');

module.exports = createMiddleware;

function createMiddleware(trackFn, redirectLinks) {
  return trackShareClick;

  function trackShareClick(req, res, next) {
    var analyticsDict = {};
    // compose analytics properties
    var sender_id = req.query.s;
    if (sender_id) {
      analyticsDict["sender_id"] = sender_id;
    }
    if (req.headers["accept-language"]) {
        var userLocale = new locale.Locales(req.headers["accept-language"]).best();
        analyticsDict["language code"] = userLocale.language;
        if (userLocale.country) {
            analyticsDict["mp_country_code"] = userLocale.country;
        }
    }

    // identify bounce url
    if (req.headers["user-agent"].indexOf("Android") > -1) {
        res.header("Location", redirectLinks.Android);
        analyticsDict["$os"] = "Android";
    } else if (req.headers["user-agent"].indexOf("iPhone") > -1) {
        res.header("Location", redirectLinks.iPhone);
        analyticsDict["$os"] = "iPhone OS";
    } else if (req.headers["user-agent"].indexOf("Windows Phone") > -1) {
        res.header("Location", redirectLinks.Windows);
        analyticsDict["$os"] = "Windows Phone";
    } else {
        res.header("Location", "http://www.stocardapp.com");
        analyticsDict["$os"] = "other";
    }
    
    // track and bounce
    trackFn("share link visited", analyticsDict);
    res.send(302);
    if (next) next();
  }
}
