/**
 * @fileOverview Locale module for restartless addons
 * @author       SHIMODA "Piro" Hiroshi
 * @version      1
 *
 * @license
 *   The MIT License, Copyright (c) 2010 SHIMODA "Piro" Hiroshi.
 *   http://www.cozmixng.org/repos/piro/restartless-addon/trunk/license.txt
 * @url http://www.cozmixng.org/repos/piro/restartless-addon/trunk/
 */

const EXPORTED_SYMBOLS = ['get'];

var gCache = {}
var get = function(aURI) {
		var locale = Application.prefs.getValue('general.useragent.locale', 'en-US');
		var uri = aURI;
		[
			aURI+'.'+locale,
			aURI+'.'+(locale.split('-')[0]),
			aURI+'.en-US',
			aURI+'.en'
		].some(function(aURI) {
			if (readFrom(aURI)) {
				uri = aURI;
				return true;
			}
			return false;
		});

		if (!(uri in gCache)) {
			gCache[uri] = new StringBundle(uri);
		}
		return gCache[uri];
	};

const IOService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
function readFrom(aURISpec)
{
	var stream;
	if (aURISpec.indexOf('file:') == 0) {
		const FileHandler = IOService.getProtocolHandler('file')
							.QueryInterface(Ci.nsIFileProtocolHandler);
		file = FileHandler.getFileFromURLSpec(aURISpec);
		stream = Cc['@mozilla.org/network/file-input-stream;1']
					.createInstance(Ci.nsIFileInputStream);
		try {
			stream.init(file, 1, 0, false); // open as "read only"
		}
		catch(ex) {
			return null;
		}
	}
	else {
		var channel = IOService.newChannelFromURI(IOService.newURI(aURISpec, null, null));
		stream = channel.open();
	}

	var fileContents = null;
	try {
		var converterStream = Cc['@mozilla.org/intl/converter-input-stream;1']
				.createInstance(Ci.nsIConverterInputStream);
		var buffer = stream.available();
		converterStream.init(stream, 'UTF-8', buffer,
			converterStream.DEFAULT_REPLACEMENT_CHARACTER);
		var out = { value : null };
		converterStream.readString(Math.min(2, stream.available()), out);
		converterStream.close();
		fileContents = out.value;
	}
	finally {
		stream.close();
	}

	return fileContents;
}


const Service = Cc['@mozilla.org/intl/stringbundle;1']
					.getService(Ci.nsIStringBundleService);

function StringBundle(aURI) 
{
	this._bundle = Service.createBundle(aURI);
}
StringBundle.prototype = {
	getString : function(aKey) {
		try {
			return this._bundle.GetStringFromName(aKey);
		}
		catch(e) {
		}
		return '';
	},
	getFormattedString : function(aKey, aArray) {
		try {
			return this._bundle.formatStringFromName(aKey, aArray, aArray.length);
		}
		catch(e) {
		}
		return '';
	},
	get strings() {
		return this._bundle.getSimpleEnumeration();
	}
};

/** A handler for bootstrap.js */
function shutdown()
{
	gCache = {};
	Service.flushBundles();
}
