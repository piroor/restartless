load('lib/config.html');

config.setDefault('extensions.restartless@piro.sakura.ne.jp.testBoolean', true);

var bundle = require('lib/locale')
				.get(location.href.replace(/[^\/]+$/, '')+
						'locale/messages.properties');

config.register('resource://restartless/modules/lib/config.html', <>

<prefwindow id="restartless-config"
	xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
	title={bundle.getString('config.title')}>

	<prefpane id="prefpane-general" label="general">
		<preferences>
			<preference id="testBoolean"
				name="extensions.restartless@piro.sakura.ne.jp.testBoolean"
				type="bool"/>
		</preferences>


		<checkbox id="testBoolean-checkbox"
			label={bundle.getString('config.testBoolean')}
			preference="testBoolean"/>

	</prefpane>

</prefwindow>

</>.toXMLString());
