/**
 * @fileOverview Bootstrap code for restartless addons
 * @author       SHIMODA "Piro" Hiroshi
 * @version      1
 *
 * @description
 *   This provides ability to load a script file placed to "modules/main.js".
 *   Functions named "shutdown", defined in main.js and any loaded script
 *   will be called when the addon is disabled or uninstalled (include
 *   updating).
 *
 * @license
 *   The MIT License, Copyright (c) 2010-2011 SHIMODA "Piro" Hiroshi.
 *   https://github.com/piroor/restartless/blob/master/license.txt
 * @url http://github.com/piroor/restartless
 */

var _gLoader;

function _loadMain(aRoot, aReason)
{
	if (_gLoader)
		return;

	const IOService = Components.classes['@mozilla.org/network/io-service;1']
						.getService(Components.interfaces.nsIIOService);

	var loader, main;
	if (aRoot.isDirectory()) {
		loader = aRoot.clone();
		loader.append('components');
		loader.append('loader.js');
		loader = IOService.newFileURI(loader).spec;

		main = aRoot.clone();
		main.append('modules');
		main.append('main.js');
		main = IOService.newFileURI(main).spec;
	}
	else {
		let base = 'jar:'+IOService.newFileURI(aRoot).spec+'!/';
		loader = base + 'components/loader.js';
		main = base + 'modules/main.js';
	}

	_gLoader = {};
	Components.classes['@mozilla.org/moz/jssubscript-loader;1']
		.getService(Components.interfaces.mozIJSSubScriptLoader)
		.loadSubScript(loader, _gLoader);
	_gLoader.load(main);
}

function _reasonToString(aReason)
{
	switch (aReason)
	{
		case APP_STARTUP: return 'APP_STARTUP';
		case APP_SHUTDOWN: return 'APP_SHUTDOWN';
		case ADDON_ENABLE: return 'ADDON_ENABLE';
		case ADDON_DISABLE: return 'ADDON_DISABLE';
		case ADDON_INSTALL: return 'ADDON_INSTALL';
		case ADDON_UNINSTALL: return 'ADDON_UNINSTALL';
		case ADDON_UPGRADE: return 'ADDON_UPGRADE';
		case ADDON_DOWNGRADE: return 'ADDON_DOWNGRADE';
	}
	return aReason;
}

/**
 * handlers for bootstrap
 */

function install(aData, aReason)
{
	_loadMain(aData.installPath, aReason);
	_gLoader.install(_reasonToString(aReason));
}

function startup(aData, aReason)
{
	_loadMain(aData.installPath, _reasonToString(aReason));
}

function shutdown(aData, aReason)
{
	if (!_gLoader) return;
	_gLoader.shutdown(_reasonToString(aReason));
	_gLoader = void(0);
}

function uninstall(aData, aReason)
{
	if (!_gLoader) return;
	_gLoader.uninstall(_reasonToString(aReason));
	_gLoader = void(0);
}
