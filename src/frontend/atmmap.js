import { el, setChildren } from 'redom';
import RequestsAPI from './requests';
import { addLoader, deleteLoader } from './main';

// Функция создания DOM для карты
export async function getATMmap() {
  if (document.querySelector('.main__atm-map')) {
    document.querySelector('.main__atm-map').innerHTML = '';
  } else {
    const accountBodyTop = document.querySelector('.main__account-top');
    const accountBodyMiddle = document.querySelector('.main__account-middle');
    const accountBodyBottom = document.querySelector('.main__account-bottom');

    const atmMapHeader = el('h1.main__acc-header', 'Карта банкоматов');
    setChildren(accountBodyTop, atmMapHeader);

    const mapContainer = el('div.main__atm-map', { id: 'map' });

    setChildren(accountBodyBottom);
    setChildren(accountBodyMiddle, mapContainer);
    setChildren(mapContainer, addLoader());
    addMapScript();
  }
}

// Функция запуска скрипта создания карты яндекса
export function initMapScript() {
  destroyMap();

  let mapInitTimer = setTimeout(async () => {
    // Проверка существует ли элемент с ID 'map'
    let mapElement = document.getElementById('map');
    if (!mapElement) {
      clearTimeout(mapInitTimer);
      // Прекратить инициализацию, если элемент не найден
      return;
    }

    deleteLoader();
    // eslint-disable-next-line no-undef
    let myMap = new ymaps.Map(
      'map',
      {
        center: [55.76, 37.64],
        zoom: 10,
        type: 'yandex#map',
        controls: ['searchControl', 'trafficControl', 'typeSelector'],
        suppressMapOpenBlock: true,
      },
      {
        searchControlProvider: 'yandex#search',
      },
    );

    // Подключение поиска
    let searchControl = myMap.controls.get('searchControl');
    searchControl.options.set({ size: 'large', float: 'left' });

    // Установка типа карты
    let typeSelector = myMap.controls.get('typeSelector');
    typeSelector.options.set({ size: 'small' });

    // Включение отображения пробок
    let trafficControl = myMap.controls.get('trafficControl');
    trafficControl.state.set('trafficShown', false);

    // eslint-disable-next-line no-undef
    const objectManager = new ymaps.ObjectManager({
      // Чтобы метки начали кластеризоваться, выставляем опцию.
      clusterize: true,
      // ObjectManager принимает те же опции, что и кластеризатор.
      gridSize: 32,
      clusterDisableClickZoom: true,
    });

    // Чтобы задать опции одиночным объектам и кластерам, обратимся к дочерним коллекциям ObjectManager.
    objectManager.objects.options.set('preset', 'islands#greenDotIcon');
    objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');
    myMap.geoObjects.add(objectManager);

    // Пример использования:
    const myData = await RequestsAPI.getBanks();
    const yandexData = transformDataToYandexFormat(myData);

    objectManager.add(yandexData);
  }, 1000);

  // Сохранение идентификатора таймера, чтобы можно было его очистить при необходимости
  window.mapInitTimer = mapInitTimer;
}

// Функция удаления карты
function destroyMap() {
  if (window.myMap) {
    window.myMap.destroy();
    window.myMap = null;
  }
  // Очистить таймер инициализации карты, если он был установлен
  if (window.mapInitTimer) {
    clearTimeout(window.mapInitTimer);
  }
}

// Функция трансформации данных с сервера в данные, которые воспринимает карта яндекса
function transformDataToYandexFormat(data) {
  const transformed = {
    type: 'FeatureCollection',
    features: [],
  };

  if (data.payload && Array.isArray(data.payload)) {
    data.payload.forEach((point, index) => {
      point.name = 'Coin';
      const feature = {
        type: 'Feature',
        id: index,
        geometry: {
          type: 'Point',
          coordinates: [point.lat, point.lon],
        },
        properties: {
          balloonContentHeader:
            `<font size=3><b>${point.name} ` + (index + 1) + '</b></font>',
          balloonContentBody:
            '<p>Координаты: ' + point.lat + ', ' + point.lon + '</p>',
          balloonContentFooter:
            '<font size=1>Информация предоставлена: </font> <strong>нашим сервисом</strong>',
          clusterCaption: 'Метка ' + `${point.name}`,
          hintContent: 'Точка ' + `${point.name}`,
        },
      };
      transformed.features.push(feature);
    });
  }

  return transformed;
}

// Функция добавления скрипта для карты яндекса в head
function addMapScript() {
  const initializeMap = () => {
    // eslint-disable-next-line no-undef
    ymaps.ready(initMapScript);
  };

  if (window.ymaps) {
    initializeMap();
  } else {
    if (!document.head.querySelector('#mapScript')) {
      const mapScript = el('script', {
        src: 'https://api-maps.yandex.ru/2.1/?apikey=9aa8650c-b9cd-4654-8cc8-d776e2bcb7db&lang=ru_RU',
        id: 'mapScript',
        type: 'text/javascript',
      });
      document.head.appendChild(mapScript);

      mapScript.onload = initializeMap;
    }
  }
}
