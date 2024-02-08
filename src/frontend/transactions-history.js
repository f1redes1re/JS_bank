import { el, setChildren } from 'redom';
import { correctRouting } from './router';
import RequestsAPI from './requests';
import {
  buildChartBalanceDynamic,
  buildChartTransactionsDynamic,
  renderTransactions,
  addTransactionsList,
} from './account-details';

// Глобальная переменная для графиков на 12 месяцев
let FULL_YEAR_CHART = 12;

// Функция вывода полных графиков по счету
export async function getAccountTransactionsDetailInfo(id) {
  const accDetailInfo = (
    await RequestsAPI.getAccount(id, localStorage.getItem('authToken'))
  ).payload;

  const accountTopLeft = document.querySelector('.main__account-top-left');
  const accountTopRight = document.querySelector('.main__account-top-right');
  const accountBodyMiddle = document.querySelector('.main__account-middle');
  const accountBodyBottom = document.querySelector('.main__account-bottom');

  accountTopLeft.classList.add('flex-column', 'justify-content-between');
  accountBodyMiddle.classList.add('flex-column');
  accountBodyMiddle.classList.remove('mb-5');

  const accNum = el('span.main__acc-num text', `№ ${id}`);
  const accHeader = document.querySelector('.main__acc-header');
  accHeader.textContent = 'История баланса';
  const turnBackBtn = el(
    'button.main__btn-back btn btn-primary',
    'Вернуться назад',
  );
  const accTransactionsListContainer = el('div.main__transactions-container');
  const accTransactionsListHeader = el(
    'h3.main__transactions-header',
    'История переводов',
  );
  const chartBarBalanceContainer = el(
    'div.main__chart-wrapper main__chart-wrapper-wide mb-5',
    { id: 'myChartContainerTransactionsDynamic2' },
  );
  const chartBarTransactionsContainer = el(
    'div.main__chart-wrapper main__chart-wrapper-wide',
    { id: 'myChartContainerTransactionsDynamic3' },
  );
  const chartBarBalance = el('canvas.main__chart-bar main__chart-bar-wide', {
    id: 'myChart2',
  });
  const chartBarTransactions = el(
    'canvas.main__chart-bar main__chart-bar-wide',
    { id: 'myChart3' },
  );

  turnBackBtn.addEventListener('click', (e) => {
    correctRouting(e, `/accounts/${id}`);
  });

  // Обновление суммы баланса счета
  const accBalance = accDetailInfo.balance;
  const accBalanceContainer = el('div.main__acc-balance-container text');
  const accBalanceText = el('span.main__acc-balance-text text', 'Баланс');
  const accBalanceSum = el(
    'span.main__acc-balance-sum',
    `${accBalance.toLocaleString('ru-RU')} ₽`,
  );

  setChildren(chartBarBalanceContainer, chartBarBalance);
  setChildren(chartBarTransactionsContainer, chartBarTransactions);
  setChildren(accBalanceContainer, accBalanceText, accBalanceSum);
  setChildren(accountTopLeft, accHeader, accNum);
  setChildren(accountTopRight, turnBackBtn, accBalanceContainer);
  setChildren(
    accountBodyMiddle,
    chartBarBalanceContainer,
    chartBarTransactionsContainer,
  );
  setChildren(
    accTransactionsListContainer,
    accTransactionsListHeader,
    addTransactionsList(accDetailInfo),
  );
  setChildren(accountBodyBottom, accTransactionsListContainer);

  // Построение графиков
  buildChartBalanceDynamic(
    accDetailInfo,
    'myChartContainerTransactionsDynamic2',
    'myChart2',
    FULL_YEAR_CHART,
    accDetailInfo.balance,
  );

  buildChartTransactionsDynamic(
    accDetailInfo,
    'myChartContainerTransactionsDynamic3',
    'myChart3',
    FULL_YEAR_CHART,
  );

  // Перерисовка списка транзакции с 10 на 25
  renderTransactions(accDetailInfo, 25);
}
