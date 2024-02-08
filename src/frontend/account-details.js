import { el, setChildren } from 'redom';
import router, { correctRouting } from './router';
import RequestsAPI from './requests';
import Chart from 'chart.js/auto';
import { formatingDateNum } from './account';
import { getAccountTransactionsDetailInfo } from './transactions-history';
import { addLoader, deleteLoader } from './main';
import { formatNumberWithSpaces, validationSumFn } from './currencies';

// Глобальные переменые
// Токен
const token = localStorage.getItem('authToken');

// Переменная для количества месяцев в графике динамики баланса
let HALF_YEAR_CHART = 6;

// Глобальная переменная для состояния выполнения операции перевода
let isExchanging = false;

// Функция добавления основной информации о счете
export async function getAccountDetailInfo(id) {
  // Получаем ID из localStorage, если параметр id не предоставлен
  let accountId = id || localStorage.getItem('currentAccountId');
  const accDetailInfo = (await RequestsAPI.getAccount(accountId, token))
    .payload;

  const getKnownAccounts = (await RequestsAPI.getAccounts(token)).payload;

  const accountBodyMiddle = document.querySelector('.main__account-middle');
  const accountBodyBottom = document.querySelector('.main__account-bottom');
  const accountTopLeft = document.querySelector('.main__account-top-left');
  const accountTopRight = document.querySelector('.main__account-top-right');
  const accHeader = document.querySelector('.main__acc-header');
  const accBalance = accDetailInfo.balance;

  const accNum = el('span.main__acc-num text', `${accountId}`);
  const turnBackBtn = el(
    'button.main__btn-back btn btn-primary',
    'Вернуться назад',
  );
  const accBalanceContainer = el('div.main__acc-balance-container text');
  const accBalanceText = el('span.main__acc-balance-text text', 'Баланс');
  const accBalanceSum = el(
    'span.main__acc-balance-sum',
    `${accBalance.toLocaleString('ru-RU')} ₽`,
  );
  const chartBarContainer = el(
    'div.main__chart-wrapper main__chart-wrapper-small',
    { id: 'myChartContainer' },
  );
  const chartBar = el('canvas.main__chart-bar', { id: 'myChart' });

  const accTransactionsListContainer = el('div.main__transactions-container');
  const accTransactionsListHeader = el(
    'h3.main__transactions-header',
    'История переводов',
  );

  accountBodyMiddle.classList.remove('flex-column');
  accountBodyMiddle.classList.add('mb-5');

  if (
    !accountTopLeft.classList.contains('flex-column', 'justify-content-between')
  ) {
    accountTopLeft.classList.add('flex-column', 'justify-content-between');
  }
  accHeader.textContent = 'Просмотр счёта';
  accNum.textContent = `№ ${accountId}`;

  turnBackBtn.addEventListener('click', (e) => {
    correctRouting(e, '/accounts');
  });

  setChildren(chartBarContainer, chartBar);
  setChildren(accBalanceContainer, accBalanceText, accBalanceSum);
  setChildren(
    accTransactionsListContainer,
    accTransactionsListHeader,
    addTransactionsList(accDetailInfo),
  );

  setChildren(accountTopLeft, accHeader, accNum);
  setChildren(accountTopRight, turnBackBtn, accBalanceContainer);

  setChildren(accountBodyMiddle, addMoneyTransferForm(), chartBarContainer);
  setChildren(accountBodyBottom, accTransactionsListContainer);

  buildChartBalanceDynamic(
    accDetailInfo,
    'myChartContainer',
    'myChart',
    HALF_YEAR_CHART,
    accDetailInfo.balance,
  );
  renderTransactions(accDetailInfo, 10);

  [chartBarContainer, accTransactionsListContainer].forEach((element) => {
    element.addEventListener('click', () => {
      router.navigate(`/accounts/${accountId}/history`, true);
      getAccountTransactionsDetailInfo(accountId);
    });
  });

  document.querySelector('.send-btn').addEventListener('click', async (e) => {
    e.preventDefault();

    // Прервать функцию, если операция уже идёт
    if (isExchanging) {
      return;
    }

    // Установка флага состояния
    isExchanging = true;

    const moneyTransferFormFieldWrapTop = document.querySelector(
      '.main__form-fields-container-top',
    );
    const moneyTransferFormFieldWrapBottom = document.querySelector(
      '.main__form-fields-container-bottom',
    );
    const moneyTransferFormInputReceiver =
      document.getElementById('accountInputId');
    const moneyTransferFormInputSum =
      document.getElementById('accountInputSum');

    const accNumberToSave = moneyTransferFormInputReceiver.value.trim();
    const sumOfMoneyToSend = moneyTransferFormInputSum.value.trim();

    // Валидация отправки денег
    if (
      validationReceiverFn(
        moneyTransferFormFieldWrapTop,
        moneyTransferFormInputReceiver,
        getKnownAccounts,
      ) &&
      validationSumFn(
        moneyTransferFormFieldWrapBottom,
        moneyTransferFormInputSum,
        accDetailInfo.balance,
      )
    ) {
      const accBalanceSum = document.querySelector('.main__acc-balance-sum');
      accBalanceSum.textContent = '';
      accBalanceSum.append(addLoader());
      document.querySelector('.spinner-border').classList.add('loader-for-sum');

      const newAccDetailInfo = (
        await RequestsAPI.transferFunds(
          accountId,
          accNumberToSave,
          sumOfMoneyToSend,
          token,
        )
      ).payload;

      const accBalance = newAccDetailInfo.balance;
      renderTransactions(newAccDetailInfo, 10);
      deleteLoader();
      moneyTransferFormInputReceiver.value = '';
      moneyTransferFormInputSum.value = '';
      accBalanceSum.textContent = `${accBalance.toLocaleString('ru-RU')} ₽`;

      // Обновление графика
      buildChartBalanceDynamic(
        newAccDetailInfo,
        'myChartContainer',
        'myChart',
        HALF_YEAR_CHART,
        accBalance,
      );

      // Автосохранение аккаунта
      saveAccount(accNumberToSave);
    }

    // Сброс флага состояния
    isExchanging = false;
  });

  document.body.classList.remove('waiting-cursor');
}

// Функция создания формы перевода средств с функционалом
function addMoneyTransferForm() {
  const moneyTransferForm = el('form.main__form-money-transfer');
  const moneyTransferFormHeader = el(
    'h3.main__form-money-transfer-header',
    'Новый перевод',
  );
  const moneyTransferFormFieldWrapTop = el(
    'div.main__form-fields-container main__form-fields-container-top',
  );
  const moneyTransferFormFieldWrapBottom = el(
    'div.main__form-fields-container main__form-fields-container-bottom',
  );
  const moneyTransferFormLabelReceiver = el(
    'label.receiver__sending-label receiver__sending-label-receiver',
    'Номер счёта получателя',
    { for: 'accountInputId' },
  );
  const moneyTransferFormLabelSum = el(
    'label.receiver__sending-label receiver__sending-label-sum',
    'Сумма перевода',
    { for: 'accountInputSum' },
  );
  const moneyTransferFormInputReceiver = el(
    'input.receiver__sending-input receiver__sending-input-acc-num form-control',
    {
      id: 'accountInputId',
      type: 'text',
      placeholder: 'Placeholder',
      autocomplete: 'off',
    },
  );
  const moneyTransferFormInputSum = el(
    'input.receiver__sending-input form-control',
    {
      id: 'accountInputSum',
      type: 'text',
      placeholder: 'Placeholder',
      autocomplete: 'off',
    },
  );
  const moneyTransferFormReceiverList = el(
    'ul.receiver__saved-acc-list list-group list-reset',
  );
  const moneyTransferFormSendBtn = el(
    'button.send-btn btn btn-primary',
    'Отправить',
    { type: 'submit' },
  );

  setChildren(
    moneyTransferFormFieldWrapTop,
    moneyTransferFormLabelReceiver,
    moneyTransferFormInputReceiver,
    moneyTransferFormReceiverList,
  );
  setChildren(
    moneyTransferFormFieldWrapBottom,
    moneyTransferFormLabelSum,
    moneyTransferFormInputSum,
  );
  setChildren(
    moneyTransferForm,
    moneyTransferFormHeader,
    moneyTransferFormFieldWrapTop,
    moneyTransferFormFieldWrapBottom,
    moneyTransferFormSendBtn,
  );

  window.document.body.addEventListener('click', (e) => {
    if (moneyTransferFormReceiverList) {
      if (e.target === moneyTransferFormInputReceiver) {
        renderSavedAccountsList();
        moneyTransferFormReceiverList.style.display = 'block';
        return;
      } else {
        moneyTransferFormReceiverList.style.display = 'none';
      }
    }
  });

  return moneyTransferForm;
}

// Функция получения ранее сохраненных счетов для автозаполнения
function getSavedAccounts() {
  const saved = localStorage.getItem('savedAccounts');
  return saved ? JSON.parse(saved) : [];
}

// Функция для сохранения нового номера счета в localStorage
function saveAccount(accountNumber) {
  const accounts = getSavedAccounts();

  // Проверяем, есть ли уже такой номер в массиве
  if (!accounts.includes(accountNumber)) {
    accounts.push(accountNumber);
    localStorage.setItem('savedAccounts', JSON.stringify(accounts));
  }
}

// Функция отрисовки ранее сохраненных счетов для автозаполнения
function renderSavedAccountsList() {
  const arr = getSavedAccounts();
  const moneyTransferFormInput = document.querySelector(
    '.receiver__sending-input-acc-num',
  );
  const savedAccList = document.querySelector('.receiver__saved-acc-list');
  savedAccList.innerHTML = '';
  arr.forEach((element) => {
    let savedAccListItem = el(
      'li.receiver__saved-acc-list-item list-group-item',
      `${element}`,
    );
    savedAccListItem.addEventListener('click', () => {
      moneyTransferFormInput.value = element;
    });
    savedAccList.appendChild(savedAccListItem);
  });
}

// Функция сокращения названий месяцев для графиков
function getMonthName(monthNumber) {
  const months = [
    'Янв',
    'Фев',
    'Мар',
    'Апр',
    'Май',
    'Июн',
    'Июл',
    'Авг',
    'Сент',
    'Окт',
    'Нояб',
    'Дек',
  ];
  return months[monthNumber - 1];
}

// Функция расчета данных для графика динамики баланса
function calculateMonthData(accountData, monthsNumber = 100) {
  accountData.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  const monthMap = new Map();

  // Вычисляем изменение баланса для каждой транзакции
  accountData.transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    const transactionsYear = transactionDate.getFullYear();
    const transactionsMonth = transactionDate.getMonth() + 1;
    const transactionsMonthAndYear = transactionsMonth + '.' + transactionsYear;
    let balanceChange = 0;

    if (
      transaction.to &&
      transaction.to === accountData.account &&
      transaction.from !== accountData.account
    ) {
      balanceChange += transaction.amount;
    } else if (
      transaction.from &&
      transaction.from === accountData.account &&
      transaction.to !== accountData.account
    ) {
      balanceChange -= transaction.amount;
    }

    if (monthMap.has(transactionsMonthAndYear)) {
      balanceChange += monthMap.get(transactionsMonthAndYear);
    }

    monthMap.set(transactionsMonthAndYear, balanceChange);
  });

  // Вычисляем кумулятивный баланс для каждого месяца
  let cumulativeBalance = 0;
  for (const month of monthMap.keys()) {
    cumulativeBalance += monthMap.get(month);
    monthMap.set(month, cumulativeBalance);
  }

  // Заполняем displayMonthMap последними monthsNumber элементами
  const lastMonths = [...monthMap.entries()].slice(-monthsNumber);
  const displayMonthMap = new Map(lastMonths);

  return displayMonthMap;
}

// Функция расчета данных для графика динамики транзакций
function calculateMonthDataTransactions(accountData, monthsNumber = 100) {
  accountData.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  const monthMap = new Map();

  accountData.transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    const transactionsYear = transactionDate.getFullYear();
    const transactionsMonth = transactionDate.getMonth() + 1;
    const transactionsMonthAndYear = `${transactionsMonth}.${transactionsYear}`;

    let counts = monthMap.get(transactionsMonthAndYear);
    if (!counts) {
      // 0 - входящие транзакции, 1 - исходящие
      counts = [0, 0];
    }

    if (
      transaction.to === accountData.account &&
      transaction.from !== accountData.account
    ) {
      counts[0]++;
    } else if (
      transaction.from === accountData.account &&
      transaction.to !== accountData.account
    ) {
      counts[1]++;
    }

    monthMap.set(transactionsMonthAndYear, counts);
  });

  // Выбираем последние monthsNumber месяцев из monthMap
  const lastMonths = Array.from(monthMap.entries()).slice(-monthsNumber);
  const displayMonthMap = new Map(lastMonths);

  return displayMonthMap;
}

// Функция построения графика динамики баланса
export function buildChartBalanceDynamic(
  accountData,
  chartContainerID,
  chartID,
  monthsNumber,
  maxAccBalance,
) {
  const chartBarContainer = document.getElementById(chartContainerID);
  const oldchartBar = document.getElementById(chartID);

  // Удалить старый график, если он существует
  if (oldchartBar) {
    oldchartBar.remove();
  }

  const chartBar = el('canvas.main__chart-bar', { id: 'myChart' });
  setChildren(chartBarContainer, chartBar);

  const displayMonthMap = calculateMonthData(accountData, monthsNumber);
  const monthNumbers = [...displayMonthMap.keys()].map((value) =>
    value.substring(0, 2),
  );
  const yearNumbers = [...displayMonthMap.keys()]
    .map((value) => value.substring(4, 8))
    .map((year) => year.slice(-2));
  const monthLabels = monthNumbers.map(getMonthName);
  const dates = monthLabels.map(
    (month, index) => `${month}.${yearNumbers[index]}`,
  );
  const monthBalance = [...displayMonthMap.values()];
  const maxBalance = Math.round(maxAccBalance);

  return new Chart(chartBar, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [
        {
          data: monthBalance,
          backgroundColor: '#116ACC',
        },
      ],
    },
    options: {
      layout: {
        padding: {
          left: 50,
          right: 25,
          top: 25,
          bottom: 20,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'Динамика баланса',
          font: {
            size: 20,
            weight: '700',
            lineHeight: '24px',
          },
          color: '#000000',
          align: 'start',
          padding: {
            top: 10,
            bottom: 20,
          },
        },
      },
      scales: {
        y: {
          position: 'right',
          beginAtZero: true,
          grid: {
            display: false,
          },
          ticks: {
            callback: function (value, index, values) {
              if (index === 0 || index === values.length - 1) {
                return formatNumberWithSpaces(value);
              }
              return '';
            },
          },
          min: 0,
          max: maxBalance,
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      elements: {
        bar: {
          borderRadius: 5,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

// Функция построения графика динамики транзакций
export function buildChartTransactionsDynamic(
  accountData,
  chartContainerID,
  chartID,
  monthsNumber = 100,
) {
  const chartBarContainer = document.getElementById(chartContainerID);
  const oldchartBar = document.getElementById(chartID);

  // Удалить старый график, если он существует
  if (oldchartBar) {
    oldchartBar.remove();
  }

  const chartBar = el('canvas.main__chart-bar', { id: 'myChart' });
  setChildren(chartBarContainer, chartBar);

  const monthData = calculateMonthDataTransactions(accountData, monthsNumber);
  const monthNumbers = [...monthData.keys()].map((value) =>
    value.substring(0, 2),
  );
  const yearNumbers = [...monthData.keys()]
    .map((value) => value.substring(4, 8))
    .map((year) => year.slice(-2));
  const monthLabels = monthNumbers.map(getMonthName);
  const dates = monthLabels.map(
    (month, index) => `${month}.${yearNumbers[index]}`,
  );

  const incomingTransactions = [...monthData.values()].map((value) => value[0]);
  const outgoingTransactions = [...monthData.values()].map((value) => value[1]);

  const maxTick = Math.max(
    ...Array.from(monthData.values()).map((arr) => Math.max(...arr)),
  );
  const midTick = maxTick / 2;

  return new Chart(chartBar, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Входящие',
          data: incomingTransactions,
          backgroundColor: 'green',
        },
        {
          label: 'Исходящие',
          data: outgoingTransactions,
          backgroundColor: 'red',
        },
      ],
    },
    options: {
      layout: {
        padding: {
          left: 50,
          right: 25,
          top: 25,
          bottom: 20,
        },
      },
      plugins: {
        title: {
          display: true,
          text: 'Соотношение входящих исходящих транзакций',
          align: 'start',
          font: {
            size: 20,
            weight: '700',
            lineHeight: '24px',
          },
          color: '#000000',
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          stacked: true,
          type: 'logarithmic',
          position: 'right',
          grid: {
            display: false,
          },
          ticks: {
            min: 1,
            stepSize: midTick,
            max: maxTick,
          },
        },
        x: {
          stacked: true,
          grid: {
            display: false,
          },
        },
      },
      elements: {
        bar: {
          borderRadius: 5,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

// Функция создания таблицы транзакций
export function addTransactionsList(accountData) {
  accountData.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  const transactionsList = el(
    'table.main__transactions-table',
    el(
      'thead',
      el(
        'tr',
        el('th.main__trasactions-table-th', 'Счёт отправителя'),
        el('th.main__trasactions-table-th', 'Счёт получателя'),
        el('th.main__trasactions-table-th', 'Сумма'),
        el('th.main__trasactions-table-th', 'Дата'),
      ),
    ),
    el('tbody', { id: 'tableBody' }),
  );

  return transactionsList;
}

// Функция наполнения таблицы транзакций данными
export function renderTransactions(accountData, transactionsAmount) {
  let endIdx = Math.max(
    0,
    accountData.transactions.length - transactionsAmount,
  );
  const table = document.getElementById('tableBody');
  table.innerHTML = '';

  for (let i = accountData.transactions.length - 1; i >= endIdx; i--) {
    let colorTD;
    let signTD;

    if (accountData.transactions[i].to === accountData.account) {
      colorTD = 'green';
      signTD = '+';
    } else {
      colorTD = 'red';
      // eslint-disable-next-line no-unused-vars
      signTD = '-';
    }

    table.append(
      el(
        'tr',
        el(
          'td.main__transactions-table-td',
          `${accountData.transactions[i].from}`,
        ),
        el(
          'td.main__transactions-table-td',
          `${accountData.transactions[i].to}`,
        ),
        el(
          'td.main__transactions-table-td',
          `${signTD} ${accountData.transactions[i].amount.toLocaleString(
            'ru-RU',
          )}  ₽`,
          { style: { color: colorTD } },
        ),
        el(
          'td.main__transactions-table-td',
          `${formatingDateNum(accountData.transactions[i].date)}`,
        ),
      ),
    );
  }
}

// Функция валидации обмена валюты
function validationReceiverFn(someInputWrap, someInput, someArray) {
  if (document.querySelector('.validation__error-message-receiver')) {
    someInput.classList.remove('is-valid', 'is-invalid');
    document.querySelector('.validation__error-message-receiver').remove();
  }

  let validationBootstrapClass;
  const validationMessage = el(
    'span.validation__error-message validation__error-message-receiver text',
  );

  // Переменная для хранения состояния валидности
  let isValid = false;

  // Проверяем, что значение было введено
  if (someInput.value.trim() === '') {
    validationMessage.textContent = 'Значение не введено';
    someInputWrap.append(validationMessage);
    validationBootstrapClass = 'is-invalid';
    someInput.classList.add(validationBootstrapClass);
    setTimeout(() => {
      someInput.classList.remove(validationBootstrapClass);
      validationMessage.remove();
      someInput.value = '';
    }, 2000);
    return false; // Возвращаем false, так как значение не было введено
  } else {
    someArray.forEach((element) => {
      if (element.account === someInput.value) {
        validationBootstrapClass = 'is-valid';
        someInput.classList.add(validationBootstrapClass);
        setTimeout(() => {
          someInput.classList.remove(validationBootstrapClass);
          validationMessage.remove();
        }, 2000);
        isValid = true; // Изменяем значение переменной в случае успешной валидации
        return; // Прерываем forEach, возвращать из forEach ничего не нужно
      }
    });

    if (!isValid) {
      // Обработка ситуации, когда введённое значение не найдено в массиве
      if (someInput.value.length < 10) {
        validationMessage.textContent = 'Введен слишком короткий номер';
      } else {
        validationMessage.textContent = 'Введено некорректное значение';
      }
      someInputWrap.append(validationMessage);
      validationBootstrapClass = 'is-invalid';
      someInput.classList.add(validationBootstrapClass);
      setTimeout(() => {
        someInput.classList.remove(validationBootstrapClass);
        validationMessage.remove();
        someInput.value = '';
      }, 2000);
    }
  }

  return isValid; // Возвращаем результат валидации
}
