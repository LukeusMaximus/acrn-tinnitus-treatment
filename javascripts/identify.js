/**
 * @author LukeusMaximus
 */

var audioContext;
var toneGenerator = null;

var playing = false;
var desiredFrequency = 440;

var toneGenToggle;
var toneFrequencySlider;
var selectedFrequencySpan;

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
	toneGenerator.frequency.value = desiredFrequency;
	toneGenerator.connect(audioContext.destination);
}

function findElements() {
	toneGenToggle = document.querySelector("#toneGenToggle");
	toneFrequencySlider = document.querySelector("#toneFrequencySlider");
	selectedFrequencySpan = document.querySelector("#selectedFrequencySpan");
}

function init() {
	initAudioContext();
	findElements();
}

function startTone() {
	initToneGenerator();
	toneGenerator.start(0);
	playing = true;
	toneGenToggle.innerText = "Stop tone generator";
}

function stopTone() {
	toneGenerator.stop(0);
	toneGenerator = null;
	toneGenToggle.innerText = "Start tone generator";
}

function updateFrequency() {
	if(typeof selectedFrequencySpan === "undefined") {
		findElements();
	}
	desiredFrequency = toneFrequencySlider.value;
	selectedFrequencySpan.innerText = desiredFrequency;
	if ( toneGenerator !== null) {
		toneGenerator.frequency.value = desiredFrequency;
	}
}

function toggleToneGeneration() {
	if ( typeof audioContext === "undefined") {
		init();
	}
	if (toneGenerator === null) {
		startTone();
	} else {
		stopTone();
	}
}
