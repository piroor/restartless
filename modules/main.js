/**
 * @fileOverview Main module for restartless addons
 * @author       SHIMODA "Piro" Hiroshi
 * @version      1
 *
 * @license
 *   The MIT License, Copyright (c) 2010 SHIMODA "Piro" Hiroshi.
 *   https://github.com/piroor/restartless/blob/master/license.txt
 * @url http://github.com/piroor/restartless
 */

dump('main.js loaded\n');

/**
 * load() works like Components.utils.load(). EXPORTED_SYMBOLS
 * in loaded scripts are exported to the global object of this script.
 */
load('lib/jsdeferred');
load('lib/WindowManager');

/**
 * Timer sample.
 */
var timer = require('lib/jstimer'); // CommonJS style require() also available!
timer.setTimeout(function() {
	dump('DELAYED CODE DONE\n');
}, 500);

/**
 * JSDeferred sample.
 */
Deferred.next(function() {
	dump('DEFERRED CODE DONE\n');
});

/**
 * Localized messages sample.
 */
var bundle = require('lib/locale')
				.get(location.href.replace(/[^\/]+$/, '')+
						'locale/messages.properties');
dump(bundle.getString('message')+'\n');


/**
 * Sample code for addons around browser windows.
 */
const TYPE_BROWSER = 'navigator:browser';

function handleWindow(aWindow)
{
	var doc = aWindow.document;
	if (doc.documentElement.getAttribute('windowtype') != TYPE_BROWSER)
		return;

	/* sample: hello world */
	var range = doc.createRange();
	range.selectNodeContents(doc.documentElement);
	range.collapse(false);

	var fragment = range.createContextualFragment(<![CDATA[
			<label id="helloworld" value="hello, world!"
				style="background: white; color: blue;"/>
		]]>.toString());
	range.insertNode(fragment);

	range.detach();
}

WindowManager.getWindows(TYPE_BROWSER).forEach(handleWindow);
WindowManager.addHandler(handleWindow);

/**
 * A handler for shutdown event. This will be called when the addon
 * is disabled or uninstalled (include updating).
 */
function shutdown()
{
	WindowManager.getWindows(TYPE_BROWSER).forEach(function(aWindow) {
		/* sample: destructor for hello world */
		var doc = aWindow.document;
		var label = doc.getElementById('helloworld');
		label.parentNode.removeChild(label);
	});

	// free loaded symbols
	Deferred = void(0);
	WindowManager = void(0);
	timer = void(0);
	bundle = void(0);
}
