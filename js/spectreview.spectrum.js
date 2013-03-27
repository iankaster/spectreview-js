(function ( SpectreView, $, undefined ) {

	SpectreView.Spectrum = function () {

		this.defaultOptions = {
      title: '',
      legend: { visible: false },
      border: { strokeStyle: '#6ba851' },
      background: "#eee",
      animation: { duration: 2 },
      tooltips: { type: 'shared' },
      padding: 0,
      shadows: {
          enabled: false
      },
      crosshairs: {
          enabled: true,
          hLine: false,
          vLine: { strokeStyle: '#cc0a0c' }
      },
      axes: [
              {
                  location: 'bottom',
                  zoomEnabled: true
              },
              {
				type: 'linear',
				location: 'left',
				labels: { visible: false },
				majorTickMarks: { visible: false },
				majorGridLines: { visible: true },
				strokeStyle: "transparent",
				lineWidth: 0
			}
            ],
      series: []
	  };

		/*
			old options

			line color X
			background color X
			plot color
			integration color
			zoom color
			save dimension
			copy dimension
			force trans
			force abs
			anti alias
			y-axis
			integration
			export file format
		*/

		this.load = function ( url ) {
			$.ajax({
				url: url,
				dataType: 'text',
				success: onLoadSuccess,
				error: onLoadError
			});
		}

		function onLoadSuccess (data, status, jqXHR) {

		}

		function onLoadError (jqXHR, status, error) {

		}
	};

	$.fn.spectreView = function (reader) {
		var spectrum = new SpectreView.Spectrum();

		console.log(reader.getType());

		spectrum.defaultOptions.series.push({
			type: "line",
			data: reader.getPoints(),
			markers: null
		});

		$(this).jqChart(spectrum.defaultOptions);

	};

}( window.SpectreView = window.SpectreView || {}, jQuery));
