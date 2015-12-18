/**
 * @author LukeusMaximus
 */

function createToneMaker() {
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
		get volume() {
			return gainNode.gain.value;
		},
		set volume(v) {
			gainNode.gain.value = v;
		},
		get frequency() {
			return toneGenerator.frequency.value;
		},
		set frequency(f) {
			toneGenerator.frequency.value = f;
		}
	}
}

function createACRNTreatment() {
	// Many of this function's comments reference Tass et al. (2012), section 2.5
	var active = false;
	var targetFrequency; // f_t
	var cycleFrequency = 1.5; // delta
	var treatmentTones;
	var tonesQueuedUntil;

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
		// Queue five cycles worth of frequency and volume changes
		// Three of four random tones
		
		// Two of silence
	}

	function startTreatment() {
		if(!active) {
			tonesQueuedUntil = 
			active = true;
		}
	}

	function stopTreatment() {
		if(active) {

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
		startTreatment: startTreatment,
		stopTreatment: stopTreatment
	}
}

function createApp() {
	var toneMaker = createToneMaker();
	var acrnTreatment = createACRNTreatment();
	var mode = "tone";
	var desiredFrequency = 440;
	var desiredVolume = 0.5;

	function updateFrequency() {
		if(mode === "acrn") {
			// Should the frequency be updated in ACRN mode?
		} else {
			desiredFrequency = document.querySelector("#toneFrequencySlider").value;
			document.querySelector("#selectedFrequencySpan").innerText = desiredFrequency;
			toneGenerator.frequency.value = desiredFrequency;
			window.localStorage["tinnitusFrequency"] = desiredFrequency;
		}
	}

	function updateVolume() {
		desiredVolume = document.querySelector("#volumeSlider").value;
		if(mode === "acrn") {
			acrnTreatment.volume = desiredVolume;
		} else {
			toneGenerator.volume = desiredVolume;
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

	function switchMode() {
		if(mode === "acrn") {
			mode = "tone";
			switchToToneMode();
		} else {
			mode = "acrn";
			switchToACRNMode();
		}
	}

	function initialise() {
		if(window.localStorage["applicationMode"] === "acrn") {
			mode = "acrn"
		}
		if(window.localStorage["tinnitusFrequency"]) {
			desiredFrequency = parseInt(window.localStorage["tinnitusFrequency"]);
		}
		if(window.localStorage["toneVolume"]) {
			desiredVolume = parseInt(window.localStorage["toneVolume"]);
		}
		if(mode === "tone") {
			switchToToneMode();
		} else {
			switchToACRNMode();
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
