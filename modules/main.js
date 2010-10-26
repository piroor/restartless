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

function shutdown()
{
	WindowManager.getWindows(TYPE_BROWSER).forEach(function(aWindow) {
		/* sample: destructor for hello world */
		var doc = aWindow.document;
		var label = doc.getElementById('helloworld');
		label.parentNode.removeChild(label);
	});
}
