// Primer paso. Seleccionar todos los elementos que voy a utilizar mediante la manipulación del DOM.
const hourElement = document.querySelector('.hour');
const minuteElement = document.querySelector('.minute');
const secondElement = document.querySelector('.second');
const millisecondElement = document.querySelector('.millisecond');
const startButton = document.querySelector('.start');
const stopButton = document.querySelector('.stop');
const resetButton = document.querySelector('.reset');
const lapsTableBody = document.querySelector('.laps tbody');
const printTableButton = document.getElementById('print-table-button');
const tableToPrint = document.querySelector('table');

// Variables accesorias que se crean para poder trabajar.
let intervalId;
let startTime;
let elapsedTime = 0;
let running = false;
let lapCount = 1;

// Para evitar formatos desconocidos de la hora se crea esta función junto a converTimeToMilliseconds.
function formatTime(time) {
  return time < 10 ? `0${time}` : time;
}

function convertTimeToMilliseconds(timeString) {
  const timeComponents = timeString.split(':');
  const hours = parseInt(timeComponents[0], 10);
  const minutes = parseInt(timeComponents[1], 10);
  const seconds = parseFloat(timeComponents[2]);

  return ((hours * 3600 + minutes * 60 + seconds) * 1000).toFixed(3);
}

// 2º paso importante. Generar la función que resetea el tiempo que aparece en pantalla. ES EL CONTROL TEMPORAL.
function updateTimer() {
  const currentTime = Date.now();
  elapsedTime = currentTime - startTime;

  const hours = Math.floor(elapsedTime / 3600000);
  const minutes = Math.floor((elapsedTime % 3600000) / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);
  const milliseconds = elapsedTime % 1000;

  hourElement.textContent = formatTime(hours);
  minuteElement.textContent = formatTime(minutes);
  secondElement.textContent = formatTime(seconds);
  millisecondElement.textContent = formatTime(milliseconds);
}

// Función ACCESORIA para calcular la diferencia de tiempo entre dos registros. Nos permite decir el tiempo que ha pasado entre un click y el siguiente.
function calculateTimeDifference(previousTime, currentTime) {
  const timeDifference = currentTime - previousTime;

  const hours = Math.floor(timeDifference / 3600000);
  const minutes = Math.floor((timeDifference % 3600000) / 60000);
  const seconds = Math.floor((timeDifference % 60000) / 1000);
  const milliseconds = timeDifference % 1000;

  return `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}.${formatTime(milliseconds)}`;
}

// Función para calcular la velocidad en km/hora.
function calculateSpeed(distance, timeDifference) {
  // Convierte el tiempo de diferencia a milisegundos.
  const timeInMilliseconds = convertTimeToMilliseconds(timeDifference);

  // Calcula la velocidad en km/hora.
  const timeInSeconds = timeInMilliseconds / 1000;
  const speed = (distance / 1000) / (timeInSeconds / 3600); // Convertir metros a kilómetros, recordad que tomamos la distancia del select y esa distancia está en METROS.
  return speed.toFixed(2); // Redondear a 2 decimales. NO QUEREMOS QUE HAYA DECIMALES INFINITOS.
}

// 3º Paso. Función que se encarga del registro de las "vueltas" o series y te las lista en una tabla.
function addLap() {
  const newRow = document.createElement('tr');
  const lapCell = document.createElement('td');
  const timeCell = document.createElement('td');
  const differenceCell = document.createElement('td');
  const speedCell = document.createElement('td');

  lapCell.textContent = `Vuelta ${lapCount}`;
  timeCell.textContent = `${hourElement.textContent}:${minuteElement.textContent}:${secondElement.textContent}.${millisecondElement.textContent}`;

  if (lapCount > 1) {
    const previousTime = lapsTableBody.querySelector(`tr:nth-child(${lapCount - 1}) td:nth-child(2)`).textContent;
    const currentTime = `${hourElement.textContent}:${minuteElement.textContent}:${secondElement.textContent}.${millisecondElement.textContent}`;
    const timeDifference = calculateTimeDifference(convertTimeToMilliseconds(previousTime), convertTimeToMilliseconds(currentTime));
    differenceCell.textContent = timeDifference;

    // Obtener la distancia seleccionada y el tiempo de diferencia en milisegundos.
    const distanceSelect = document.getElementById('distance');
    const selectedDistance = parseInt(distanceSelect.value, 10);

    // Calcular y establecer la velocidad en la celda de velocidad. Hacemos uso de la función previamente creada.
    speedCell.textContent = `${calculateSpeed(selectedDistance, timeDifference)} km/h`;
  } else {
    differenceCell.textContent = "Este es el primer registro -- Calentamiento";
    speedCell.textContent = "--";
  }

  newRow.appendChild(lapCell);
  newRow.appendChild(timeCell);
  newRow.appendChild(differenceCell);
  newRow.appendChild(speedCell);
  lapsTableBody.appendChild(newRow);

  lapCount++;
}

// 4º Paso. Agregar al flujo del programa los disparadores. Los botones controlan el funcionamiento general.
startButton.addEventListener('click', () => {
  if (!running) {
    startTime = Date.now() - elapsedTime;
    intervalId = setInterval(updateTimer, 10);
    running = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    resetButton.disabled = false;
  }
});

stopButton.addEventListener('click', () => {
  if (running) {
    clearInterval(intervalId);
    running = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    resetButton.disabled = false;
    addLap();
  }
});

resetButton.addEventListener('click', () => {
  clearInterval(intervalId);
  running = false;
  elapsedTime = 0;
  lapCount = 1;
  hourElement.textContent = '00';
  minuteElement.textContent = '00';
  secondElement.textContent = '00';
  millisecondElement.textContent = '000';
  lapsTableBody.innerHTML = '';
  startButton.disabled = false;
  stopButton.disabled = true;
  resetButton.disabled = true;
});

//Función de impresión para permitir que la persona entrenada guarde los registros del día.

printTableButton.addEventListener('click', () => {
  let newWindow = window.open('', '_blank');
  newWindow.document.open();
  newWindow.document.write(`
    <html>
      <head>
        <title>Tabla de Tiempos</title>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
          }
          th, td {
            padding: 0.5rem;
            border-bottom: 1px solid #ccc;
          }
          th {
            background-color: #f3f3f3;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${tableToPrint.outerHTML}
      </body>
    </html>
  `);
  newWindow.document.close();
  newWindow.print();
});

document.addEventListener('keydown', event => {
  if (event.key === 'l' || event.key === 'L') {
    if (running) {
      addLap();
    }
  }
});
