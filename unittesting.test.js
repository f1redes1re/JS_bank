import RequestsAPI from './src/frontend/requests';
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

beforeEach(() => {
  fetchMock.resetMocks();
});

test('Тестирование авторизации', async () => {
  const fakeToken = 'authToken';
  // Мокируем ответ сервера с ожидаемой структурой данных
  fetchMock.mockResponseOnce(JSON.stringify({ payload: { token: fakeToken } }));

  const login = 'developer';
  const password = 'skillbox';

  // Ожидаем, что промис будет успешно решен и в результате будет токен
  await expect(RequestsAPI.authorization(login, password)).resolves.toBe(
    fakeToken,
  );
});

test('Тестирование получения список счетов', async () => {
  const accounts = [
    {
      account: '74213041477477406320783754',
      balance: 0,
      transactions: [],
    },
  ];

  // Мокируем ответ сервера с ожидаемым списком счетов
  fetchMock.mockResponseOnce(JSON.stringify(accounts));

  // Вызываем функцию getAccounts с тестовым токеном
  const result = await RequestsAPI.getAccounts('test-token');

  // Проверяем, что результат соответствует ожидаемому списку счетов
  expect(result).toEqual(accounts);
});

test('Тестирование перевода со счета на счет', async () => {
  // Изначальное состояние счетов
  // eslint-disable-next-line no-unused-vars
  const initialAccounts = [
    {
      account: '74213041477477406320783754',
      balance: 100,
      transactions: [],
    },
    {
      account: '84213041477477406320783751',
      balance: 50,
      transactions: [],
    },
  ];

  // Ожидаемое состояние счетов после перевода
  const updatedAccounts = [
    {
      account: '74213041477477406320783754',
      balance: 0,
      transactions: [
        // Пример транзакции после перевода средств
        {
          amount: -100,
          date: '2021-09-11T23:00:44.486Z',
          from: '74213041477477406320783754',
          to: '84213041477477406320783751',
        },
      ],
    },
    {
      account: '84213041477477406320783751',
      balance: 150,
      transactions: [
        // Пример транзакции после получения средств
        {
          amount: 100,
          date: '2021-09-11T23:00:44.486Z',
          from: '74213041477477406320783754',
          to: '84213041477477406320783751',
        },
      ],
    },
  ];

  // Мокируем ответ сервера для перевода средств
  fetchMock.mockResponseOnce(() =>
    Promise.resolve(JSON.stringify({ success: true })),
  );

  // Вызываем функцию transferFunds с данными для перевода
  const transferResult = await RequestsAPI.transferFunds(
    '74213041477477406320783754',
    '84213041477477406320783751',
    100,
    'test-token',
  );

  // Проверяем, что результат успешен
  expect(transferResult.success).toBe(true);

  // Мокируем ответ сервера для получения обновленной информации о счетах после перевода
  fetchMock.mockResponseOnce(() =>
    Promise.resolve(JSON.stringify(updatedAccounts)),
  );

  // Вызываем функцию getAccounts с тестовым токеном для получения обновленных данных
  const accountsResult = await RequestsAPI.getAccounts('test-token');

  // Проверяем, что обновленный список счетов соответствует ожидаемому
  expect(accountsResult).toEqual(updatedAccounts);
});

test('Функция должна осуществить перевод со вновь созданного счета', async () => {
  // Создаем новый счет
  const newAccountResponse = {
    account: '74213041477477406320783754',
    balance: 0,
    transactions: [],
  };

  // Мокируем ответ сервера при создании нового счета
  fetchMock.mockResponseOnce(JSON.stringify([newAccountResponse]));

  // Вызываем функцию createAccount с тестовым токеном
  const newAccount = await RequestsAPI.createAccount('test-token');

  // Проверяем, что новый счет был создан
  expect(newAccount).toEqual([newAccountResponse]);

  // Мокируем успешный ответ сервера для перевода средств с нового счета
  fetchMock.mockResponseOnce(JSON.stringify({ success: true }));

  // Определяем сумму для перевода
  const amountToTransfer = 1234;
  // Адресат перевода - это другой счет (предполагается, что он уже существует)
  const recipientAccount = '61253747452820828268825011';

  // Вызываем функцию transferFunds для перевода средств с нового счета
  const transferResult = await RequestsAPI.transferFunds(
    newAccountResponse.account,
    recipientAccount,
    amountToTransfer,
    'test-token',
  );

  // Проверяем, что результат перевода успешен
  expect(transferResult.success).toBe(true);

  // Здесь мы могли бы продолжить и мокировать запрос к API для проверки состояния счета после перевода,
  // но, поскольку дата динамична, мы опускаем этот шаг в тесте.
});
