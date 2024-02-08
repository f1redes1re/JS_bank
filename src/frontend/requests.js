// Инициализация ссылки на сервер
const SERVER_URL = 'http://localhost:3000';

// Запрос для осуществления входа в приложение
export default class RequestsAPI {
  constructor() { }

  // Функция авторизации
  static async authorization(login, password) {
    const response = await fetch(SERVER_URL + '/login', {
      method: 'POST',
      body: JSON.stringify({
        login,
        password,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (response.ok) {
      if (result.error) {
        throw new Error(result.error);
      } else {
        localStorage.setItem('authToken', result.payload.token);
        console.log(result.payload.token);
        return result.payload.token;
      }
    } else {
      throw new Error('Network error');
    }
  }

  // Функция получения счетов пользователя
  static async getAccounts(token) {
    return await fetch(SERVER_URL + '/accounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      },
    }).then((res) => res.json());
  }

  // Функция получения информации о расположении банкоматов для карты
  static async getBanks() {
    return await fetch(SERVER_URL + '/banks').then((data) => data.json());
  }

  // Функция создания счета
  static async createAccount(token) {
    return await fetch(SERVER_URL + '/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      },
    }).then((res) => res.json());
  }

  // Функция получения информации о счете
  static async getAccount(id, token) {
    return await fetch(SERVER_URL + `/account/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      },
    }).then((res) => res.json());
  }

  // Функция перевода средств с одного счета на другой
  static async transferFunds(from, to, amount, token) {
    return await fetch(SERVER_URL + '/transfer-funds', {
      method: 'POST',
      body: JSON.stringify({
        from,
        to,
        amount,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      },
    }).then((res) => res.json());
  }

  // Функция получения валют счета
  static async getCurrencyAccounts(token) {
    return await fetch(SERVER_URL + '/currencies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      },
    }).then((data) => data.json());
  }

  // Функция открытия вебсокета изменения курсов валют
  static async getChangedCurrency() {
    return new WebSocket('ws://localhost:3000/currency-feed');
  }

  // Функция получения наименований всех известных валют
  static async getKnownCurrencies() {
    return await fetch(SERVER_URL + '/all-currencies').then((data) =>
      data.json(),
    );
  }

  // Функция обмена валют
  static async exchangeCurrency(from, to, amount, token) {
    return await fetch(SERVER_URL + '/currency-buy', {
      method: 'POST',
      body: JSON.stringify({
        from,
        to,
        amount,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${token}`,
      },
    }).then((res) => res.json());
  }
}
