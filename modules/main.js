/**
 * @fileOverview Main module for restartless addons
 * @author       YUKI "Piro" Hiroshi
 * @version      4
 *
 * @license
 *   The MIT License, Copyright (c) 2015 YUKI "Piro" Hiroshi.
 *   https://github.com/piroor/restartless/blob/master/license.txt
 * @url http://github.com/piroor/restartless
 */

dump('main.js loaded\n');

/**
 * load() works like Components.utils.import(). EXPORTED_SYMBOLS
 * in loaded scripts are exported to the global object of this script.
 */
load('lib/WindowManager');
load('lib/ToolbarItem');
load('lib/KeyboardShortcut');
load('lib/here');
load('lib/easyTemplate');
load('lib/prefs');
// this.import() also available instead of load(), as an alias.
// Note: don't use simply "import()" without the prefix "this.",
// because the keyword "import" will be a reserved word in future.
// https://developer.mozilla.org/en/JavaScript/Strict_mode#Paving_the_way_for_future_ECMAScript_versions
this.import('config');

var http = require('lib/http');

/**
 * Localized messages sample.
 */
var bundle = require('lib/locale')
				.get(location.href+'/../locale/messages.properties');
dump(bundle.getString('message')+'\n');


/**
 * Preferences example
 */
var myPrefs = prefs.createStore('extensions.restartless@piro.sakura.ne.jp.');
//             property name, default value, preference key (optional)
myPrefs.define('booleanProp', false, 'testBoolean2');
myPrefs.define('integerProp', 64,    'testInteger2');
dump('current boolean value is: '+myPrefs.booleanProp+'\n');


/**
 * Sample code for addons around browser windows.
 */
const TYPE_BROWSER = 'navigator:browser';

var global = this;
function handleWindow(aWindow)
{
	var doc = aWindow.document;
	if (doc.documentElement.getAttribute('windowtype') != TYPE_BROWSER)
		return;

	/* sample: hello world */
	var range = doc.createRange();
	range.selectNodeContents(doc.documentElement);
	range.collapse(false);

	var fragment = range.createContextualFragment(here(/*
			<label id="helloworld" value="hello, world!"
				style="background: white; color: blue;"/>
		*/));
	range.insertNode(fragment);

	range.detach();

	/* sample: customizable toolbar button */
	var button = ToolbarItem.create(
		easyTemplate.apply(here(/*
		<toolbarbutton id="restartless-test-button">
			<label value={{ JSON.stringify(bundle.getString('message')) }}/>
		</toolbarbutton>
		*/), global),
		doc.getElementById('nav-bar'),
		{ // options
			onInit : function() {
				console.log('restartless-test-button: inserted ' + this.node);
			},
			onDestroy : function() {
				console.log('restartless-test-button: going to be removed: ' + this.node);
			}
		}
	);
	button.addEventListener('command', function(aEvent) {
		var uri = aWindow.content.location.href;
		http.getAsBinary(uri)
			.next(function(aResponse) {
				aWindow.alert([
					uri,
					aResponse.status,
					aResponse.getAllResponseHeaders(),
					aResponse.responseText.substring(0, 40) + '...'
				].join('\n'));
			})
			.error(function(aError) {
				aWindow.alert(aError);
			});
	});

	/* sample: keyboard shortcut */
	KeyboardShortcut.create({
		shortcut  : 'Ctrl-F2',
		oncommand : 'alert("hello!");'
	}, doc.getElementById('mainKeyset'));
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
	WindowManager = undefined;
	ToolbarItem = undefined;
	KeyboardShortcut = undefined;
	bundle = undefined;
	here = undefined;
	easyTemplate = undefined;
	http = undefined;
	global = undefined;
}
