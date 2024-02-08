import { el, setChildren } from 'redom';
import router from './router';
import { getAccountDetailInfo } from './account-details';
import RequestsAPI from './requests';
import { removeSelectedClassFromAllButtons } from './main';

// Массив для кэширования списка счетов
let cachedAccounts = [];

// Направление для сортировки
let isAscending = true;

// Функция добавления списка счетов пользователя
export async function accountsList() {
  const accountBodyMiddle = document.querySelector('.main__account-middle');
  const accountBodyTopLeft = document.querySelector('.main__account-top-left');
  const accountBodyTopRight = document.querySelector(
    '.main__account-top-right',
  );
  const accHeader = document.querySelector('.main__acc-header');
  accHeader.textContent = 'Ваши счета';

  const accountList = el('ul.main__account-list list-group');
  const accSortingForm = accountsSort();
  const accAddBtn = el(
    'button.main__acc-add-btn btn btn-primary',
    'Создать новый счёт',
  );

  accAddBtn.addEventListener('click', async () => {
    await RequestsAPI.createAccount(localStorage.getItem('authToken'));
    await loadAndRenderAccounts();
  });

  accountBodyTopLeft.append(accSortingForm);
  accountBodyTopRight.append(accAddBtn);
  accountBodyMiddle.append(accountList);

  await loadAndRenderAccounts();
}

// Функция добавления сортировки
export function accountsSort() {
  const accSortingForm = el('div.main__acc-form');
  const accSortBtn = el(
    'button.main__acc-form-btn main__acc-form-btn-closed btn',
    'Сортировка',
    { id: 'accSortBtn' },
  );
  const accSortList = el('ul.main__acc-ul-selection list-group', {
    id: 'accSortList',
  });
  const sortListItemNum = el(
    'li.main__acc-list-item list-group-item',
    'По номеру',
    { tabindex: '0' },
  );
  const sortListItemBalance = el(
    'li.main__acc-list-item list-group-item',
    'По балансу',
    { tabindex: '0' },
  );
  const sortListItemLastTransaction = el(
    'li.main__acc-list-item list-group-item',
    'По последней транзакции',
    { tabindex: '0' },
  );
  setChildren(
    accSortList,
    sortListItemNum,
    sortListItemBalance,
    sortListItemLastTransaction,
  );

  const sortListItems = [
    sortListItemNum,
    sortListItemBalance,
    sortListItemLastTransaction,
  ];

  accSortBtn.addEventListener('click', () => {
    accSortList.style.display = 'block';
    accSortBtn.classList.remove('main__acc-form-btn-closed');
    accSortBtn.classList.add('main__acc-form-btn-opened');
  });

  window.document.body.addEventListener('click', (e) => {
    if (e.target !== accSortBtn) {
      accSortList.style.display =
        accSortList.style.display === 'block'
          ? 'none'
          : accSortList.style.display;
      if (
        accSortBtn &&
        accSortBtn.classList.contains('main__acc-form-btn-opened')
      ) {
        accSortBtn.classList.remove('main__acc-form-btn-opened');
        accSortBtn.classList.add('main__acc-form-btn-closed');
      }
    }
  });

  sortListItems.forEach((element) => {
    element.addEventListener('click', () => {
      sortListItems.forEach((e) => {
        e.classList.remove('main__acc-list-item-selected');
      });
      element.classList.add('main__acc-list-item-selected');
    });
  });

  setChildren(accSortingForm, accSortBtn, accSortList);

  sortListItemNum.addEventListener('click', async () => {
    sortAccounts('num');
  });

  sortListItemBalance.addEventListener('click', async () => {
    sortAccounts('balance');
  });

  sortListItemLastTransaction.addEventListener('click', async () => {
    sortAccounts('lastTransaction');
  });

  return accSortingForm;
}

// Функция форматирования даты (месяц текстом)
export function formatingDateText(dateToFormat) {
  const date = new Date(dateToFormat);
  const monthNames = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  const day = date.getDate().toString().padStart(2, '0');
  const month = monthNames[date.getMonth() + 1];
  const year = date.getFullYear();
  const accLastTransaction = `${day} ${month} ${year}`;
  return accLastTransaction;
}

// Функция форматирования даты (месяц числом)
export function formatingDateNum(dateToFormat) {
  const date = new Date(dateToFormat);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const accLastTransaction = `${day}.${month}.${year}`;
  return accLastTransaction;
}

// Функция добавления информации о счетах в соответствующие формы
export function gettingAccountsInfo(accountsArray) {
  if (accountsArray) {
    for (let i = 0; accountsArray.length > i; i++) {
      const accNum = accountsArray[i].account;
      const accBalance = accountsArray[i].balance;

      let accLastTransaction;
      if (
        accountsArray[i].transactions &&
        accountsArray[i].transactions.length > 0
      ) {
        accLastTransaction = formatingDateText(
          accountsArray[i].transactions[0].date,
        );
      } else {
        accLastTransaction = '-';
      }

      const accList = document.querySelector('.main__account-list');

      let accListItem = el(
        'li.main__account-list-item list-group-item',
        el('h3.main__account-list-item-header', accNum),
        el(
          'span.main__account-list-item-balance',
          `${accBalance.toLocaleString('ru-RU')} ₽`,
        ),
        el(
          'span.main__account-list-item-lasttrans main__account-list-item-lasttrans-text',
          'Последняя транзакция:',
        ),
        el(
          'span.main__account-list-item-lasttrans main__account-list-item-lasttrans-data',
          `${accLastTransaction}`,
        ),
      );

      let accListItemBtn = el(
        'button.main__account-list-item-btn btn btn-primary',
        'Открыть',
      );

      accListItem.append(accListItemBtn);
      accList.append(accListItem);

      accListItemBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        // Сохраняем ID в localStorage
        localStorage.setItem('currentAccountId', accNum);
        router.navigate(`/accounts/${accNum}`, true);
        document.body.classList.add('waiting-cursor');
        await getAccountDetailInfo(accNum);
        removeSelectedClassFromAllButtons();
      });
    }
  }
}

// Функция отрисовки закешированных счетов + подгрузка с сервера
export async function loadAndRenderAccounts() {
  cachedAccounts = [
    ...(await RequestsAPI.getAccounts(localStorage.getItem('authToken')))
      .payload,
  ];
  if (document.querySelector('.spinner-wrap-custom')) {
    document.querySelector('.spinner-wrap-custom').remove();
  }
  renderAccounts(cachedAccounts);
}

// Функция отрисовки счетов
export function renderAccounts(accounts) {
  const accountList = document.querySelector('.main__account-list');

  if (accountList) {
    accountList.innerHTML = '';
    gettingAccountsInfo(accounts);
  }
}

// Функция сортировки счетов
function sortAccounts(criteria) {
  if (isAscending) {
    switch (criteria) {
      case 'num':
        cachedAccounts.sort((a, b) => a.account - b.account);
        break;
      case 'balance':
        cachedAccounts.sort((a, b) => a.balance - b.balance);
        break;
      case 'lastTransaction':
        cachedAccounts.sort((a, b) => {
          if (!a.transactions.length && b.transactions.length) return -1;
          if (a.transactions.length && !b.transactions.length) return 1;
          if (!a.transactions.length && !b.transactions.length) return 0;
          return (
            new Date(a.transactions[a.transactions.length - 1].date) -
            new Date(b.transactions[b.transactions.length - 1].date)
          );
        });
        break;
    }
  } else {
    switch (criteria) {
      case 'num':
        cachedAccounts.sort((a, b) => b.account - a.account);
        break;
      case 'balance':
        cachedAccounts.sort((a, b) => b.balance - a.balance);
        break;
      case 'lastTransaction':
        cachedAccounts.sort((a, b) => {
          if (!a.transactions.length && b.transactions.length) return 1;
          if (a.transactions.length && !b.transactions.length) return -1;
          if (!a.transactions.length && !b.transactions.length) return 0;
          return (
            new Date(b.transactions[b.transactions.length - 1].date) -
            new Date(a.transactions[a.transactions.length - 1].date)
          );
        });
        break;
    }
  }
  isAscending = !isAscending;
  renderAccounts(cachedAccounts);
}
