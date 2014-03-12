/**
 * @fileOverview XMLHttpRequest wrapper module for restartless addons
 * @author       YUKI "Piro" Hiroshi
 * @version      2
 * @description  
 *
 * @license
 *   The MIT License, Copyright (c) 2014 YUKI "Piro" Hiroshi.
 *   https://github.com/piroor/restartless/blob/master/license.txt
 * @url http://github.com/piroor/restartless
 */

var EXPORTED_SYMBOLS = [
  'get',
  'post',
  'RESPONSE_CONTENT_TYPE'
];

var RESPONSE_CONTENT_TYPE = 'X-Override-Content-Type';

var Deferred = require('jsdeferred').Deferred;

function get(aURI, aHeaders) {
  return sendRequest({
    method:  'GET',
    uri:     aURI,
    headers: aHeaders
  });
}

function post(aURI, aPostData, aHeaders) {
  return sendRequest({
    method:   'POST',
    uri:      aURI,
    headers:  aHeaders,
    postData: aPostData
  });
}

function sendRequest(aParams) {
  var deferred = new Deferred();

  var method   = (aParams.method || 'GET').toUpperCase();
  var uri      = aParams.uri || null;
  var headers  = aParams.headers || {};
  var postData = aParams.postData || null;

  if (!uri)
    throw new Error('no URL');

  var request;
  var listener = function(aEvent) {
    switch (aEvent.type) {
      case 'load':
      case 'error':
        break;
      default:
        return;
    }
    request.removeEventListener('load', listener, false);
    request.removeEventListener('error', listener, false);

    if (request.status == 200) {
      deferred.call(request);
    } else {
      try {
        deferred.fail(new Error(JSON.stringify({
          statusCode: request.status,
          body:       request.responseText,
          event:      {
            type:   aEvent.type,
            detail: aEvent.detail
          }
        })));
      } catch(error) {
        deferred.fail(new Error(JSON.stringify({
          error: {
            name:    error.name,
            message: error.message,
            error:   error
          },
          event: {
            type:   aEvent.type,
            detail: aEvent.detail
          }
        })));
      }
    }
  };

  Deferred.next(function() {
    request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
                .createInstance(Ci.nsIXMLHttpRequest)
                .QueryInterface(Ci.nsIDOMEventTarget);
    request.open(method, uri, true);
    request.addEventListener('load', listener, false);
    request.addEventListener('error', listener, false);
    Object.keys(headers).forEach(function(aKey) {
      switch (aKey) {
        case RESPONSE_CONTENT_TYPE:
          request.overrideMimeType(headers[aKey]);
          break;

        default:
          request.setRequestHeader(aKey, headers[aKey]);
          break;
      }
    });
    request.send(postData);
  });

  return deferred;
}
