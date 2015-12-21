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
	var cycleFrequency = 1.5; // delta
	var cyclePeriod = 1 / cycleFrequency;
	var quarterCyclePeriod = cyclePeriod / 4;
	var treatmentTones;
	var tonesQueuedUntil;
	var volume;
	var currentTimeout;

	function shuffle(o) {
		var result = [];
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), --i, result[i] = o[j]);
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
	}

	function queueFiveCycles() {
		// Update tonesQueuedUntil if necessary
		if(toneGeneratorNodes.audioContext.currentTime > tonesQueuedUntil) {
			tonesQueuedUntil = toneGeneratorNodes.audioContext.currentTime;
		}

		// Queue five cycles worth of frequency and volume changes
		// Three cycles of four random tones
		toneGeneratorNodes.gainNode.gain.setValueAtTime(volume, tonesQueuedUntil);
		for(var i = 0; i < 3; i++) {
			var randomTones = shuffle(treatmentTones);
			for(var j = 0; j < randomTones.length; j++) {
				toneGeneratorNodes.toneGenerator.frequency.setValueAtTime(randomTones[j], tonesQueuedUntil + (cyclePeriod * i) + (quarterCyclePeriod * j));
			}
		}

		// Two cycles of silence
		toneGeneratorNodes.gainNode.gain.setValueAtTime(0, tonesQueuedUntil + (3 * cyclePeriod));

		// Update tonesQueuedUntil
		tonesQueuedUntil += 5 * cyclePeriod;

		// Queue next queue event
		currentTimeout = setTimeout(queueFiveCycles, Math.floor(tonesQueuedUntil - toneGeneratorNodes.audioContext.currentTime));
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
	var mode = "tone";
	var desiredFrequency = 440;
	var desiredVolume = 0.5;

	function updateFrequency() {
		if(mode === "acrn") {
			// Should the frequency be updated in ACRN mode?
		} else if(mode === "tone") {
			desiredFrequency = parseInt(document.querySelector("#toneFrequencySlider").value);
			document.querySelector("#selectedFrequencySpan").innerText = desiredFrequency;
			toneMaker.frequency.value = desiredFrequency;
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
		window.localStorage["tinnitusFrequency"] = newMode;
	}

	function initialise() {
		if(window.localStorage["tinnitusFrequency"]) {
			desiredFrequency = parseInt(window.localStorage["tinnitusFrequency"]);
		}
		if(window.localStorage["toneVolume"]) {
			desiredVolume = parseInt(window.localStorage["toneVolume"]);
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
app.initialise();
