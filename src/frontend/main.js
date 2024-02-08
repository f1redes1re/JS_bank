import { el, setChildren } from 'redom';
import router, { mainRoute, correctRouting } from './router';
import logo from '../assets/images/Logo.svg';
import RequestsAPI from './requests';
import '../css/style.css';

// Функция стартовой загрузки структуры DOM
export function addStartDOMStructureFn() {
  const headerRefContainer = document.querySelector('.container__header-ref');
  if (headerRefContainer) {
    headerRefContainer.innerHTML = '';
  }
  const containerBody = document.querySelector('.container__body');

  // Добавление формы входа в приложение
  setChildren(containerBody, entryForm());
}

// Функция загрузки основной структуры DOM
export function addMainDOMStructureFn() {
  const containerBody = document.querySelector('.container__body');
  if (containerBody) {
    const headerLogo = document.querySelector('.header__logo');
    headerLogo.src = logo;
    const accountBodyTop = el('div.main__account-top');
    const accountBodyTopLeft = el('div.main__account-top-left');
    const accountBodyTopRight = el('div.main__account-top-right');
    const accountBodyMiddle = el('div.main__account-middle');
    const accountBodyBottom = el('div.main__account-bottom');
    const accHeader = el('h1.main__acc-header');
    const loaderWrap = el(
      'div.spinner-wrap-custom d-flex justify-content-center align-items-center',
    );
    const loader = addLoader();

    // Добавление элементов в DOM
    setChildren(loaderWrap, loader);
    setChildren(accountBodyTopLeft, accHeader);
    setChildren(accountBodyTop, accountBodyTopLeft, accountBodyTopRight);
    setChildren(accountBodyMiddle, loaderWrap);
    setChildren(
      containerBody,
      accountBodyTop,
      accountBodyMiddle,
      accountBodyBottom,
    );
  }
}

// Функция создания навигационной панели в хедере
export function headerNavigation() {
  const headerRefContainer = document.querySelector('.container__header-ref');

  const headerATMs = el(
    'a.header__atms header__ref-item btn btn-primary',
    'Банкоматы',
    { href: '#', id: 'navRefATMs' },
  );
  const headerAccounts = el(
    'a.header__accounts header__ref-item btn btn-primary',
    'Счета',
    { href: '#', id: 'navRefAccs' },
  );
  const headerCurrency = el(
    'a.header__currency header__ref-item btn btn-primary',
    'Валюта',
    { href: '#', id: 'navRefCurrencies' },
  );
  const headerExit = el(
    'a.header__exit header__ref-item btn btn-primary',
    'Выйти',
    { href: '#', id: 'navRefExit' },
  );

  headerATMs.addEventListener('click', (e) => {
    removeSelectedClassFromAllButtons();
    headerATMs.classList.add('header__ref-item-selected');
    correctRouting(e, '/banks');
  });

  headerAccounts.addEventListener('click', (e) => {
    removeSelectedClassFromAllButtons();
    headerAccounts.classList.add('header__ref-item-selected');
    correctRouting(e, '/accounts');
  });

  headerCurrency.addEventListener('click', (e) => {
    removeSelectedClassFromAllButtons();
    headerCurrency.classList.add('header__ref-item-selected');
    correctRouting(e, '/all-currencies');
  });

  headerExit.addEventListener('click', (e) => {
    e.preventDefault();
    removeSelectedClassFromAllButtons();
    router.navigate('/');
  });

  setChildren(
    headerRefContainer,
    headerATMs,
    headerAccounts,
    headerCurrency,
    headerExit,
  );
}

// Функция удаления подсветки кнопки при переключении между модулями
export function removeSelectedClassFromAllButtons() {
  const links = document.querySelectorAll('.header__ref-item');

  if (links) {
    links.forEach((link) => {
      link.classList.remove('header__ref-item-selected');
    });
  }
}

// Функция создания формы логина
function entryForm() {
  const entryForm = el('form.main__window-form');
  const entryFormHeader = el('h2.main__window-header', 'Вход в аккаунт');
  const entryFormInputWrapLogin = el(
    'div.main__window-input-container main__window-input-container-login mb-4',
  );
  const entryFormLabelLogin = el('label.main__window-label', 'Логин', {
    for: 'login',
  });
  const entryFormInputLogin = el(
    'input.main__window-input main__window-input-login form-control',
    {
      id: 'login',
      type: 'text',
      placeholder: 'Placeholder',
    },
  );
  const entryFormInputWrapPassword = el(
    'div.main__window-input-container main__window-input-container-login mb-4',
  );
  const entryFormLabelPassword = el('label.main__window-label', 'Пароль', {
    for: 'password',
  });
  const entryFormInputPassword = el(
    'input.main__window-input main__window-input-password form-control',
    {
      id: 'password',
      type: 'password',
      placeholder: 'Placeholder',
    },
  );
  const entryFormBtn = el('button.main__window-btn btn btn-primary', 'Войти', {
    id: 'entryBtn',
    type: 'submit',
  });

  setChildren(
    entryFormInputWrapLogin,
    entryFormLabelLogin,
    entryFormInputLogin,
  );
  setChildren(
    entryFormInputWrapPassword,
    entryFormLabelPassword,
    entryFormInputPassword,
  );
  setChildren(
    entryForm,
    entryFormHeader,
    entryFormInputWrapLogin,
    entryFormInputWrapPassword,
    entryFormBtn,
  );

  entryFormBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await login(
      entryFormInputWrapLogin,
      entryFormInputLogin,
      entryFormInputWrapPassword,
      entryFormInputPassword,
    );
  });

  return entryForm;
}

// Функция аутентификации
export async function login(
  loginInputContainer,
  loginInput,
  passwordInputContainer,
  passwordInput,
) {
  if (validationEntryInputFn(loginInputContainer, loginInput)) {
    if (validationEntryInputFn(passwordInputContainer, passwordInput)) {
      validationEntryPassFn(
        loginInputContainer,
        loginInput,
        passwordInputContainer,
        passwordInput,
      );
    }
  }
}

// Функция добавления лоадера
export function addLoader() {
  const loader = el(
    'div.spinner-border spinner-border-custom text-primary',
    { role: 'status' },
    el('span.visually-hidden', 'Loading...'),
  );
  return loader;
}

// Функция удаления лоадера
export function deleteLoader() {
  const loader = document.querySelector('.spinner-border');

  if (loader) {
    loader.remove();
  }
}

// Функция валидации полей ввода логина и пароля
export function validationEntryInputFn(someInputWrap, someInput) {
  let extractedClass;

  if (someInput.classList.contains('main__window-input-login')) {
    extractedClass = 'login';
  } else if (someInput.classList.contains('main__window-input-password')) {
    extractedClass = 'password';
  }

  if (document.querySelector(`.validation__error-message-${extractedClass}`)) {
    someInput.classList.remove('is-valid', 'is-invalid');
    document
      .querySelector(`.validation__error-message-${extractedClass}`)
      .remove();
  }

  let validationBootstrapClass;
  const validationMessage = el(
    `span.validation__error-message validation__error-message-${extractedClass} text`,
  );

  if (someInput.value.trim() !== '' && someInput.value.length > 6) {
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
    } else if (someInput.value.length < 6) {
      validationMessage.textContent = 'Введено слишком короткое значение';
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

// Функция проверки введенных данных для входа
async function validationEntryPassFn(
  loginInputWrap,
  loginInput,
  passwordInputWrap,
  passwordInput,
) {
  try {
    const token = await RequestsAPI.authorization(
      loginInput.value,
      passwordInput.value,
    );
    if (token) {
      loginInput.classList.add('is-valid');
      passwordInput.classList.add('is-valid');

      console.log('Вход был успешен с токеном:', token);

      loginInput.classList.add('is-valid');
      passwordInput.classList.add('is-valid');
      setTimeout(() => {
        loginInput.classList.remove('is-valid');
        passwordInput.classList.remove('is-valid');
        loginInput.value = '';
        passwordInput.value = '';
        router.navigate('/accounts', true);
      }, 2000);
    }
  } catch (error) {
    if (error.message === 'No such user') {
      const validationMessage = el(
        'span.validation__error-message validation__error-message-login text',
      );
      validationMessage.textContent = 'No such user';
      loginInputWrap.append(validationMessage);
      loginInput.classList.add('is-invalid');
      setTimeout(() => {
        loginInput.classList.remove('is-invalid');
        validationMessage.remove();
        loginInput.value = '';
        passwordInput.value = '';
        router.navigate('/', true);
      }, 2000);
    }
    if (error.message === 'Invalid password') {
      const validationMessage = el(
        'span.validation__error-message validation__error-message-login text',
      );
      validationMessage.textContent = 'Invalid password';
      passwordInputWrap.append(validationMessage);
      passwordInput.classList.add('is-invalid');
      setTimeout(() => {
        passwordInput.classList.remove('is-invalid');
        validationMessage.remove();
        loginInput.value = '';
        passwordInput.value = '';
        router.navigate('/', true);
      }, 2000);
    } else {
      console.error('Войти не удалось:', error.message);
      router.navigate('/', true);
    }
  }
}

// Стартовая загрузка DOM и роутера
document.addEventListener('DOMContentLoaded', () => {
  addMainDOMStructureFn();
  mainRoute();
});
