/**
 * @fileOverview Bundled Startup service for restartless addons
 * @author       YUKI "Piro" Hiroshi
 * @version      2
 *
 * @license
 *   The MIT License, Copyright (c) 2015 YUKI "Piro" Hiroshi.
 *   https://github.com/piroor/restartless/blob/master/license.txt
 * @url http://github.com/piroor/restartless
 */

/** You must change ADDON_ID for your addon. */
const ADDON_ID = 'restartless@piro.sakura.ne.jp';
/** You must change CLASS_ID for your addon. If must be an UUID. */
const CLASS_ID = '{ea952e00-3b04-11e3-aa6e-0800200c9a66}';

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/Services.jsm');

/**
 * This component provides ability to load main code of a restartless
 * addon which is installed as a bundled module (distribution/bundles).
 */
function BundledService() { 
}
BundledService.prototype = {
	classDescription : ADDON_ID + '_BundledService', 
	contractID : '@'+ADDON_ID.split('@').reverse().join('/')+'/bundled;1',
	classID : Components.ID(CLASS_ID),
	_xpcom_categories : [
		{ category : 'profile-after-change', service : true }
	],
	QueryInterface : XPCOMUtils.generateQI([Ci.nsIObserver]),

	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'profile-after-change':
				Services.obs.addObserver(this, 'quit-application-granted', false);
				this.onStartup();
				return;

			case 'quit-application-granted':
				Services.obs.removeObserver(this, 'quit-application-granted');
				this.onShutdown();
				return;
		}
	},

	get root()
	{
		if (this._root !== undefined)
			return this._root;

		var chromeDirs = Services.dirsvc.get('XREExtDL', Ci.nsISimpleEnumerator);
		while (chromeDirs.hasMoreElements())
		{
			let chromeDir = chromeDirs.getNext().QueryInterface(Ci.nsILocalFile);
			if (chromeDir.isDirectory() && chromeDir.leafName == ADDON_ID)
				return this._root = chromeDir;
		}
	},

	get loader()
	{
		if (this._Loader !== undefined)
			this._Loader;

		this._Loader = {};
		let loader = this.root.clone();
		loader.append('components');
		loader.append('loader.js');
		Services.scriptloader.loadSubScript(Services.io.newFileURI(loader).spec, this._Loader);
		return this._Loader;
	},

	getVersion : function(aCallback)
	{
		const RDF = Cc['@mozilla.org/rdf/rdf-service;1'].getService(Ci.nsIRDFService);
		var installManifest = this.root.clone();
		installManifest.append('install.rdf');
		var uri = Services.io.newFileURI(installManifest);
		var datasource = RDF.GetDataSourceBlocking(uri.spec);
		var manifestResource = RDF.GetResource('urn:mozilla:install-manifest');
		var versionResource = RDF.GetResource('http://www.mozilla.org/2004/em-rdf#version');
		var timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
		var retryCount = 0;
		timer.init(function() {
			var versionValue = datasource.GetTarget(manifestResource, versionResource, true);
			if (versionValue) {
				timer.cancel();
				aCallback(versionValue.QueryInterface(Ci.nsIRDFLiteral).Value);
				return;
			}
			if (retryCount++ > 100)
				timer.cancel();
		}, 10, Ci.nsITimer.TYPE_REPEATING_SLACK);
	},

	onStartup : function()
	{
		this.getVersion((function(aVersion) {
			this.startupWithVersion(aVersion);
		}).bind(this));
	},
	startupWithVersion : function(aVersion)
	{
		this.loader.registerResource(ADDON_ID.split('@')[0]+'-resources', Services.io.newFileURI(this.root));

		var lastVersion;
		try {
			lastVersion = Services.prefs.getCharPref('extensions.'+ADDON_ID+'.restartless.lastVersion');
		}
		catch(e) {
		}

		var version = aVersion + ':' + this.root.lastModifiedTime;
		if (lastVersion != version) {
			Services.prefs.setCharPref('extensions.'+ADDON_ID+'.restartless.lastVersion', version);
			let install = this.root.clone();
			install.append('modules');
			install.append('install.js');
			if (install.exists()) {
				this.loader.load(Services.io.newFileURI(install).spec);
				this.loader.install(lastVersion ? 'ADDON_UPGRADE' : 'ADDON_INSTALL' );
			}
		}

		let main = this.root.clone();
		main.append('modules');
		main.append('main.js');
		this.loader.load(Services.io.newFileURI(main).spec);
	},
	onShutdown : function()
	{
		this._Loader.shutdown('APP_SHUTDOWN');
	}
};
var NSGetFactory = XPCOMUtils.generateNSGetFactory([BundledService]);
