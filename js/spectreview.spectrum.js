(function ( SpectreView, $, undefined ) {

	SpectreView.Spectrum = {

		reader: new SpectreView.Jdx.Reader(),

		graphId: "graph",

		defaultOptions: {
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
	  },

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

		load: function (url) {
			$.ajax({
				url: url,
				dataType: 'text',
				success: onLoadSuccess,
				error: onLoadError
			});
		}

	};

	$.fn.spectreView = function(path){
		SpectreView.Spectrum.load(path);
	};

	$(document).on("click", "button", function(e){
		var path = $(this).data("file") + ".txt";
		$("#graph").spectreView(path);
	});

	function onLoadSuccess (data, status, jqXHR) {

		SpectreView.Spectrum.reader.load(data);

		SpectreView.Spectrum.defaultOptions.series = [];

		SpectreView.Spectrum.defaultOptions.series.push({
			type: "line",
			data: SpectreView.Spectrum.reader.getPoints(),
			markers: null
		});

		$('#' + SpectreView.Spectrum.graphId).jqChart(SpectreView.Spectrum.defaultOptions);
	}

	function onLoadError (jqXHR, status, error) {
		console.log("error loading file");
	}

}( window.SpectreView = window.SpectreView || {}, jQuery));
