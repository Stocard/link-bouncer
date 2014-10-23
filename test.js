
var assert = require('assert');

var createMiddleware = require('./index');

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
  createTest('iPhone', 'Stocard/3.13 StocardHTTPClient iOS/8.0.2');
  createTest('Android', 'Stocard/3.7.2 StocardHTTPClient Android/4.1.2');
  createTest('Windows', 'Windows');

  function createTest(testName, userAgent) {
    it('should track share with ' + userAgent + ' source', function (done) {
      var tracked = false;
      var middleware = createMiddleware(track, redirectLinks);
      var senderID = 'abc';
      var req = createFakeRequest(userAgent, {s: senderID});
      var res = createFakeResponse(onSend);
      middleware(req, res);

      function track(event, properties) {
        assert.equal(event, 'share link visited');
        assert.deepEqual(properties, {'sender_id':senderID, '$os':mixpanelOSProperty[testName]});
        tracked = true;
      }
      function onSend(status) {
        assert.equal(status, 302);
        assert.ok(tracked);
        assert.deepEqual(res.headers, [{key: 'Location', value: redirectLinks[testName]}]);
        done();
      }
    });
  }
});

function createFakeRequest(userAgent, query) {
  return {
    query: query,
    headers: {
      'user-agent': userAgent
    }
  };
}

function createFakeResponse(onSend) {
  return {
    headers: [],
    header: function (key, value) {
      this.headers.push({key: key, value: value});
    },
    send: onSend
  }
}
