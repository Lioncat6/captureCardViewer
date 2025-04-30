const video = document.getElementById("video");
const constraints = { audio: { sampleRate: 96000, echoCancellation: false, autoGainControl: false }, video: { aspectRatio: 16 / 9, resizeMode: "none", frameRate:60 } };
const prevVol = localStorage.getItem("sliderVal");

screenSelect();

navigator.mediaDevices
	.getUserMedia(constraints)
	.then((mediaStream) => {
		// console.log(mediaStream.getTracks()[0].getSettings());
		// console.log(mediaStream.getTracks()[1].getSettings());

		video.srcObject = mediaStream;
		video.onloadedmetadata = function (e) {
			video.play();
		};
	})
	.catch(function (err) {
		console.log(err.name + ": " + err.message);
	});

function showMenu() {
	document.getElementById("menu").style.opacity = 1;
}

function hideMenu() {
	document.getElementById("menu").style.opacity = 0;
}

function adjustVolume() {
	const sliderVal = document.getElementById("range").value;
	video.volume = sliderVal;
	// change to mute icon when sliderVal is 0
	if (sliderVal <= 0) {
		muteBtn.classList.add("mute");
	} else {
		muteBtn.classList.remove("mute");
	}
	// save sliderVal to localStorage so volume is persistent
	localStorage.setItem("sliderVal", sliderVal);
}

// allows using mouse wheel to adjust volume slider
document.getElementById("range").addEventListener("wheel", function (event) {
	let sliderVal = document.getElementById("range").value;
	// change '2000' to adjust the speed of volume slider change
	const delta = event.deltaY / 2000;
	const newVolume = sliderVal - delta;
	document.getElementById("range").value = newVolume;
	adjustVolume();
});

// prevents menu from timing out if mouse or mouse wheel moves
document.addEventListener("mousemove", resetTimeout, false);
document.addEventListener("wheel", resetTimeout);

let timeout;
function resetTimeout() {
	showMenu();
	document.getElementsByClassName("container")[0].style.cursor = "auto";
	clearTimeout(timeout);
	// change '3000' to adjust timeout period
	timeout = setTimeout(() => {
		hideMenu();
		document.getElementsByClassName("container")[0].style.cursor = "none";
	}, 3000);
}

function screenSelect() {
	const userInput = document.getElementById("screen").value;
	switch (userInput) {
		case "Both":
			document.getElementById("canvasWrapper").style.display = "flex";
			document.getElementById("videoWrapper").style.display = "flex";
			break;
		case "Original":
			document.getElementById("canvasWrapper").style.display = "none";
			document.getElementById("videoWrapper").style.display = "contents";
			break;
		case "Processed":
			document.getElementById("canvasWrapper").style.display = "contents";
			document.getElementById("videoWrapper").style.display = "none";
			break;
	}
}

const muteBtn = document.getElementById("muteBtn");
muteBtn.addEventListener("click", function () {
	muteBtn.classList.toggle("mute");
	const sliderVal = document.getElementById("range").value;
	// muted
	if (sliderVal > 0) {
		// save to localStorage so when unmuted, it can set volume slider back
		localStorage.setItem("preMuteVol", sliderVal);
		document.getElementById("range").value = 0;
		adjustVolume();
	}
	// unmuted
	else {
		// set volume slider back to prev value
		const lastVol = localStorage.getItem("preMuteVol");
		document.getElementById("range").value = lastVol;
		adjustVolume();
	}
});

// set volume slider val to prev val
window.onload = function () {
	document.getElementById("range").value = prevVol;
	adjustVolume();
	populateDeviceOptions();
	updateVideoSettings();
};

// Populate device dropdowns
function populateDeviceOptions() {
	navigator.mediaDevices
		.enumerateDevices()
		.then((devices) => {
			const videoDeviceSelect = document.getElementById("videoDevice");
			const audioDeviceSelect = document.getElementById("audioDevice");

			// Clear existing options
			videoDeviceSelect.innerHTML = "";
			audioDeviceSelect.innerHTML = "";

			devices.forEach((device) => {
				const option = document.createElement("option");
				option.value = device.deviceId;
				option.text = device.label || `Device ${device.deviceId}`;

				if (device.kind === "videoinput") {
					videoDeviceSelect.appendChild(option);
				} else if (device.kind === "audioinput") {
					audioDeviceSelect.appendChild(option);
				}
			});
		})
		.catch((err) => {
			console.log("Error enumerating devices:", err);
		});
}

// Update video and audio settings
function updateVideoSettings() {
    const resolution = document.getElementById("resolution").value.split("x");
    const frameRate = document.getElementById("frameRate").value;
    const videoDeviceId = document.getElementById("videoDevice").value;
    const audioDeviceId = document.getElementById("audioDevice").value;

    const constraints = {
        audio: {
            deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
            sampleRate: 96000,
            echoCancellation: false,
            autoGainControl: false,
        },
        video: {
            deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
            width: parseInt(resolution[0]),
            height: parseInt(resolution[1]),
            frameRate: parseInt(frameRate),
            aspectRatio: 16 / 9,
            resizeMode: "none",
        },
    };

    // Stop the current media stream if it exists
    if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
    }

    navigator.mediaDevices
        .getUserMedia(constraints)
        .then((mediaStream) => {
            video.srcObject = mediaStream;
            video.onloadedmetadata = function () {
                video.play();
            };
        })
        .catch(function (err) {
            console.log(err.name + ": " + err.message);
        });
}