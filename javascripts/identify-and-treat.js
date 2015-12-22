/**
 * @author LukeusMaximus
 */

function createToneGeneratorNodes() {
	var audioContext;
	var toneGenerator;
	var gainNode;
	
	try {
		// Fix up for prefixing
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		audioContext = new AudioContext();
	} catch(e) {
		alert('Web Audio API is not supported in this browser');
	}

	toneGenerator = audioContext.createOscillator();
	toneGenerator.start(0);

	gainNode = audioContext.createGain();
	gainNode.gain.value = 0;
	
	toneGenerator.connect(gainNode);
	gainNode.connect(audioContext.destination);

	return {
		audioContext: audioContext,
		toneGenerator: toneGenerator,
		gainNode: gainNode
	}
}

function createToneMaker(toneGeneratorNodes) {
	return {
		get volume() {
			return toneGeneratorNodes.gainNode.gain.value;
		},
		set volume(v) {
			toneGeneratorNodes.gainNode.gain.value = v;
		},
		get frequency() {
			return toneGeneratorNodes.toneGenerator.frequency.value;
		},
		set frequency(f) {
			toneGeneratorNodes.toneGenerator.frequency.value = f;
		}
	}
}

function createACRNTreatment(toneGeneratorNodes) {
	// Many of this function's comments reference Tass et al. (2012), section 2.5
	var active = false;
	var targetFrequency; // f_t
	var treatmentTones;
	var tonesQueuedUntil;
	var volume;
	var currentTimeout;

	function shuffle(o){
		var result = [];
		for(var k = 0; k < o.length; k++) {
			result[k] = o[k];
		}
		for(var i = result.length; i > 0; i--) {
			var j = Math.floor(Math.random() * i);
			var temp = result[i-1]
			result[i-1] = result[j];
			result[j] = temp;
		}
		return result;
	}
	
	function calculateTreatmentTones() {
		// Create f_1 .. f_4 which are "equidistantly placed on a logarithmic scale within the interval [0.5·f_t, 2·f_t]"
		// It's not clear what the exact tones are from this statement but here's a sensible guess:
		treatmentTones = [
			// f_1 = 2^(-1)·f_t
			Math.pow(2, -1) * targetFrequency,
			// f_2 = 2^(-1/3)·f_t
			Math.pow(2, -1/3) * targetFrequency,
			// f_3 = 2^(1/3)·f_t
			Math.pow(2, 1/3) * targetFrequency,
			// f_4 = 2^(1)·f_t
			Math.pow(2, 1) * targetFrequency,
		];
		treatmentTones = treatmentTones.map(function(frequency) {
			return Math.floor(frequency);
		});
	}

	function queueFiveCycles() {
		// Constant definitions
		var QUEUING_LEEWAY = 0.1; // The amount of time before the next round of five cycles that we should queue the next five cycles of changes
		var CYCLE_FREQUENCY = 1.5; // delta
		var CYCLE_PERIOD = 1 / CYCLE_FREQUENCY;
		var QUARTER_CYCLE_PERIOD = CYCLE_PERIOD / 4;

		// Update tonesQueuedUntil if necessary
		if(toneGeneratorNodes.audioContext.currentTime > tonesQueuedUntil) {
			tonesQueuedUntil = toneGeneratorNodes.audioContext.currentTime;
		}

		var generatedTones = [];
		// Queue five cycles worth of frequency and volume changes
		// Three cycles of four random tones
		toneGeneratorNodes.gainNode.gain.setValueAtTime(volume, tonesQueuedUntil);
		for(var i = 0; i < 3; i++) {
			var randomTones = shuffle(treatmentTones);
			for(var j = 0; j < randomTones.length; j++) {
				toneGeneratorNodes.toneGenerator.frequency.setValueAtTime(randomTones[j], tonesQueuedUntil + (CYCLE_PERIOD * i) + (QUARTER_CYCLE_PERIOD * j));
				generatedTones.push(randomTones[j]);
			}
		}
		console.log(generatedTones);

		// Two cycles of silence
		toneGeneratorNodes.gainNode.gain.setValueAtTime(0, tonesQueuedUntil + (3 * CYCLE_PERIOD));

		// Update tonesQueuedUntil
		tonesQueuedUntil += 5 * CYCLE_PERIOD;

		// Queue next queuing event
		var secondsUntilNextQueuingEvent = tonesQueuedUntil - toneGeneratorNodes.audioContext.currentTime - QUEUING_LEEWAY;
		var millisecondsUntilNextQueuingEvent = secondsUntilNextQueuingEvent * 1000;
		currentTimeout = setTimeout(queueFiveCycles, millisecondsUntilNextQueuingEvent);
	}

	function startTreatment() {
		if(!active) {
			tonesQueuedUntil = 0;
			queueFiveCycles();
			active = true;
		}
	}

	function stopTreatment() {
		if(active) {
			toneGeneratorNodes.gainNode.gain.cancelScheduledValues(0);
			toneGeneratorNodes.gainNode.gain.value = 0;
			toneGeneratorNodes.toneGenerator.frequency.cancelScheduledValues(0);
			clearTimeout(currentTimeout);
			active = false;
		}		
	}

	return {
		get frequency() {
			return targetFrequency;
		},
		set frequency(f) {
			targetFrequency = f;
			calculateTreatmentTones();
		},
		get volume() {
			return volume;
		},
		set volume(v) {
			volume = v;
		},
		startTreatment: startTreatment,
		stopTreatment: stopTreatment
	}
}

function createApp() {
	var toneGeneratorNodes = createToneGeneratorNodes();
	var toneMaker = createToneMaker(toneGeneratorNodes);
	var acrnTreatment = createACRNTreatment(toneGeneratorNodes);
	var mode = "off";
	var desiredFrequency = 440;
	var desiredVolume = 0.5;

	function updateFrequency() {
		if(mode === "acrn") {
			// Should the frequency be updated in ACRN mode?
		} else if(mode === "tone") {
			desiredFrequency = parseInt(document.querySelector("#toneFrequencySlider").value);
			document.querySelector("#selectedFrequencySpan").innerText = desiredFrequency;
			toneMaker.frequency = desiredFrequency;
			window.localStorage["tinnitusFrequency"] = desiredFrequency;
		}
	}

	function updateVolume() {
		desiredVolume = parseFloat(document.querySelector("#volumeSlider").value);
		if(mode === "acrn") {
			acrnTreatment.volume = desiredVolume;
		} else if(mode === "tone") {
			toneMaker.volume = desiredVolume;
		}
		window.localStorage["toneVolume"] = desiredVolume;
	}

	function switchToToneMode() {
		acrnTreatment.stopTreatment();
		toneMaker.frequency = desiredFrequency;
		toneMaker.volume = desiredVolume;
	}

	function switchToACRNMode() {
		toneMaker.volume = 0;
		acrnTreatment.volume = desiredVolume;
		acrnTreatment.frequency = desiredFrequency;
		acrnTreatment.startTreatment();
	}

	function switchOff() {
		toneMaker.volume = 0;
		acrnTreatment.stopTreatment();
	}

	function switchMode(newMode) {
		switch(newMode) {
			case "tone":
				switchToToneMode();
				break;
			case "acrn":
				switchToACRNMode();
				break;
			case "off":
				switchOff();
				break;
		}
		mode = newMode;
		window.localStorage["applicationMode"] = newMode;
	}

	function initialise() {
		if(window.localStorage["tinnitusFrequency"]) {
			desiredFrequency = parseInt(window.localStorage["tinnitusFrequency"]);
			document.querySelector("#toneFrequencySlider").value = desiredFrequency;
			document.querySelector("#selectedFrequencySpan").innerText = desiredFrequency;
		}
		if(window.localStorage["toneVolume"]) {
			desiredVolume = parseFloat(window.localStorage["toneVolume"]);
			document.querySelector("#volumeSlider").value = desiredVolume;
		}
		if(typeof window.localStorage["applicationMode"] === "string") {
			switchMode(window.localStorage["applicationMode"]);
		}
	}

	return {
		initialise: initialise,
		updateVolume: updateVolume,
		updateFrequency: updateFrequency,
		switchMode: switchMode
	};
}

var app = createApp();
window.addEventListener("load", function() {
	app.initialise();
});
