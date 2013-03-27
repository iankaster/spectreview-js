(function ( SpectreView, undefined ) {

	SpectreView.Jdx = {};

	SpectreView.Jdx.Decompressor = function (xFactor, yFactor, deltaX) {
		var self = this;

		this.decompress = function (line) {
			var tokens = self.split(line);
			tokens = self.process(tokens);

			var points = self.compute(tokens);

			return points;
		};

		this.compute = function (tokens) {
			var x = tokens.splice(0, 1) * xFactor;

			var points = [];
			for (var i = 0, length = tokens.length; i < length; i++) {
				var y = tokens[i] * yFactor;

				points.push([x, y]);
				x += deltaX;
			}

			return points;
		}

		this.split = function (line) {
			var pattern = /(-?[\d\.]+|[a-z@%])[\s\+]*/ig,
				match;

			var tokens = []
			while ( match = pattern.exec(line) )
				tokens.push(match[1]);

			return tokens;
		};

		this.process = function (tokens) {
			// TODO: can these be combined into a single loop
			tokens = processDuplication(tokens);
			tokens = processSqueeze(tokens);
			tokens = processDifference(tokens);

			return tokens;
		};

		function processDuplication (tokens) {
			var pattern = /^[S-Zs]$/,
				decompressed = [];

			for (var index = 0, length = tokens.length; index < length; index++) {
				var token = tokens[index];

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
			}

			return decompressed;
		}

		function processSqueeze (tokens) {
			var positivePattern = /^[A-I]/,
				negativePattern = /^[a-i]/,
				decompressed = [];

			for (var index = 0, length = tokens.length; index < length; index++) {
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

			for (var index = 0, length = tokens.length; index < length; index++) {
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

	SpectreView.Jdx.Type = {
		UNKNOWN : 0,
		INFRARED_SPECTRUM : 1,
		NMR_SPECTRUM_13C : 2,
		NMR_SPECTRUM_1H : 3
	}

	SpectreView.Jdx.Reader = function () {

		var raw,
			metaData,
			xyData,

			points,
			pointsInTransmittance,
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
					return SpectreView.Jdx.Type.INFRARED_SPECTRUM;

				case dataType == 'NMR SPECTRUM' && observerNucleus == '1H':
					return SpectreView.Jdx.Type.NMR_SPECTRUM_1H;

				case dataType == 'NMR SPECTRUM' && observerNucleus == '13C':
					return SpectreView.Jdx.Type.NMR_SPECTRUM_13C;

				default:
					return SpectreView.Jdx.Type.UNKNOWN;
			}
		}

		this.getPoints = function () {
			return points;
		}

		this.getPointsInTransmittance = function () {
			if (!pointsInTransmittance) {
				if (metaData['YUNITS'] == 'ABSORBANCE') {
					pointsInTransmittance = [];

					for (var i = 0, length = points.length; i < length; i++) {
						var point = points[i];

						pointsInTransmittance.push([point[0], Math.pow(10, -1 * point[1])])
					}
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

					for (var i = 0, length = points.length; i < length; i++) {
						var point = points[i];

						pointsInAbsorbance.push([point[0], point[1] == 0 ? 0 : Math.log(1 / Math.abs(point[1])) / Math.LN10])
					}
				}
				else if (metaData['YUNITS'] == 'ABSORBANCE') {
					pointsInAbsorbance = points;
				}
			}

			return pointsInAbsorbance;
		}

		this.getIntegrationPoints = function () {
			if (!integrationPoints) {
				if (metaData['.OBSERVE NUCLEUS'] == '1H') {
					integrationPoints = [];

					var value = Math.abs(metaData['MAXY'] - metaData['MINY']) * 0.15;
					var threshold = Math.abs(metaData['MAXY'] - metaData['MINY']) * 0.05;

					for (var i = 0, length = points.length; i < length; i++) {
						var point = points[i];

						if (point[1] > threshold) {
							value += point[1] * 0.025;
						}

						integrationPoints.push([point[0], value]);
					}
				}
			}

			return integrationPoints;
		}

		this.getPointsInHz = function () {
			if (!pointsInHz) {
				if (metaData['XUNITS'] == 'PPM') {
					pointsInHz = [];

					for (var i = 0, length = points.length; i < length; i++) {
						var point = points[i];

						pointsInHz.push([point[0] * metaData['.OBSERVE FREQUENCY'], point[1]]);
					}
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

					for (var i = 0, length = points.length; i < length; i++) {
						var point = points[i];

						pointsInPpm.push([point[0] / metaData['.OBSERVE FREQUENCY'], point[1]]);
					}
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
			var pattern = /^##XYDATA=(.*)$([\s\S]*)^##END=.*$/igm;
			var match = pattern.exec(raw);

			xyData = match[2].split('\n');
		}

		function processXyData () {
			var decompressor = new SpectreView.Jdx.Decompressor(metaData['XFACTOR'], metaData['YFACTOR'], metaData['DELTAX']);

			points = [];

			for (var i = 0, length = xyData.length; i < length; i++) {
				var decompressed = decompressor.decompress(xyData[i]);
				points = points.concat(decompressed);
			}
		}
	}

	SpectreView.Jdx.Converter = function (points, type, xUnits, yUnits) {
		var pointsInTransmittance,
			pointsInAbsorbance,
			integrationPoints,
			pointsInHz,
			pointsInPpm;
	}

}( window.SpectreView = window.SpectreView || {} ));
