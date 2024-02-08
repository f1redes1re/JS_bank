import { el, setChildren } from 'redom';
import RequestsAPI from './requests';
import { addLoader } from './main';

// Глобальная переменная для сокета изменения курсов валют
let changedCurrency;

// Глобальная переменная для состояния выполнения операции перевода
let isExchanging = false;

// Функция создания DOM для страницы курсов валют
export async function getCurrencies() {
  const accCurrenciesDetailInfo = (
    await RequestsAPI.getCurrencyAccounts(localStorage.getItem('authToken'))
  ).payload;

  const accountBodyHeader = document.querySelector('.main__acc-header');
  accountBodyHeader.textContent = 'Ваши счета';
  const accountBodyMiddle = document.querySelector('.main__account-middle');

  const accountBodyMiddleLeftWrap = el('div.main__account-middle-left');
  const accountBodyMiddleRightWrap = el('div.main__account-middle-right');
  const currChangeListHeader = el(
    'h3.main__curr-change-list-header',
    'Изменение курсов в реальном времени',
  );
  const currChangeList = el('ul.main__curr-change-list list-group list-reset');

  setChildren(
    accountBodyMiddleLeftWrap,
    addExchangeForm(accCurrenciesDetailInfo),
  );
  setChildren(accountBodyMiddleRightWrap, currChangeListHeader, currChangeList);
  setChildren(
    accountBodyMiddle,
    accountBodyMiddleLeftWrap,
    accountBodyMiddleRightWrap,
  );

  initializeLoaders(currChangeList);

  changedCurrency = await RequestsAPI.getChangedCurrency();
  addCurrencyChangeList(currChangeList);
  addAccountCurrencies(accCurrenciesDetailInfo);
}

// Функция добавления имеющихся на счету валют
async function addAccountCurrencies(someCurrencyInfo) {
  if (document.querySelector('.main__account-curr-container')) {
    document.querySelector('.main__account-curr-container').remove();
  }
  const accountCurrenciesListContainer = el('div.main__account-curr-container');
  const accountCurrenciesListHeader = el(
    'h3.main__account-curr-list-header',
    'Ваши валюты',
  );
  const accCurrenciesList = el(
    'ul.main__account-curr-list list-group list-reset',
  );
  for (let key in someCurrencyInfo) {
    if (someCurrencyInfo[key]) {
      let accCurrenciesListItem = el('li.main__account-curr-list-item');
      let accCurrenciesListItemInternalWrap = el(
        'div.main__account-curr-list-item-int-wrap d-flex justify-content-between',
      );
      let accCurrenciesItemName = el(
        'span.main__account-curr-list-item-currency-name',
        `${key}`,
      );
      let formattedAmount = formatNumberWithSpaces(
        someCurrencyInfo[key].amount,
      );
      let accCurrenciesItemAmount = el(
        'span.main__account-curr-list-item-currency-value',
        formattedAmount,
      );
      setChildren(
        accCurrenciesListItemInternalWrap,
        accCurrenciesItemName,
        accCurrenciesItemAmount,
      );
      setChildren(accCurrenciesListItem, accCurrenciesListItemInternalWrap);
      accCurrenciesList.append(accCurrenciesListItem);
    }
  }
  setChildren(
    accountCurrenciesListContainer,
    accountCurrenciesListHeader,
    accCurrenciesList,
  );
  document
    .querySelector('.main__account-middle-left')
    .prepend(accountCurrenciesListContainer);
}

// Функция форматирования написания числа с пробелами
export function formatNumberWithSpaces(x) {
  let parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

// Функция добавления формы обмена валют
function addExchangeForm(currecyInformation) {
  const exchangeFormContainer = el('div.main__exchange-form-container');
  const exchangeFormHeader = el(
    'h3.main__exchange-form-header',
    'Обмен валюты',
  );
  const exchangeForm = el(
    'form.main__exchange-form d-flex justify-content-between needs-validation',
    { id: 'exchangeForm' },
  );
  const exchangeFormCurrcheckWrap = el(
    'div.main__exchange-form-currcheck-wrap d-flex flex-column',
  );
  const exchangeFormCurrcheckWrapTop = el(
    'div.main__exchange-form-currcheck-wrap-top d-flex align-items-center',
  );
  const exchangeFormCurrcheckWrapBottom = el(
    'div.main__exchange-form-currcheck-wrap-bottom d-flex align-items-center',
  );
  const exchangeBtn = el(
    'button.main__exchange-form-btn btn btn-primary',
    'Обменять',
    { id: 'exchangeButton', type: 'submit' },
  );
  const exchangeFormLabelFromWrap = el(
    'div.main__exchange-form-currcheck-change-selection-wrap main__exchange-form-currcheck-change-selection-wrap-from',
  );
  const exchangeFormLabelFrom = el(
    'label.main__exchange-form-currcheck-label-text form-label',
    'Из',
    { for: 'selectToExchange' },
  );
  const exchangeFromBtn = el(
    'button.main__exchange-form-currcheck-change-select-btn main__exchange-form-currcheck-change-select-btn-from btn main__acc-form-btn-closed',
    { id: 'selectToExchange' },
  );
  const exchangeFromList = el(
    'ul.main__exchange-form-currcheck-change-ul-selection main__exchange-form-currcheck-change-ul-selection-exchange list-group list-reset',
    { id: 'selectToExchangeList', style: { display: 'none' } },
  );
  const exchangeFormLabelTo = el(
    'label.main__exchange-form-currcheck-label-text form-label',
    'в',
    {
      for: 'selectToReceive',
    },
  );
  const exchangeFormLabelToWrap = el(
    'div.main__exchange-form-currcheck-change-selection-wrap',
  );
  const exchangeToBtn = el(
    'button.main__exchange-form-currcheck-change-select-btn main__exchange-form-currcheck-change-select-btn-to btn main__acc-form-btn-closed',
    { id: 'selectToReceive' },
  );
  const exchangeToList = el(
    'ul.main__exchange-form-currcheck-change-ul-selection main__exchange-form-currcheck-change-ul-selection-receive list-group list-reset',
    { id: 'selectToReceiveList', style: { display: 'none' } },
  );
  const exchangeLabelSum = el(
    'label.main__exchange-form-currcheck-label-text main__exchange-form-currcheck-label-text-sum form-label',
    'Сумма',
    { for: 'exchangeResult' },
  );
  const exchangeInputSum = el(
    'input.main__exchange-form-currcheck-bottom-result form-control',
    {
      id: 'exchangeResult',
      placeholder: '0',
      autocomplete: 'off',
      required: 'true',
    },
  );

  setChildren(
    exchangeFormLabelFromWrap,
    exchangeFormLabelFrom,
    exchangeFromBtn,
    exchangeFromList,
  );
  setChildren(
    exchangeFormLabelToWrap,
    exchangeFormLabelTo,
    exchangeToBtn,
    exchangeToList,
  );
  setChildren(
    exchangeFormCurrcheckWrapTop,
    exchangeFormLabelFromWrap,
    exchangeFormLabelToWrap,
  );
  setChildren(
    exchangeFormCurrcheckWrapBottom,
    exchangeLabelSum,
    exchangeInputSum,
  );
  setChildren(
    exchangeFormCurrcheckWrap,
    exchangeFormCurrcheckWrapTop,
    exchangeFormCurrcheckWrapBottom,
  );
  setChildren(exchangeForm, exchangeFormCurrcheckWrap, exchangeBtn);
  setChildren(exchangeFormContainer, exchangeFormHeader, exchangeForm);

  addCurrenciesForExchangeInList(exchangeFromBtn, exchangeFromList);
  addCurrenciesForExchangeInList(exchangeToBtn, exchangeToList);

  exchangeBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Прервать функцию, если операция уже идёт
    if (isExchanging) {
      return;
    }

    // Установка флага состояния
    isExchanging = true;

    await exchangeFn(
      exchangeFromBtn,
      exchangeToBtn,
      exchangeFormCurrcheckWrapBottom,
      exchangeInputSum,
      currecyInformation,
    );

    // Сброс флага состояния
    isExchanging = false;
  });

  return exchangeFormContainer;
}

// Функция добавления функционала форме обмена валют
function addCurrencyListFunctionality(selectionBtn, selectionList) {
  const btnClassOpened = 'main__acc-form-btn-opened';
  const btnClassClosed = 'main__acc-form-btn-closed';
  selectionBtn.classList.add(btnClassClosed);

  selectionBtn.addEventListener('click', (event) => {
    event.preventDefault();
    selectionList.style.display = 'block';
    selectionBtn.classList.remove(btnClassClosed);
    selectionBtn.classList.add(btnClassOpened);
  });

  window.document.body.addEventListener('click', (event) => {
    if (
      (!selectionBtn.contains(event.target) &&
        !selectionList.contains(event.target)) ||
      selectionList.contains(event.target)
    ) {
      selectionList.style.display = 'none';
      selectionBtn.classList.remove(btnClassOpened);
      selectionBtn.classList.add(btnClassClosed);
    }
  });
}

// Функция обмена валюты
async function exchangeFn(
  exchangeCoinFrom,
  exchangeCoinTo,
  exchangeAmountInputWrap,
  exchangeAmountInput,
  currecyInformation,
) {
  let coinBalance;
  for (let key in currecyInformation) {
    if (key === exchangeCoinFrom.textContent) {
      coinBalance = currecyInformation[key].amount;
    }
  }
  if (
    validationSumFn(exchangeAmountInputWrap, exchangeAmountInput, coinBalance)
  ) {
    try {
      const token = localStorage.getItem('authToken');
      const changedAccountCurrencies = await RequestsAPI.exchangeCurrency(
        exchangeCoinFrom.textContent,
        exchangeCoinTo.textContent,
        exchangeAmountInput.value,
        token,
      );
      exchangeAmountInput.value = '';
      await addAccountCurrencies(changedAccountCurrencies.payload);
      // document.body.classList.remove('waiting-cursor');
    } catch (error) {
      console.error('Currency exchange failed:', error);
    }
  }
}

// Функция добавления списков валют в выпадающие списки (кнопки)
async function addCurrenciesForExchangeInList(selectionBtn, someList) {
  const allCurrencies = (await RequestsAPI.getKnownCurrencies()).payload;
  const sortedCurrencies = [...allCurrencies].sort((a, b) =>
    a.localeCompare(b),
  );
  selectionBtn.textContent = sortedCurrencies[0];

  for (let i = 0; i < sortedCurrencies.length; i++) {
    let exchangeTitleItem = el(
      `li.main__exchange-form-currcheck-change-ul-selection-item list-group-item`,
      `${sortedCurrencies[i]}`,
    );

    const ulItemClassReceive =
      'main__exchange-form-currcheck-change-ul-selection-item-receive';
    const ulItemClassExchange =
      'main__exchange-form-currcheck-change-ul-selection-item-exchange';

    selectionBtn.id === 'selectToReceive'
      ? exchangeTitleItem.classList.add(ulItemClassReceive)
      : exchangeTitleItem.classList.add(ulItemClassExchange);

    exchangeTitleItem.addEventListener('click', () => {
      let exchangeTitleItems = document.querySelectorAll(
        selectionBtn.id === 'selectToReceive'
          ? `.${ulItemClassReceive}`
          : `.${ulItemClassExchange}`,
      );

      // Переберите все элементы и удалите класс 'selected', если он есть
      exchangeTitleItems.forEach((item) => {
        item.classList.remove(
          'main__exchange-form-currcheck-change-ul-selection-item-selected',
        );
      });

      // Добавьте класс 'selected' текущему выбранному элементу
      exchangeTitleItem.classList.add(
        'main__exchange-form-currcheck-change-ul-selection-item-selected',
      );

      // Обновите текст кнопки с текущим выбором
      selectionBtn.textContent = exchangeTitleItem.textContent;
    });

    someList.append(exchangeTitleItem);
  }

  addCurrencyListFunctionality(selectionBtn, someList);
}

// Функция добавления строчек изменения курсов валют
async function addCurrencyChangeList(listOfCurrencyChanges) {
  let loadersRemaining = 17;
  changedCurrency.onmessage = function (event) {
    const data = JSON.parse(event.data);

    let currChangeListItem = el('li.main__curr-change-list-item');
    let currChangeListItemInternalWrap = el(
      'div.main__curr-change-list-item-int-wrap d-flex justify-content-between',
    );
    let currChangeListItemMonetsWrap = el(
      'div.main__curr-change-list-item-currency-wrap',
    );
    let currChangeListItemNameOfMonetFrom = el(
      'span.main__curr-change-list-item-currency-name',
      `${data.from} /`,
    );
    let currChangeListItemNameOfMonetTo = el(
      'span.main__curr-change-list-item-currency-name',
      ` ${data.to}`,
    );
    let currChangeListItemDots = el(
      'span.main__curr-change-list-item-currency-dots',
    );
    let currChangeListItemMonetRate = el(
      'span.main__curr-change-list-item-currency-value',
      `${data.rate}`,
    );

    if (loadersRemaining > 0) {
      listOfCurrencyChanges.children[17 - loadersRemaining].remove();
      loadersRemaining--;
    }

    listOfCurrencyChanges.prepend(currChangeListItem);

    if (data.type === 'EXCHANGE_RATE_CHANGE') {
      console.log(
        `Курс из ${data.from} в ${data.to} теперь равен ${data.rate}.`,
      );
      if (data.change === 1) {
        currChangeListItemDots.classList.add(
          'main__curr-change-list-item-currency-dots-green',
        );
        currChangeListItemInternalWrap.classList.add('currency-changes-up');
      } else if (data.change === -1) {
        currChangeListItemDots.classList.add(
          'main__curr-change-list-item-currency-dots-red',
        );
        currChangeListItemInternalWrap.classList.add('currency-changes-down');
      } else {
        console.log('Курс не изменился.');
      }
    }

    setChildren(
      currChangeListItemMonetsWrap,
      currChangeListItemNameOfMonetFrom,
      currChangeListItemNameOfMonetTo,
    );
    setChildren(
      currChangeListItemInternalWrap,
      currChangeListItemMonetsWrap,
      currChangeListItemDots,
      currChangeListItemMonetRate,
    );
    setChildren(currChangeListItem, currChangeListItemInternalWrap);
    listOfCurrencyChanges.prepend(currChangeListItem);

    if (listOfCurrencyChanges.children.length > 17) {
      let children = listOfCurrencyChanges.children;
      let lastChild = children[children.length - 1];
      lastChild.remove();
    }
  };

  changedCurrency.onerror = function (error) {
    console.log(`WebSocket Error: ${error}`);
  };
}

// Функция закрытия сокета
export function closeCurrencySocket() {
  if (changedCurrency) {
    changedCurrency.close();
    changedCurrency = null;
  }
}

// Функция создания лоадеров на месте пока что пустых строк изменения курсов валют
function initializeLoaders(listOfCurrencyChanges) {
  for (let i = 0; i < 17; i++) {
    let loaderItem = el('li.main__curr-change-list-item');
    setChildren(loaderItem, addLoader());
    listOfCurrencyChanges.append(loaderItem);
  }
}

// Функция валидации обмена валюты
export function validationSumFn(someInputWrap, someInput, totalBalance) {
  if (document.querySelector('.validation__error-message-sum')) {
    someInput.classList.remove('is-valid', 'is-invalid');
    document.querySelector('.validation__error-message-sum').remove();
  }

  let validationBootstrapClass;
  const validationMessage = el(
    'span.validation__error-message validation__error-message-sum text',
  );

  if (
    someInput.value.trim() !== '' &&
    Number(someInput.value.trim()) > 0 &&
    Number(someInput.value.trim()) <= Number(totalBalance)
  ) {
    validationBootstrapClass = 'is-valid';
    someInput.classList.add(validationBootstrapClass);
    setTimeout(() => {
      someInput.classList.remove(validationBootstrapClass);
      validationMessage.remove();
    }, 2000);
    return true;
  } else {
    if (someInput.value === '') {
      validationMessage.textContent = 'Значение не введено';
    } else if (Number(someInput.value) < 0) {
      validationMessage.textContent = 'Введено отрицательное значение';
    } else if (Number(someInput.value) > Number(totalBalance)) {
      validationMessage.textContent = 'Значение превышает баланс валюты';
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
    return false;
  }
}
