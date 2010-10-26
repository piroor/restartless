import('lib/jsdeferred.js');
import('lib/WindowManager.js');

Deferred.next(function() {
	dump('MAIN MODULE IS LOADED\n');
});

const TYPE_BROWSER = 'navigator:browser';

function handleWindow(aWindow)
{
	var doc = aWindow.document;
	if (doc.documentElement.getAttribute('windowtype') != TYPE_BROWSER)
		return;

	/* something */
}

WindowManager.getWindows(TYPE_BROWSER).forEach(handleWindow);
WindowManager.addHandler(handleWindow);

function shutdown()
{
	WindowManager.getWindows(TYPE_BROWSER).forEach(function(aWindow) {
		/* something */
	});
}
