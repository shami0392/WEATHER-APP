
const API_KEY = '364c3578df04e9b1a1bef5e09c19b5d6';

// DOM Elements
const menuIcon = document.getElementById('menu-icon');
const menuBar = document.getElementById('menu-bar');
const menuClose = document.getElementById('menu-close');
const searchInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfo = document.getElementById('weather-info');
const locationElem = document.getElementById('location');
const timeElem = document.getElementById('time');
const weatherIconElem = document.getElementById('weather-icon');
const descriptionElem = document.getElementById('description');
const tempValueElem = document.getElementById('temp-value');
const tempUnitToggle = document.getElementById('temp-unit-toggle');
const windSpeedElem = document.getElementById('wind-speed');
const humidityElem = document.getElementById('humidity');
const sunriseElem = document.getElementById('sunrise');
const sunsetElem = document.getElementById('sunset');
const forecastContainer = document.getElementById('forecast-container');
const errorMessage = document.getElementById('error-message');
const loader = document.getElementById('loader');
const savedCitiesList = document.getElementById('saved-cities-list');

// Modal Elements
const forecastModal = document.getElementById('forecast-modal');
const modalCloseBtn = document.getElementById('modal-close');
const modalDayElem = document.getElementById('modal-day');
const modalDateElem = document.getElementById('modal-date');
const modalIconElem = document.getElementById('modal-icon');
const modalTempValueElem = document.getElementById('modal-temp-value');
const modalTempUnitElem = document.getElementById('modal-temp-unit');
const modalDescriptionElem = document.getElementById('modal-description');
const modalWindSpeedElem = document.getElementById('modal-wind-speed');
const modalHumidityElem = document.getElementById('modal-humidity');
const modalCloudsElem = document.getElementById('modal-clouds');
const modalRainElem = document.getElementById('modal-rain');

let isCelsius = true;
let currentWeatherData = null;
let savedCities = JSON.parse(localStorage.getItem('savedCities')) || ['New York', 'London', 'Tokyo'];

// Event Listeners
menuIcon.addEventListener('click', () => {
    menuBar.classList.add('open');
});

menuClose.addEventListener('click', () => {
    menuBar.classList.remove('open');
});

searchBtn.addEventListener('click', () => {
    const city = searchInput.value;
    if (city) {
        fetchWeather(city);
    }
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

tempUnitToggle.addEventListener('click', () => {
    isCelsius = !isCelsius;
    updateTemperatureDisplay();
});

// Add a click listener to the saved cities list
savedCitiesList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        const city = e.target.textContent;
        fetchWeather(city);
        menuBar.classList.remove('open');
    }
});

// Modal Close Listeners
modalCloseBtn.addEventListener('click', () => {
    forecastModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === forecastModal) {
        forecastModal.style.display = 'none';
    }
});

// Event delegation for forecast cards
forecastContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.forecast-card');
    if (card) {
        const index = card.getAttribute('data-index');
        if (currentWeatherData.dailyForecast && currentWeatherData.dailyForecast[index]) {
            showForecastDetails(currentWeatherData.dailyForecast[index]);
        }
    }
});


// Functions
function showLoader() {
    weatherInfo.classList.remove('visible');
    loader.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideLoader() {
    loader.style.display = 'none';
    weatherInfo.classList.add('visible');
}

function displayError() {
    loader.style.display = 'none';
    weatherInfo.classList.remove('visible');
    errorMessage.style.display = 'block';
}

async function fetchWeather(city) {
    showLoader();
    try {
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        const weatherData = await weatherResponse.json();

        if (weatherData.cod !== 200) {
            displayError();
            return;
        }

        const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
        const forecastData = await forecastResponse.json();

        currentWeatherData = { ...weatherData, forecast: forecastData };
        
        updateUI(currentWeatherData);
        hideLoader();

        // Add city to saved list if it's new
        if (!savedCities.includes(city)) {
            savedCities.unshift(city);
            savedCities = savedCities.slice(0, 5); // Keep a maximum of 5 cities
            localStorage.setItem('savedCities', JSON.stringify(savedCities));
            renderSavedCities();
        }

    } catch (error) {
        console.error('Error fetching weather data:', error);
        displayError();
    }
}

function updateUI(data) {
    // Update location and time
    locationElem.textContent = `${data.name}, ${data.sys.country}`;
    updateClock();
    setInterval(updateClock, 1000);

    // Update main weather details
    const tempCelsius = data.main.temp;
    tempValueElem.textContent = isCelsius ? tempCelsius.toFixed(1) : ((tempCelsius * 9/5) + 32).toFixed(1);
    tempUnitToggle.textContent = isCelsius ? '°C/°F Change' : '°F/°C Change';

    descriptionElem.textContent = data.weather[0].description;
    
    // Update detailed info
    windSpeedElem.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    humidityElem.textContent = `${data.main.humidity}%`;
    sunriseElem.textContent = formatTime(data.sys.sunrise);
    sunsetElem.textContent = formatTime(data.sys.sunset);
    
    // Update weather icon and background
    const weatherId = data.weather[0].id;
    updateWeatherIcon(weatherId);
    updateBackground(weatherId, data.weather[0].icon);

    // Update forecast
    updateForecast(data.forecast.list);
}

function updateTemperatureDisplay() {
    if (currentWeatherData) {
        const tempCelsius = currentWeatherData.main.temp;
        tempValueElem.textContent = isCelsius ? tempCelsius.toFixed(1) : ((tempCelsius * 9/5) + 32).toFixed(1);
        tempUnitToggle.textContent = isCelsius ? '°C/°F Change' : '°F/°C Change';
        
        // Update forecast temperatures as well
        updateForecast(currentWeatherData.forecast.list);
    }
}

function updateWeatherIcon(weatherId) {
    weatherIconElem.className = 'weather-icon';
    if (weatherId >= 200 && weatherId < 300) {
        weatherIconElem.classList.add('fa-solid', 'fa-cloud-bolt'); // Thunderstorm
    } else if (weatherId >= 300 && weatherId < 400) {
        weatherIconElem.classList.add('fa-solid', 'fa-cloud-rain'); // Drizzle
    } else if (weatherId >= 500 && weatherId < 600) {
        weatherIconElem.classList.add('fa-solid', 'fa-cloud-showers-heavy'); // Rain
    } else if (weatherId >= 600 && weatherId < 700) {
        weatherIconElem.classList.add('fa-solid', 'fa-snowflake'); // Snow
    } else if (weatherId >= 700 && weatherId < 800) {
        weatherIconElem.classList.add('fa-solid', 'fa-smog'); // Atmosphere (Mist, Smoke, Haze etc.)
    } else if (weatherId === 800) {
        weatherIconElem.classList.add('fa-solid', 'fa-sun'); // Clear
    } else if (weatherId > 800) {
        weatherIconElem.classList.add('fa-solid', 'fa-cloud'); // Clouds
    }
}

function updateBackground(weatherId, iconCode) {
    // Remove all previous background classes to reset
    document.body.className = '';
    
    if (weatherId >= 200 && weatherId < 600) {
        document.body.classList.add('rainy');
    } else if (weatherId >= 600 && weatherId < 700) {
        document.body.classList.add('snowy');
    } else if (weatherId >= 700 && weatherId < 800) {
        document.body.classList.add('hazy');
    } else if (weatherId === 800) {
        // Check if it's day or night based on the icon code
        if (iconCode.includes('d')) {
            document.body.classList.add('sunny');
        } else {
            // This is a placeholder for a night background, you can add a class for it
            document.body.style.background = 'linear-gradient(135deg, #1d2b3a, #0d1a2d)';
        }
    } else if (weatherId > 800) {
        document.body.classList.add('cloudy');
    } else {
      // Default to the animated cloud background
      document.body.style.background = null;
    }
}

function updateForecast(forecastData) {
    forecastContainer.innerHTML = ''; // Clear previous forecast
    const dailyData = {};

    // Group data by day and select the data closest to noon (12:00 PM) for each day
    forecastData.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        const hour = date.getHours();

        // Check if data for this day already exists
        if (!dailyData[dateString]) {
             dailyData[dateString] = {
                data: item,
                timeDiff: Math.abs(hour - 12)
            };
        } else {
            // If new data point is closer to noon, replace the old one
            const newTimeDiff = Math.abs(hour - 12);
            if (newTimeDiff < dailyData[dateString].timeDiff) {
                dailyData[dateString] = {
                    data: item,
                    timeDiff: newTimeDiff
                };
            }
        }
    });

    // Render forecast cards for the next 5 days
    const nextFiveDays = Object.values(dailyData).map(item => item.data).slice(0, 5);
    currentWeatherData.dailyForecast = nextFiveDays;

    nextFiveDays.forEach((data, index) => {
        const date = new Date(data.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = isCelsius ? data.main.temp : ((data.main.temp * 9/5) + 32);
        
        const card = document.createElement('div');
        card.classList.add('forecast-card');
        card.setAttribute('data-index', index); // Add an index to reference the data
        card.innerHTML = `
            <p class="day">${dayName}</p>
            <i class="fa-solid ${getForecastIconClass(data.weather[0].icon)}"></i>
            <p class="forecast-temp">${temp.toFixed(0)}°</p>
        `;
        forecastContainer.appendChild(card);
    });
}

function showForecastDetails(data) {
    const date = new Date(data.dt * 1000);
    modalDayElem.textContent = date.toLocaleDateString('en-US', { weekday: 'long' });
    modalDateElem.textContent = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const temp = isCelsius ? data.main.temp : ((data.main.temp * 9/5) + 32);
    modalTempValueElem.textContent = temp.toFixed(1);
    modalTempUnitElem.textContent = isCelsius ? '°C' : '°F';
    
    modalDescriptionElem.textContent = data.weather[0].description;
    
    modalWindSpeedElem.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    modalHumidityElem.textContent = `${data.main.humidity}%`;
    modalCloudsElem.textContent = `${data.clouds.all}%`;
    
    let rainVolume = '0 mm';
    if (data.rain && data.rain['3h']) {
        rainVolume = `${data.rain['3h']} mm`;
    } else if (data.snow && data.snow['3h']) {
        rainVolume = `${data.snow['3h']} mm`;
    }
    modalRainElem.textContent = rainVolume;

    // Update modal icon
    modalIconElem.className = 'weather-icon';
    modalIconElem.classList.add('fa-solid', getForecastIconClass(data.weather[0].icon));
    
    forecastModal.style.display = 'flex';
}

function getForecastIconClass(iconCode) {
    // Simplified icon mapping based on OpenWeatherMap icon codes
    if (iconCode.includes('01')) return 'fa-sun'; // Clear sky
    if (iconCode.includes('02')) return 'fa-cloud-sun'; // Few clouds
    if (iconCode.includes('03') || iconCode.includes('04')) return 'fa-cloud'; // Scattered/broken clouds
    if (iconCode.includes('09') || iconCode.includes('10')) return 'fa-cloud-showers-heavy'; // Drizzle/Rain
    if (iconCode.includes('11')) return 'fa-cloud-bolt'; // Thunderstorm
    if (iconCode.includes('13')) return 'fa-snowflake'; // Snow
    if (iconCode.includes('50')) return 'fa-smog'; // Mist/Haze
    return 'fa-question'; // Fallback
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    timeElem.textContent = `${hours}:${minutes}:${seconds}`;
}

function renderSavedCities() {
    savedCitiesList.innerHTML = '';
    savedCities.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        savedCitiesList.appendChild(li);
    });
}

// Initial fetch for a default city
document.addEventListener('DOMContentLoaded', () => {
    renderSavedCities();
    fetchWeather(savedCities[0] || 'New York');
});

