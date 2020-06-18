const controller = document.querySelector('.j-controller');
const box = document.querySelector('.j-box');
const buttons = document.querySelector('.j-buttons');

const clickEventFactory = () => {
  return {
    clickedButtons: {
      A: false,
      B: false
    },
    toString() { 
      return `2:${Number(this.clickedButtons.A)}:${Number(this.clickedButtons.B)}`
    },
    anyPressed() {
      return this.clickedButtons.A || this.clickedButtons.B
    }
  }
}

if (!window.WebSocket) {
	document.body.innerHTML = 'WebSocket в этом браузере не поддерживается.';
}

// создать подключение
const socket = new WebSocket('ws://localhost:8081');

// обработчик входящих сообщений
socket.onmessage = function(event) {
  const incomingMessage = event.data;
  showMessage(incomingMessage); 
};

// показать сообщение в консоли браузера
function showMessage(message) {
  console.log(message);
}

// обработка касаний кнопок

buttons.addEventListener('touchstart', e => {
  cevent = clickEventFactory()
  
  for (let i = 0; i < e.targetTouches.length; i++) {
    const touch = e.targetTouches.item(i)
    cevent.clickedButtons.A = cevent.clickedButtons.A || touch.target.dataset.type === 'A'
    cevent.clickedButtons.B = cevent.clickedButtons.B || touch.target.dataset.type === 'B'
  }

  if (!cevent.anyPressed()) {
    return
  }

  socket.send(cevent.toString())
});


const formString = (x, y, distance) => {
  return (`1:${(x > 0 && y > 0) ? 1 : 0}` +
         `:${(x < 0 && y > 0) ? 1 : 0}` +
         `:${(x < 0 && y < 0) ? 1 : 0}` +
         `:${(x > 0 && y < 0) ? 1 : 0}` +
         ` [${distance}]`);
};
const getCoords = (elem) => {
  const elemCoords = elem.getBoundingClientRect();

  return {
    top: elemCoords.top + pageYOffset,
    left: elemCoords.left + pageXOffset,
    width: elemCoords.width,
    height: elemCoords.height
  }
};
const insideCircle = (x,y) => {
  return (x*x + y*y <= 1);
};

const coords = getCoords(controller);
const coordsBox = getCoords(box);

const controllerTouchMoveHandler = (e, shiftX, shiftY) => {
  const styleLeft = e.changedTouches[0].pageX - coordsBox.left - shiftX;
  const styleTop = e.changedTouches[0].pageY - coordsBox.top - shiftY;

  const radius = coordsBox.height/2;

  const horizontalDistanceFromCenter = styleLeft - coordsBox.width/2 + coords.width/2
  const verticalDistanceFromCenter = styleTop - coordsBox.height/2 + coords.height/2

  const distanceFromCenter = Math.sqrt(Math.pow(horizontalDistanceFromCenter, 2) + Math.pow(verticalDistanceFromCenter, 2))

  const sinus = Math.abs(verticalDistanceFromCenter) / distanceFromCenter
  
  const displayDistanceFromCenter = Math.min(distanceFromCenter, radius);
  const normalizedDistanceFromCenter = Math.ceil(displayDistanceFromCenter / radius * 100);

  let displayY = sinus * displayDistanceFromCenter;
  if (verticalDistanceFromCenter < 0) {
    displayY = -displayY
  }
  displayY += radius - shiftY

  let displayX = Math.sqrt(1 - Math.pow(sinus, 2)) * displayDistanceFromCenter;
  if (horizontalDistanceFromCenter < 0) {
    displayX = -displayX
  }
  displayX += radius - shiftX
  
  const coordX = horizontalDistanceFromCenter / radius;
  const coordY = verticalDistanceFromCenter / radius;
  
  controller.style.left = `${displayX}px`;
  controller.style.top = `${displayY}px`;


  const value = formString(coordX, coordY, normalizedDistanceFromCenter);
  return value;
}


const controllerTouchEndHandler = e => {
  document.ontouchmove = null;
  controller.style.left = `calc(50% - ${coords.width}px / 2)`;
  controller.style.top = `calc(50% - ${coords.height}px / 2)`;
  controller.ontouchend = null;
  return (`1:0:0:0:0 [0]`);
}

controller.addEventListener('touchstart', e => {

  const shiftX = e.changedTouches[0].pageX - coords.left;
  const shiftY = e.changedTouches[0].pageY - coords.top;
  
  document.ontouchmove = (e) => {
    socket.send(controllerTouchMoveHandler(e, shiftX, shiftY));
  }
  
  controller.ontouchend = () => {
    socket.send(controllerTouchEndHandler());
  }
})
