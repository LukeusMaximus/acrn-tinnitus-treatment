/**
 * @author LukeusMaximus
 */

var audioContext;
var toneGenerator;
var playing;

function initAudioContext() {
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		audioContext = new AudioContext();
	} catch(e) {
		alert('Web Audio API is not supported in this browser');
	}
}

function initToneGenerator() {
	toneGenerator = audioContext.createOscillator();
	toneGenerator.frequency.value = 200;
	toneGenerator.connect(audioContext.destination);
}

function startTone() {
	if ( typeof toneGenerator === "undefined") {
		initToneGenerator();
	}
	toneGenerator.start();
	playing = true;
}

function stopTone() {
	toneGenerator.stop();
	playing = false;
}

function toggleToneGeneration() {
	if (typeof audioContext === "undefined") {
		initAudioContext();
	}
	if ( typeof toneGenerator === "undefined") {
		initToneGenerator();
	}
	if (playing) {
		stopTone();
	} else {
		startTone();
	}
}
