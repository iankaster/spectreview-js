(function ( SpectreView, $, undefined ) {

	SpectreView.Spectrum = function () {
		var defaults = {
			
		};
	
		/*
			old options
		
			line color
			background color
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
	}

	$.fn.spectreView = function () {
	
	};
	
}( window.SpectreView = window.SpectreView || {}, jQuery ));