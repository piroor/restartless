/**
 * @fileOverview Main module for restartless addons
 * @author       SHIMODA "Piro" Hiroshi
 * @version      2
 *
 * @license
 *   The MIT License, Copyright (c) 2010 SHIMODA "Piro" Hiroshi.
 *   https://github.com/piroor/restartless/blob/master/license.txt
 * @url http://github.com/piroor/restartless
 */

dump('main.js loaded\n');

/**
 * load() works like Components.utils.import(). EXPORTED_SYMBOLS
 * in loaded scripts are exported to the global object of this script.
 */
load('lib/jsdeferred');
load('lib/WindowManager');
// this.import() also available instead of load(), as an alias.
// Note: don't use simply "import()" without the prefix "this.",
// because the keyword "import" will be a reserved word in future.
// https://developer.mozilla.org/en/JavaScript/Strict_mode#Paving_the_way_for_future_ECMAScript_versions
this.import('config');

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
				.get(resolve('locale/messages.properties'));
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

	var result = doAndWait(function(aContinuation) {
			// You can do an asynchronus shutdown
			// in another event loop. Until you call
			// the continuation function, doAndWait()
			// stops the main event loop. If you give
			// any argument to the continuation function,
			// then it becomes the returned value of
			// doAndWait() itself.
			aContinuation('OK');
		});
	// result == 'OK'

	// free loaded symbols
	Deferred = void(0);
	WindowManager = void(0);
	timer = void(0);
	bundle = void(0);
}
