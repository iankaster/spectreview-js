$(function() {

	$('#integration').button().change(onIntegrationClick);
	$('#ir-y-units').buttonset().change(onIrYUnitsClick);
	$('#nmr-x-units').buttonset().change(onNmrXUnitsClick);

	function onIntegrationClick () {
		alert('integration clicked');
	}

	function onIrYUnitsClick () {
		alert('ir y units clicked');
	}

	function onNmrXUnitsClick () {
		alert('nmr x units clicked');
	}

});
