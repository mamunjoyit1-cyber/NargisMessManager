import bn from '../constants/i18n-bn.js';
import en from '../constants/i18n-en.js';
const D = { bn, en };
let lang = 'bn';
export const setLang = (l) => { lang = D[l] ? l : 'bn'; document.documentElement.lang = lang; };
export const getLang = () => lang;
export const t = (k) => D[lang][k] ?? D.bn[k] ?? k;
export const fmtNum = (n) => new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en-US').format(Number(n) || 0);
export const money = (n) => '৳' + fmtNum(n);
