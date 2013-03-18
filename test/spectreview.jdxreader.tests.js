var jdxReader;

module('SpectreView.JdxReader', {
	setup: function () {
		jdxReader = new SpectreView.JdxReader();
	}
});

test('splitLine', function () {
	var line = '599.860@VKT%TLkj%J%KLJ%njKjL%kL%jJULJ%kLK1%lLMNPNPRLJ0QTOJ1P';
	var expected = ['599.860','@','V','K','T','%','T','L','k','j','%','J','%','K','L','J','%','n','j','K','j','L','%','k','L','%','j','J','U','L','J','%','k','L','K','1','%','l','L','M','N','P','N','P','R','L','J','0','Q','T','O','J','1','P'];
	
	var tokens = jdxReader.splitLine(line);
	
	deepEqual(tokens, expected);
});

test('processLine', function () {
	var tokens = ['599.860','@','V','K','T','%','T','L','k','j','%','J','%','K','L','J','%','n','j','K','j','L','%','k','L','%','j','J','U','L','J','%','k','L','K','1','%','l','L','M','N','P','N','P','R','L','J','0','Q','T','O','J','1','P'];
	var expected = ['599.860',0,0,0,0,2,4,4,4,7,5,4,4,5,5,7,10,11,11,6,5,7,6,9,9,7,10,10,9,10,11,12,15,16,16,14,17,38,38,35,38,42,47,54,59,66,75,78,88,96,104,110,121,128];
	
	var values = jdxReader.processLine(tokens);
	
	deepEqual(values, expected);
});

