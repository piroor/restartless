/**
 * @fileOverview XMLHttpRequest wrapper module for restartless addons
 * @author       YUKI "Piro" Hiroshi
 * @version      10
 * @description
 *   // get as a text
 *   http.get('http://.....',
 *            { 'X-Response-Content-Type': 'text/plain; charset=EUC-JP' })
 *       .next(function(aResponse) {
 *         console.log(aResponse.responseText);
 *       });
 *   
 *   // get as a JSON
 *   http.getAsJSON('http://.....')
 *       .next(function(aResponse) {
 *         var body = aResponse.response;
 *         console.log(function);
 *       });
 *   
 *   // get as a binary
 *   http.getAsBinary('http://.....')
 *       .next(function(aResponse) {
 *         // arraybyffer = aResponse.response;
 *         var bodyBytesArray = aResponse.responseText;
 *         var bodyBase64 = btoa(bodyBytesArray);
 *         console.log(bodyBase64);
 *       });
 *   // See also: https://developer.mozilla.org/docs/XMLHttpRequest/Sending_and_Receiving_Binary_Data
 *   
 *   http.postAsJSON('http://.....', { a: true, b: 29 })
 *       .next(function(aResponse) {
 *         var responseJSON = JSON.parse(aResponse.responseText);
 *       });
 *
 * @license
 *   The MIT License, Copyright (c) 2014 YUKI "Piro" Hiroshi.
 *   https://github.com/piroor/restartless/blob/master/license.txt
 * @url http://github.com/piroor/restartless
 */

var EXPORTED_SYMBOLS = [
  'get',
  'getAsJSON',
  'getAsBinary',
  'post',
  'postAsJSON',
  'RESPONSE_TYPE',
  'RESPONSE_CONTENT_TYPE'
];

var RESPONSE_TYPE         = 'X-Response-Type';
var RESPONSE_CONTENT_TYPE = 'X-Response-Content-Type';

var PSEUDO_HEADERS = [
  RESPONSE_TYPE,
  RESPONSE_CONTENT_TYPE
];

var Deferred = require('jsdeferred').Deferred;

function clone(aObject) {
  aObject = aObject || {};
  var cloned = {};
  Object.keys(aObject).forEach(function(aKey) {
    cloned[aKey] = aObject[aKey];
  });
  return cloned;
}


function get(aURI, aHeaders) {
  return sendRequest({
    method:  'GET',
    uri:     aURI,
    headers: aHeaders
  });
}

function getAsJSON(aURI, aHeaders) {
  var headers = clone(aHeaders);
  headers[RESPONSE_TYPE] = 'json';
  return get(aURI, headers);
}

function getAsBinary(aURI, aHeaders) {
  var headers = clone(aHeaders);
  headers[RESPONSE_TYPE] = 'arraybuffer';
  return get(aURI, headers);
}

function post(aURI, aPostData, aHeaders) {
  return sendRequest({
    method:   'POST',
    uri:      aURI,
    headers:  aHeaders,
    postData: aPostData
  });
}

function postAsJSON(aURI, aPostData, aHeaders) {
  var headers = clone(aHeaders);
  var postData = JSON.stringify(aPostData);
  headers['Content-Type'] = 'application/json';
  return post(aURI, aPostData, headers);
}


function ArrayBufferRespone(aResponse) {
  this._raw = aResponse;
  this._init();
}
ArrayBufferRespone.prototype = {
  _init: function() {
    for (let key in this._raw) {
      if (key in this)
        continue;
      this._bind(key);
    }
  },
  _bind: function(aName) {
    if (typeof this._raw[aName] == 'function') {
      this[aName] = this._raw[aName].bind(this._raw);
    } else {
      this.__defineGetter__(aName, function() {
        return this._raw[aName];
      });
    }
  },
  get responseText() {
    var bytesArray = ''
    var bytes = new Uint8Array(this._raw.response);
    for (let i = 0, maxi = bytes.byteLength; i < maxi; i++) {
      bytesArray += String.fromCharCode(bytes[i]);
    }
    return bytesArray;
  },
  get responseXML() {
    // accessing to the property raises InvalidStateError, so I have to define this staticly
    return this._raw.responseXML;
  }
};

function sendRequest(aParams) {
  var deferred = new Deferred();

  var method   = (aParams.method || 'GET').toUpperCase();
  var uri      = aParams.uri || null;
  var headers  = aParams.headers || {};
  var postData = aParams.postData || null;
  var responseType = aParams.responseType || '';
  var responseContentType = aParams.responseContentType || null;

  if (headers[RESPONSE_TYPE])
    responseType = headers[RESPONSE_TYPE];
  if (headers[RESPONSE_CONTENT_TYPE])
    responseContentType = headers[RESPONSE_CONTENT_TYPE];

  if (!uri)
    throw new Error('no URL');

  var cleanup = function() {
    request.removeEventListener('load', listener, false);
    request.removeEventListener('error', listener, false);
    deferred.canceller = function() {};
    deferred = listener = request = undefined;
  };

  var request;
  var listener = function(aEvent) {
    if (!request || !listener)
      return;

    switch (aEvent.type) {
      case 'load':
      case 'error':
        break;
      default:
        return;
    }

    var response = request;
    if (responseType == 'arraybuffer')
      response = new ArrayBufferRespone(response)

    deferred.call(response);
    cleanup();
    response = undefined;
  };

  Deferred.next(function() {
    request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
                .createInstance(Ci.nsIXMLHttpRequest)
                .QueryInterface(Ci.nsIDOMEventTarget);
    request.open(method, uri, true);
    if (responseType)
      request.responseType = responseType;
    if (responseContentType)
      request.overrideMimeType(responseContentType);
    Object.keys(headers).forEach(function(aKey) {
      if (PSEUDO_HEADERS.indexOf(aKey) < 0)
        request.setRequestHeader(aKey, headers[aKey]);
    });
    request.addEventListener('load', listener, false);
    request.addEventListener('error', listener, false);

    deferred.canceller = function() {
      request.abort();
      cleanup();
    };

    if (postData &&
        typeof postData == 'object' &&
        !(postData instanceof Ci.nsISupports))
      postData = JSON.stringify(postData);

    if (typeof postData == 'string') {
      let postDataStream = Cc['@mozilla.org/io/string-input-stream;1']
                             .createInstance(Ci.nsIStringInputStream);
      postDataStream.data = postData;
      postData = postDataStream;
    }
    request.send(postData);
  }).error(function(aError) {
    deferred.fail(aError);
  });

  return deferred;
}
