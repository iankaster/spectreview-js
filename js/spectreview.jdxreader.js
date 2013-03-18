(function ( SpectreView, $, undefined ) {

	SpectreView.Type = {
		UNKNOWN : 0,
		INFRARED_SPECTRUM : 1,
		NMR_SPECTRUM_13C : 2,
		NMR_SPECTRUM_1H : 3
	}

	SpectreView.JdxReader = function () {

		var raw;
		var metaData;
		var xyData;
		var points;
		
		var pointsInTransmittance, 
			pointsInAbsorbance, 
			integrationPoints,
			pointsInHz,
			pointsInPpm;
			
		this.load = function (data) {
			raw = data;
		
			parseMetaData();
			processMetaData();
			
			parseXyData();
			processXyData();
		}
		
		this.getType = function () {
			var dataType = metaData['DATA TYPE'].toUpperCase();
			var observerNucleus = metaData['.OBSERVE NUCLEUS'];
		
			switch (true) {
				case dataType == 'INFRARED SPECTRUM':
					return SpectreView.Type.INFRARED_SPECTRUM;
					
				case dataType == 'NMR SPECTRUM' && observerNucleus == '1H':
					return SpectreView.Type.NMR_SPECTRUM_1H;
				
				case dataType == 'NMR SPECTRUM' && observerNucleus == '13C':
					return SpectreView.Type.NMR_SPECTRUM_13C;
					
				default:
					return SpectreView.Type.UNKNOWN;
			}
		}
		
		this.getPoints = function () {
			return points;
		}
		
		this.getPointsInTransmittance = function () {
			if (!pointsInTransmittance) {
				if (metaData['YUNITS'] == 'ABSORBANCE') {
					pointsInTransmittance = [];

					$.each(points, function (index, point) {
						pointsInTransmittance.push([point[0], Math.pow(10, -1 * point[1])])
					});
				}
				else if (metaData['YUNITS'] == 'TRANSMITTANCE') {
					pointsInTransmittance = points;
				}
			}
			
			return pointsInTransmittance;
		}
			
		this.getPointsInAbsorbance = function () {
			if (!pointsInAbsorbance) {
				if (metaData['YUNITS'] == 'TRANSMITTANCE') {
					pointsInAbsorbance = [];
				
					$.each(points, function (index, point) {
						pointsInAbsorbance.push([point[0], point[1] == 0 ? 0 : Math.log(1 / Math.abs(point[1])) / Math.LN10])
					});
				}
				else if (metaData['YUNITS'] == 'ABSORBANCE') {
					pointsInAbsorbance = points;
				}
			}
			
			return pointsInAbsorbance;
		}
		
		this.getIntegrationPoints = function () {
			if (!integrationPoints) {
				// TODO: may need to add an additional check against metaData['INSTRUMENTAL PARAMETERS'] ??
				if (metaData['.OBSERVE NUCLEUS'] == '1H') {
					integrationPoints = [];
					
					var value = Math.abs(metaData['MAXY'] - metaData['MINY']) * 0.15;
					var threshold = Math.abs(metaData['MAXY'] - metaData['MINY']) * 0.05;
					
					$.each(points, function (index, point) {
						if (point[1] > threshold) {
							value += point[1] * 0.025;
						}
						
						integrationPoints.push([point[0], value]);
					});
				}
			}
			
			return integrationPoints;
		}
		
		this.getPointsInHz = function () {
			if (!pointsInHz) {
				if (metaData['XUNITS'] == 'PPM') {
					pointsInHz = [];
					
					$.each(points, function (index, point) {
						pointsInHz.push([point[0] * metaData['.OBSERVE FREQUENCY'], point[1]]);
					});
				}
				else if (metaData['XUNITS'] == 'HZ') {
					pointsInHz = points;
				}
			}
			
			return pointsInHz;
		}
		
		this.getPointsInPpm = function () {
			if (!pointsInPpm) {
				if (metaData['XUNITS'] == 'HZ') {
					pointsInPpm = [];
					
					$.each(points, function (index, point) {
						pointsInPpm.push([point[0] / metaData['.OBSERVE FREQUENCY'], point[1]]);
					});
				}
				else if (metaData['XUNITS'] == 'PPM') {
					pointsInPpm = points;
				}
			}
			
			return pointsInPpm;
		}
		
		function parseMetaData () {
			// TODO: update this pattern to exclude trailing white space
			var pattern = /^##(.*)=\s*(.*)$/igm,
				match;
			
			metaData = {};
			while ( match = pattern.exec(raw) )
				metaData[match[1]] = match[2];
		}
		
		function processMetaData () {
			metaData['XFACTOR'] = parseFloat(metaData['XFACTOR']);
			metaData['YFACTOR'] = parseFloat(metaData['YFACTOR']);
			metaData['LASTX'] = parseFloat(metaData['LASTX']);
			metaData['FIRSTX'] = parseFloat(metaData['FIRSTX']);
			metaData['NPOINTS'] = parseFloat(metaData['NPOINTS']);
			metaData['MAXY'] = parseFloat(metaData['MAXY']);
			metaData['MINY'] = parseFloat(metaData['MINY']);
			metaData['.OBSERVE FREQUENCY'] = parseFloat(metaData['.OBSERVE FREQUENCY']);
		
			metaData['DELTAX'] = metaData['DELTAX'] ? parseFloat(metaData['DELTAX']) : ( metaData['LASTX'] - metaData['FIRSTX'] ) / ( metaData['NPOINTS'] - 1 );
		}
		
		function parseXyData () {
			var pattern = /^##XYDATA=(.*)$\n([\s\S]*)^##END=.*$/igm;
			var match = pattern.exec(raw);
			
			xyData = match[2].split('\n');
		}
		
		function processXyData () {
			points = [];

			$.each(xyData, function (index, line) {
				var tokens = splitLine(line);
				
				tokens = processLine(tokens);
				
				var x = tokens.splice(0, 1) * metaData['XFACTOR'];
				
				$.each(tokens, function (index, token) {
					var y = token * metaData['YFACTOR'];
					
					points.push([x, y]);
					x += metaData['DELTAX'];
				});
			});
		}
		
		this.splitLine = function (line) {
			var pattern = /(-?[\d\.]+|[a-z@%])[\s\+]*/ig,
				match;
			
			var tokens = []
			while ( match = pattern.exec(line) )
				tokens.push(match[1]);
				
			return tokens;
		}
		
		this.processLine = function (tokens) {
			tokens = processDuplication(tokens);
			tokens = processSqueeze(tokens);
			tokens = processDifference(tokens);
			
			return tokens;
		}
		
		function processDuplication (tokens) {
			var pattern = /^[S-Zs]$/,
				decompressed = [];
			
			$.each(tokens, function (index, token) {
				switch (true) {
					case pattern.test(token):
						var duplicate = tokens[index - 1];
						var times = token == 's' ? 9 : token.charCodeAt(0) - 82;
					
						for (var i = 1; i < times; i++)
							decompressed.push(duplicate);
							
						break;
					
					default:
						decompressed.push(token);
				}
			});
			
			return decompressed;
		}
		
		function processSqueeze (tokens) {
			var positivePattern = /^[A-I]/,
				negativePattern = /^[a-i]/,
				decompressed = [];
				
			for (var index = 0; index < tokens.length; index++) {
				var token = tokens[index];
				
				switch (true) {
					case token == '@':
						decompressed.push(0);
						break;
					
					case positivePattern.test(token):
						var value = token.charCodeAt(0) - 64;
						
						if (!isNaN(tokens[index + 1])) {
							value = parseFloat(value.toString() + tokens[++index]);
						}
						
						decompressed.push(value);
						break;
						
					case negativePattern.test(token):
						var value = 96 - token.charCodeAt(0);
						
						if (!isNaN(tokens[index + 1])) {
							value = parseFloat(value.toString() + tokens[++index]);
						}
						
						decompressed.push(value);
						break;
					
					default:
						decompressed.push(token);
					}
			}
			
			return decompressed;
		}
		
		function processDifference (tokens) {
			var positiveDifPattern = /^[J-R]/,
				negativeDifPattern = /^[j-r]/,
				decompressed = [];

			for (var index = 0; index < tokens.length; index++) {
				var token = tokens[index];
			
				switch (true) {
					case token == '%':
						decompressed.push(decompressed[decompressed.length - 1]);
						break;
						
					case positiveDifPattern.test(token):
						var base = decompressed[decompressed.length - 1];
						var difference = token.charCodeAt(0) - 73;
						
						if (!isNaN(tokens[index + 1])) {
							difference = parseFloat(difference.toString() + tokens[++index]);
						}
						
						decompressed.push(base + difference);
						break;
						
					case negativeDifPattern.test(token):
						var base = decompressed[decompressed.length - 1];
						var difference = token.charCodeAt(0) - 105;

						if (!isNaN(tokens[index + 1])) {
							difference = parseFloat(difference.toString() + tokens[++index]);
						}
						
						decompressed.push(base - difference);
						break;
						
					default:
						decompressed.push(token);						
				}
			}
			
			return decompressed;
		}			
	}

}( window.SpectreView = window.SpectreView || {}, jQuery));