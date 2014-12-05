
var assert = require('assert');
var createMiddleware = require('../index');

var redirectLinks = {
  iPhone: 'http://iphone',
  Android: 'http://android',
  Windows: 'http://windows'
};

var mixpanelOSProperty = {
  iPhone: 'iPhone OS',
  Android: 'Android',
  Windows: 'Windows Phone'
};

describe('link-bouncer middleware', function () {
  createTest('iPhone', 'Mozilla/5.0 (iPhone CPU iPhone OS 5_0_1 like Mac OS X)');
  createTest('Android', 'Mozilla/5.0 (Linux Android 4.0.4 Galaxy Nexus Build/IMM76B)');
  createTest('Windows', 'Windows Phone');

  function createTest(testName, userAgent) {
    it('should track share with ' + userAgent + ' source', function (done) {
      var tracked = false;
      var middleware = createMiddleware(track, redirectLinks);
      var senderID = 'abc';
      var req = createFakeRequest(userAgent, {s: senderID});
      var res = createFakeResponse(onEnd);
      middleware(req, res, function () {});

      function track(event, properties) {
        assert.equal(event, 'share link visited');
        assert.deepEqual(properties, {'sender_id':senderID, '$os':mixpanelOSProperty[testName]});
        tracked = true;
      }
      function onEnd() {
        var expectedHtml = expected(redirectLinks[testName]);
        assert.equal(res.status, 200);
        assert.ok(tracked);
        assert.equal(res.content, expectedHtml);
        done();
      }
    });
  }
});

function expected(targetUrl) {
  var html = '<!DOCTYPE html>\n\
<html>\n\
  <head>\n\
    <meta http-equiv="refresh" content="0; url={{:target_url}}" />\n\
    <!--\n\
    <meta property="og:title" content=""/>\n\
    <meta property="og:site_name" content=""/>\n\
    <meta property="og:description" content="">\n\
    <meta property="og:image" content=""/>\n\
    -->\n\
    <meta property="og:type" content="website"/>\n\
    <meta property="og:see_also" content="http://stocard.de"/>\n\
    <meta property="og:see_also" content="https://www.facebook.com/Stocard"/>\n\
    <meta property="og:see_also" content="https://www.facebook.com/StocardUK"/>\n\
\n\
  </head>\n\
  <body>\n\
    You are being forwarded automatically. Click:\n\
        <a href="{{:target_url}}">here</a>\n\
  </body>\n\
</html>\n';
  return html.replace(/{{:target_url}}/g, targetUrl);
}

function createFakeRequest(userAgent, query) {
  return {
    query: query,
    headers: {
      'user-agent': userAgent
    }
  };
}

function createFakeResponse(onEnd) {
  var that = {
    headers: [],
    status: /*over*/ 9000,
    content: '',
    writeHead: function(status, headers) {
      Object.keys(headers).forEach(function(key) {
        that.headers.push({
          key: key,
          value: headers[key]
        });
      });
      that.status = status;
    },
    write: function(content) {
      that.content = content;
    },
    send: function() {},
    end: onEnd,
  };
  return that;
}
