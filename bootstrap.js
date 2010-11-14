/**
 * @fileOverview Bootstrap code for restartless addons
 * @author       SHIMODA "Piro" Hiroshi
 * @version      1
 *
 * @description
 *   This provides ability to load a script file placed to "modules/main.js".
 *   Functions named "shutdown", defined in main.js and any imported script
 *   will be called when the addon is disabled or uninstalled (include
 *   updating).
 *
 * @license
 *   The MIT License, Copyright (c) 2010 SHIMODA "Piro" Hiroshi.
 *   http://www.cozmixng.org/repos/piro/restartless-addon/trunk/license.txt
 * @url http://www.cozmixng.org/repos/piro/restartless-addon/trunk/
 */

var _gImporter;

function _loadMain(aRoot, aReason)
{
	if (_gImporter)
		return;

	const IOService = Components.classes['@mozilla.org/network/io-service;1']
						.getService(Components.interfaces.nsIIOService);

	var importer, main;
	if (aRoot.isDirectory()) {
		importer = aRoot.clone();
		importer.append('components');
		importer.append('importer.js');
		importer = IOService.newFileURI(importer).spec;

		main = aRoot.clone();
		main.append('modules');
		main.append('main.js');
		main = IOService.newFileURI(main).spec;
	}
	else {
		let base = 'jar:'+IOService.newFileURI(aRoot).spec+'!/';
		importer = base + 'components/importer.js';
		main = base + 'modules/main.js';
	}

	_gImporter = {};
	Components.classes['@mozilla.org/moz/jssubscript-loader;1']
		.getService(Components.interfaces.mozIJSSubScriptLoader)
		.loadSubScript(importer, _gImporter);
	_gImporter.import(main);
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
	_gImporter.install(_reasonToString(aReason));
}

function startup(aData, aReason)
{
	_loadMain(aData.installPath, _reasonToString(aReason));
}

function shutdown(aData, aReason)
{
	if (!_gImporter) return;
	_gImporter.shutdown(_reasonToString(aReason));
	_gImporter = void(0);
}

function uninstall(aData, aReason)
{
	if (!_gImporter) return;
	_gImporter.uninstall(_reasonToString(aReason));
	_gImporter = void(0);
}
