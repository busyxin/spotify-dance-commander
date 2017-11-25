// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

class SoundOutput {
	constructor() {
		this.id = 'spotify-widget';
		this.loaded = false;
		this.canTrigger = true;
		this.basePath = 'assets/outputs/sound/sounds/';
		this.assets = [];
		this.numAssets = this.assets.length;
        window.addEventListener('mobileLaunch', this.touchAudio.bind(this));

		this.defaultAssets = [];
		this.defaultAssets[0] = 'spotify:track:6OGRM4MAOlyOdhHuX0OJ6P';
		this.defaultAssets[1] = 'spotify:track:0MKGH8UMfCnq5w7nG06oM5';
		this.defaultAssets[2] = 'spotify:track:2UKYMN7VnsQo40n0qCt6Sa';

		this.numLoaded = 0;
		this.sounds = {};
		this.currentSound = null;
		this.currentIcon = null;
		this.element = document.createElement('div');
		this.element.classList.add('output__container');
		this.element.classList.add('output__container--sound');
		this.classNames = GLOBALS.classNames;
		this.colors = GLOBALS.colors;
		this.numClasses = GLOBALS.numClasses;
		this.loadingScreen = document.createElement('div');
		this.loadingScreen.classList.add('output__loading-screen');
		this.loadingScreen.classList.add('output__loading-screen--sound');
		let loadingTitle = document.createElement('div');
		loadingTitle.textContent = 'Loading';
		loadingTitle.classList.add('output__loading-title');
		this.loadingScreen.appendChild(loadingTitle);
		this.element.appendChild(this.loadingScreen);
		this.offScreen = document.createElement('div');
		this.offScreen.classList.add('output__sound');
		let options = {};
		options.playCallback = this.searchResultPlayClick.bind(this);
		options.selectCallback = this.searchResultClick.bind(this);
		options.assets = this.assets;
		this.search = new SoundSearch(options);
		this.offScreen.appendChild(this.search.element);
		this.inputClasses = [];
        this.lastSound;

		for (let index = 0; index < this.assets.length; index += 1) {
			let sound = this.assets[index];
			let audio = new Audio();
			audio.muted = true;
			audio.loop = true;
			audio.addEventListener('canplaythrough', this.assetLoaded.bind(this));
			audio.src = this.basePath + sound;
			this.sounds[sound] = audio;
		}

		for (let index = 0; index < this.numClasses; index += 1) {
			let id = this.classNames[index];
			let inputClass = document.createElement('div');
			let sound = this.defaultAssets[index];
			inputClass.classList.add('output__sound-class');
			inputClass.classList.add(`output__sound-class--${id}`);

			let speakerIcon = document.createElement('div');
			speakerIcon.classList.add('output__sound-speaker');
			speakerIcon.classList.add(`output__sound-speaker--${id}`);
			inputClass.sound = sound;
			inputClass.icon = speakerIcon;

			let loader = ((el) => {
				let ajax = new XMLHttpRequest();
				ajax.open('GET', 'assets/outputs/speaker-icon.svg', true);
				ajax.onload = (event) => {
					el.innerHTML = ajax.responseText;
				};
				ajax.send();
			})(speakerIcon);

			let editIcon = document.createElement('div');
			editIcon.classList.add('output__sound-edit');
			editIcon.classList.add(`output__sound-edit--${id}`);

			let input = document.createElement('input');
			input.classId = id;
			input.classList.add('output__sound-input');
			input.classList.add(`output__sound-input--${id}`);
			input.setAttribute('readonly', 'readonly');
			input.value = sound;
			inputClass.appendChild(speakerIcon);
			inputClass.appendChild(editIcon);
			inputClass.appendChild(input);

			var deleteIcon = document.createElement('div');
			deleteIcon.classList.add('output__sound-delete');
			inputClass.appendChild(deleteIcon);

			deleteIcon.addEventListener('click', this.clearInput.bind(this));
			input.addEventListener('click', this.editInput.bind(this));
            document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this), false);
			// speakerIcon.addEventListener('click', this.testSound.bind(this));
			// this.inputClasses[index] = speakerIcon;
			inputClass.input = input;
			this.inputClasses[index] = inputClass;
			this.offScreen.appendChild(inputClass);

		}
		this.element.appendChild(this.offScreen);
		this.speakers = [];
		this.buildCanvas();
	}

    handleVisibilityChange() {
		if (this.currentSound === null) {
            this.currentSound;
		}else if (document.hidden) {
            this.currentSound.pause();
        }else {
            this.currentSound.play();
        }
    }

    playCurrentSound() {
		if (this.currentSound) {
			this.currentSound.play();
		}
	}

    pauseCurrentSound() {
		if (this.currentSound) {
			this.currentSound.pause();
		}
    }

	clearInput(event) {
		if (this.currentSound === this.sounds[event.target.parentNode.sound]) {
			this.currentSound.muted = true;
            this.currentSound = null;
            if (this.currentIcon) {
				this.currentIcon.classList.remove('output__sound-speaker--active');
				this.currentIcon = null;
			}
		}
		event.target.parentNode.sound = null;
		event.target.parentNode.input.value = 'Nothing';

		event.target.parentNode.input.classList.add('output__sound-input--nothing');

        if (this.currentBorder && this.currentClassName) {
            this.currentBorder.classList.remove(`output__sound-input--${this.currentClassName}-selected`);
        }
    }

	searchResultPlayClick(event) {
		event.stopPropagation();
		let sound = event.target.parentNode.value;
		this.lastSound = sound;
		this.playSound(sound);
	}

	searchResultClick(event) {
		let value = event.target.value;
		this.activeInput.value = value;
		this.activeInput.parentNode.sound = value;
		this.activeInput.parentNode.input.classList.remove('output__sound-input--nothing');
		if (this.currentSound) {
            this.currentSound.muted = true;
            this.currentSound = null;
        }
        this.search.hide();
	}

	editInput(event) {
		this.activeInput = event.target;
		let classId = this.activeInput.classId;
		if (this.currentSound) {
			this.currentSound.muted = true;
			this.currentSound = null;
			if (this.currentIcon) {
				this.currentIcon.classList.remove('output__sound-speaker--active');
				this.currentIcon = null;
			}
		}
		this.search.show(classId);
	}

	filterResults() {
		let phrase = this.searchInput.value;

	}

	soundEnded(event) {
		if (this.activeSpeaker) {
			this.currentSound.muted = true;
			this.activeSpeaker.classList.remove('output__sound-speaker--active');	
		}
		this.canTrigger = true;
		if (this.currentSound === event.target) {
			this.currentSound.muted = true;
			this.currentSound = null;
			if (this.currentIcon) {
				this.currentIcon.classList.remove('output__sound-speaker--active');
				this.currentIcon = null;
			}
		}
	}

    playSound(sound) {
        this.muteSounds();
		if (!this.search.visible) {
			if (this.currentSound === sound) {
				this.currentSound = null;
			}else if (this.sounds[sound]) {
				this.currentSound = this.sounds[sound];
				this.currentSound.muted = false;
				this.currentSound.currentTime = 0;
				this.currentSound.play();
                this.lastSound = this.currentSound;
			}
		}
    }

    muteSounds() {
		if (this.currentSound) {
            this.currentSound.muted = true;
		}
	}

	assetLoaded(event) {
		this.numLoaded += 1;
		if (this.numLoaded === this.numAssets) {
			this.loaded = true;
			for (let index = 0; index < this.numAssets; index += 1) {
				let id = this.assets[index];
			}
			this.showScreen();
		}
	}

	showScreen() {
		this.loadingScreen.style.display = 'none';
		this.offScreen.style.display = 'block';
	}

	trigger(index) {
		const parent = document.getElementById('output');
		const target = document.getElementById('spotify-widget');
		const newUri = 'https://open.spotify.com/embed?uri=' + this.defaultAssets[index];

		target.setAttribute('src', newUri);
		console.log("tries to resume");
		console.log(localStorage)
		fetch(`https://api.spotify.com/v1/me/player/play?device_id=${Player.device_id}`, {
			method: 'PUT',
			body: JSON.stringify({
					"uris": [this.defaultAssets[index]],
				}),
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage.spotify_access_token}`
			}
		})
	}

	setAttributes(el, attrs) {
		if (attrs) {
			for (let key in attrs) {
				if (key) {
					el.setAttribute(key, attrs[key]);
				}
			}
		}
	}

	stop() {
		for (let index = 0; index < this.numAssets; index += 1) {
			let id = this.assets[index];
			this.sounds[id].pause();
		}
		this.element.style.display = 'none';
	}

	start() {
		this.element.style.display = 'block';
	}

	buildCanvas() {
		this.canvas = document.createElement('canvas');
		this.canvas.style.display = 'none';
		this.context = this.canvas.getContext('2d');
		this.canvas.width = 340;
		this.canvas.height = 260;
		this.offScreen.appendChild(this.canvas);

		let img = new Image();
		img.onload = () => {
			this.canvasImage = img;
		};
		img.src = 'assets/outputs/speaker-icon.svg';
	}

	updateCanvas(colorId, sound) {
        if (sound === 'null') {
            this.sound = ' ';
        }
		let color = '#2baa5e';
		switch (colorId) {
			case 0:
			color = '#2baa5e';
			break;
			case 1:
			color = '#c95ac5';
			break;
			default:
			case 2:
			color = '#dd4d31';
			break;
		}
		if (this.canvasImage) {
			this.context.globalCompositeOperation = 'source-over';
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.context.fillStyle = 'rgb(255, 255, 255)';
			this.context.fillRect(0, 0, 300, 300);
			this.context.drawImage(this.canvasImage, 105, 52, 95, 95);
            this.context.font = '25px Poppins';
            this.context.fillStyle = '#000';
            this.context.fillText(sound, (this.canvas.width / 2 - this.context.measureText(sound).width / 2) - 20, 207);
			this.context.globalCompositeOperation = 'screen';
			this.context.fillStyle = color;
			this.context.fillRect(0, 0, 300, 300);
		}
	}

	touchAudio() {
        for (let key in this.sounds) {
            /*eslint-disable */
            if (this.sounds.hasOwnProperty(key)) {
                this.sounds[key].play();
                this.sounds[key].pause();
            }
            /*eslint-enable */
        }
    }
}


import SoundSearch from './sound/SoundSearch.js';
import GLOBALS from './../config.js';

export default SoundOutput;