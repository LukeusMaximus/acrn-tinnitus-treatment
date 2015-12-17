/**
 * @author LukeusMaximus
 */

var audioContext;
var toneGenerator;
var gainNode;

var desiredFrequency = 440;
var desiredVolume = 0.5;

function updateFrequency() {
	desiredFrequency = document.querySelector("#toneFrequencySlider").value;
	document.querySelector("#selectedFrequencySpan").innerText = desiredFrequency;
	toneGenerator.frequency.value = desiredFrequency;
	window.localStorage["tinnitusFrequency"] = desiredFrequency;
}

function updateVolume() {
	desiredVolume = document.querySelector("#volumeSlider").value;
	gainNode.gain.value = desiredVolume;
	window.localStorage["toneVolume"] = desiredFrequency;
}

(function initialise() {
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		audioContext = new AudioContext();
	} catch(e) {
		alert('Web Audio API is not supported in this browser');
	}

	toneGenerator = audioContext.createOscillator();
	toneGenerator.start(0);
	if(window.localStorage["tinnitusFrequency"]) {
		desiredFrequency = parseInt(window.localStorage["tinnitusFrequency"]);
	}
	toneGenerator.frequency.value = desiredFrequency;
	
	gainNode = audioContext.createGain();
	if(window.localStorage["toneVolume"]) {
		desiredVolume = parseInt(window.localStorage["toneVolume"]);
	}
	gainNode.gain.value = desiredVolume;

	toneGenerator.connect(gainNode);
	gainNode.connect(audioContext.destination);
}());
