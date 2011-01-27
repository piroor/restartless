/**
 * @fileOverview Configuration dialog module for restartless addons
 * @author       SHIMODA "Piro" Hiroshi
 * @version      2
 *
 * @license
 *   The MIT License, Copyright (c) 2011 SHIMODA "Piro" Hiroshi.
 *   http://www.cozmixng.org/repos/piro/restartless-addon/trunk/license.txt
 * @url http://www.cozmixng.org/repos/piro/restartless-addon/trunk/
 */

load('WindowManager');
load('prefs');

const EXPORTED_SYMBOLS = ['config'];

/**
 * @class
 *   Provides features to manage custom configuration dialog.
 */
var config = {
	_configs : {},

	/**
	 * Opens a registered dialog bound to the given URI as a "non-modal"
	 * window. If there is existing window, then focus to it.
	 *
	 * @param {String} aURI
	 *   A URI which is bould to any configuration dialog.
	 *
	 * @returns {nsIDOMWindow}
	 *   The window object of the configuration dialog.
	 */
	open : function(aURI)
	{
		aURI = this._resolveResURI(aURI);
		if (!(aURI in this._configs))
			return null;

		var current = this._configs[aURI];

		if (current.openedWindow && !current.openedWindow.closed) {
			current.openedWindow.focus();
			return current.openedWindow;
		}

		current.openedWindow = Cc['@mozilla.org/embedcomp/window-watcher;1']
							.getService(Ci.nsIWindowWatcher)
							.openWindow(
								null,
								'data:application/vnd.mozilla.xul+xml,'+encodeURIComponent(
									'<?xml version="1.0"?>\n'+
									'<?xml-stylesheet href="chrome://global/skin/"?>\n'+
									current.source
								),
								'_blank',
								'chrome,titlebar,toolbar,centerscreen' +
								(prefs.getPref('browser.preferences.instantApply') ?
									',dialog=no' :
									''// ',modal'
								),
								null
							);
		current.openedWindow.addEventListener('load', function() {
			current.openedWindow.removeEventListener('load', arguments.callee, false);
			current.openedWindow._sourceURI = aURI;
			current.openedWindow.addEventListener('unload', function() {
				current.openedWindow.removeEventListener('unload', arguments.callee, false);
				current.openedWindow = null;
			}, false);
		}, false);
		return current.openedWindow;
	},

	/**
	 * Registers a source code of a XUL document for a configuration dialog
	 * to the given URI. It is used by open().
	 *
	 * @param {String} aURI
	 *   A URI which is the target URI. When the URI is loaded in a browser
	 *   window, then this system automatically opens a generated XUL window
	 *   from the source.
	 * @param {String} aSource
	 *   A source code of a XUL document for a configuration dialog. Typical
	 *   headers (<?xml version="1.0"?> and an <?xml-stylesheet?> for the
	 *   default theme) are automatically added.
	 */
	register : function(aURI, aSource)
	{
		this._configs[this._resolveResURI(aURI)] = {
			source       : aSource,
			openedWindow : null
		};
	},

	/**
	 * Unregisters a registeed dialog for the given URI.
	 *
	 * @param {String} aURI
	 *   A URI which have a registered dialog.
	 */
	unregister : function(aURI)
	{
		delete this._configs[this._resolveResURI(aURI)];
	},

	/**
	 * Unregisters a default value for the preference.
	 *
	 * @param {String} aKey
	 *   A key of preference.
	 * @param {nsIVariant} aValue
	 *   The default value. This must be a string, integer, or boolean.
	 */
	setDefault : function(aKey, aValue)
	{
		prefs.setDefaultPref(aKey, aValue);
	},

	observe : function(aSubject, aTopic, aData)
	{
		var uri = this._resolveResURI(aSubject.location.href);
		if (!(uri in this._configs))
			return;
		var docShell = aSubject.top
						.QueryInterface(Ci.nsIInterfaceRequestor)
						.getInterface(Ci.nsIWebNavigation)
						.QueryInterface(Ci.nsIDocShell);
		var parent = docShell
						.QueryInterface(Ci.nsIDocShellTreeNode)
						.QueryInterface(Ci.nsIDocShellTreeItem)
						.parent;
		if (parent) {
			parent = parent
						.QueryInterface(Ci.nsIWebNavigation)
						.document
						.defaultView;
			let tabs;
			if (
				parent.gBrowser &&
				(tabs = parent.gBrowser.mTabContainer.childNodes) &&
				(
					tabs.length == 1 ||
					!Array.slice(tabs)
						.some(function(aTab) {
							if (aTab.linkedBrowser.docShell == docShell) {
								parent.gBrowser.removeTab(aTab);
								return true;
							}
							return false;
						})
				)
				) {
				parent.setTimeout('window.close();', 0);
			}
		}
		else {
			aSubject.setTimeout('window.close();', 0);
		}
		this.open(uri);
	},

	_resolveResURI : function(aURI)
	{
		if (aURI.indexOf('resource:') == 0)
			return ResProtocolHandler.resolveURI(IOService.newURI(aURI, null, null));
		return aURI;
	}
};


var IOService = Cc['@mozilla.org/network/io-service;1']
						.getService(Ci.nsIIOService);
var ResProtocolHandler = IOService
						.getProtocolHandler('resource')
						.QueryInterface(Ci.nsIResProtocolHandler);

var ObserverService = Cc['@mozilla.org/observer-service;1']
						.getService(Ci.nsIObserverService);
ObserverService.addObserver(config, 'chrome-document-global-created', false);
ObserverService.addObserver(config, 'content-document-global-created', false);

function shutdown()
{
	WindowManager.getWindows(null).forEach(function(aWindow) {
		if (aWindow._sourceURI && aWindow._sourceURI in config._configs)
			aWindow.close();
	});
	ObserverService.removeObserver(config, 'chrome-document-global-created');
	ObserverService.removeObserver(config, 'content-document-global-created');

	ObserverService = void(0);
	IOService = void(0);
	ResProtocolHandler = void(0);

	WindowManager = void(0);
	config._configs = void(0);
	config._windows = void(0);
	config = void(0);
}
