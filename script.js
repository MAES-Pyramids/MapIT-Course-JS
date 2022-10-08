'use strict';
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-8);
  constructor(distance, duration, coordination) {
    this.distance = distance;
    this.duration = duration;
    this.coordinates = coordination;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.Description = `${this.type} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
//--------
class Running extends Workout {
  type = 'Running';
  constructor(distance, duration, coordination, cadence) {
    super(distance, duration, coordination);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}
//--------
class Cycling extends Workout {
  type = 'Cycling';
  constructor(distance, duration, coordination, elevationGain) {
    super(distance, duration, coordination);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / this.duration;
  }
}
//--------------------------------------------------------------------
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #ZoomLevel = 14;
  #workouts = [];

  constructor() {
    this._getPosition();
    // Load data from the localStorage
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkOut.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert(`Sorry , we can't get your position`);
      }
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coordinates = [latitude, longitude];

    this.#map = L.map('map').setView(coordinates, this.#ZoomLevel);
    //https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png
    //https://tile.openstreetmap.org/{z}/{x}/{y}.png
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputElevation.value =
      inputCadence.value =
      inputDuration.value =
      inputDistance.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _newWorkOut(e) {
    e.preventDefault();
    // Get date from inputs fields
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // Check validation with helper function
    function finiteInput(...inputs) {
      return inputs.every(inp => Number.isFinite(inp));
    }
    function positiveInput(...inputs) {
      return inputs.every(inp => inp >= 0);
    }

    // If (type == 'running' , create workout Object
    if (type == 'running') {
      const cadence = +inputCadence.value;

      if (
        !finiteInput(distance, duration, cadence) ||
        !positiveInput(distance, duration, cadence)
      )
        return alert('Sorry input data is unacceptable');

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // If type == 'cycling' , create cycling Object
    if (type == 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !finiteInput(distance, duration, elevation) ||
        !positiveInput(distance, duration)
      )
        return alert('Sorry input data is unacceptable');

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    // add new object to the work out array
    this.#workouts.push(workout);

    // render Marker to the map
    this._renderMarker(workout);

    // render workouts to the map
    this._renderWorkout(workout);
    //Clearing
    this._hideForm();
    // Update the local storage
    this._setLocalStorage();
  }

  _renderMarker(workout) {
    L.marker(workout.coordinates)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 75,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type.toLowerCase()}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type == 'Running' ? '🏃‍♂️' : '🚴'} ${workout.Description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type.toLowerCase()}" data-id="${
      workout.id
    }">
        <h2 class="workout__title">${workout.Description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type == 'Running' ? '🏃‍♂️' : '🚴'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div> 
      `;

    if (workout.type == 'Running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    } else {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
       </div>
      </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToMarker(e) {
    if (!this.#map) return;
    const workoutTest = e.target.closest('.workout');
    if (!workoutTest) return;
    const exactWorkout = this.#workouts.find(
      workout => workout.id == workoutTest.dataset.id
    );

    this.#map.setView(exactWorkout.coordinates, this.#ZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    location.reload();
    localStorage.removeItem('workouts');
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
}
const app = new App();
