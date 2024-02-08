import Navigo from 'navigo';
const router = new Navigo('/');
export default router;
import {
  addStartDOMStructureFn,
  addMainDOMStructureFn,
  headerNavigation,
  // login,
} from './main';
import { accountsList } from './account';
import { getAccountDetailInfo } from './account-details';
import { getAccountTransactionsDetailInfo } from './transactions-history';
import { getCurrencies, closeCurrencySocket } from './currencies';
import { getATMmap } from './atmmap';
import '../css/style.css';

// Функция маршрутизации
export function mainRoute() {
  // Определение маршрутов
  router
    // Корневой путь
    .on('/', function () {
      addStartDOMStructureFn();
    })
    // Аутентификация
    // .on('/login', async function () {
    //   addStartDOMStructureFn();
    //   await login();
    // })
    // Переключение на вкладку счетов
    .on('/accounts', async function () {
      headerNavigation();
      addMainDOMStructureFn();
      document
        .getElementById('navRefAccs')
        .classList.add('header__ref-item-selected');
      await accountsList();
    })
    // Переключение на детализированную информацию о транзакциях счета
    .on('/accounts/:accountId/history', async function (params) {
      // Используйте регулярное выражение для извлечения только цифр до '/history'
      const accountId = params.data.accountId.match(/^(\d+)/)[0];
      headerNavigation();
      addMainDOMStructureFn();
      await getAccountTransactionsDetailInfo(accountId);
    })
    // Переключение на детализированную информацию о счете
    .on('/accounts/:accountId', async function (params) {
      // Здесь params.accountId будет содержать номер счета
      headerNavigation();
      addMainDOMStructureFn();
      await getAccountDetailInfo(params.accountId);
    })
    // Переключение на вкладку валют
    .on(
      '/all-currencies',
      async function () {
        headerNavigation();
        addMainDOMStructureFn();
        document
          .getElementById('navRefCurrencies')
          .classList.add('header__ref-item-selected');
        await getCurrencies();
      },
      {
        leave: async function (done) {
          closeCurrencySocket();
          done();
        },
      },
    )
    // Переключение на вкладку карты банкоматов
    .on('/banks', async function () {
      headerNavigation();
      addMainDOMStructureFn();
      document
        .getElementById('navRefATMs')
        .classList.add('header__ref-item-selected');
      await getATMmap();
    })
    .resolve();
}

export function correctRouting(element, route) {
  if (router.lastResolved() && router.lastResolved().url === route) {
    element.preventDefault();
    return;
  } else {
    element.preventDefault();
    router.navigate(route);
  }
}
