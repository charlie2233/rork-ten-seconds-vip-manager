import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type Locale = 'zh' | 'en' | 'es';

const LOCALE_STORAGE_KEY = 'app_locale';

type Messages = Record<string, string>;

const MESSAGES: Record<Locale, Messages> = {
  zh: {
    'common.cancel': '取消',
    'common.close': '关闭',
    'common.copy': '复制',
    'common.copied': '已复制',
    'common.ok': '确定',
    'common.refresh': '刷新',
    'common.back': '返回',
    'code.qrFailed': 'QR生成失败',
    'code.barcodeFailed': '条码生成失败',

    'tabs.home': '首页',
    'tabs.coupons': '卡券',
    'tabs.transactions': '账单',
    'tabs.profile': '我的',

    'tier.silver': '白银会员',
    'tier.gold': '黄金会员',
    'tier.platinum': '铂金会员',
    'tier.diamond': '钻石会员',

    'auth.subtitle': 'VIP会员中心',
    'auth.memberId': '会员ID',
    'auth.password': '密码',
    'auth.login': '登录',
    'auth.forgotPassword': '忘记密码?',
    'auth.register': '注册新会员',
    'auth.firstLoginHint': '首次登录请使用手机号注册',
    'auth.memberIdRequired': '请输入会员ID',
    'auth.passwordRequired': '请输入密码',
    'auth.loginFailed': '登录失败',
    'auth.invalidCredentials': '会员ID或密码错误',

    'home.welcomeBack': '欢迎回来',
    'home.balance': '账户余额',
    'home.memberId': '会员ID',
    'home.points': '积分',
    'home.action.recharge': '充值',
    'home.action.coupons': '卡券',
    'home.action.transactions': '账单',
    'home.action.memberCode': '付款码',
    'home.recentTransactions': '最近交易',
    'home.seeAll': '查看全部',
    'home.promoTitle': '会员日特惠',
    'home.promoDesc': '每周三充值享双倍积分',
    'home.promoCta': '立即参与',

    'transactions.title': '交易记录',
    'transactions.totalDeposit': '累计充值',
    'transactions.totalSpend': '累计消费',
    'transactions.filter.all': '全部',
    'transactions.filter.deposit': '充值',
    'transactions.filter.spend': '消费',
    'transactions.filter.bonus': '赠送',
    'transactions.empty': '暂无交易记录',
    'transactions.balancePrefix': '余额',

    'memberCode.title': '会员码',
    'memberCode.memberCardNo': '会员卡号',
    'memberCode.showToCashier': '付款时请向收银员出示此码',
    'memberCode.balance': '账户余额',
    'memberCode.points': '可用积分',
    'memberCode.pleaseLoginFirst': '请先登录',

    'coupons.title': '卡券钱包',
    'coupons.segment.available': '可用',
    'coupons.segment.used': '已使用',
    'coupons.segment.expired': '已过期',
    'coupons.section.offers': '可领取',
    'coupons.empty.available': '暂无可用卡券',
    'coupons.empty.used': '暂无已使用卡券',
    'coupons.empty.expired': '暂无已过期卡券',
    'coupons.claim': '领取',
    'coupons.claimed': '已领取',
    'coupons.locked': '未解锁',
    'coupons.requiresTier': '需 {tier}',
    'coupons.validTo': '有效期至 {date}',

    'couponDetail.title': '卡券详情',
    'couponDetail.redeemHint': '到店核销时出示二维码/条形码',
    'couponDetail.markUsed': '标记为已使用',
    'couponDetail.used': '已使用',
    'couponDetail.expired': '已过期',
    'couponDetail.notClaimed': '未领取',
    'couponDetail.codeLabel': '核销码',

    'profile.title': '我的',
    'profile.memberId': '会员ID',
    'profile.phone': '手机号',
    'profile.joinDate': '入会日期',
    'profile.section.account': '账户设置',
    'profile.section.support': '服务支持',
    'profile.item.notifications': '消息通知',
    'profile.item.security': '账户安全',
    'profile.item.preferences': '偏好设置',
    'profile.item.nearbyStores': '附近门店',
    'profile.item.supportChat': '在线客服',
    'profile.item.helpCenter': '帮助中心',
    'profile.logout': '退出登录',
    'profile.logoutConfirmTitle': '退出登录',
    'profile.logoutConfirmMessage': '确定要退出当前账号吗？',
    'profile.version': '版本 {version}',

    'notFound.title': '页面未找到',
    'notFound.message': '页面不存在',
    'notFound.backHome': '返回首页',
  },
  en: {
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    'common.ok': 'OK',
    'common.refresh': 'Refresh',
    'common.back': 'Back',
    'code.qrFailed': 'QR generation failed',
    'code.barcodeFailed': 'Barcode generation failed',

    'tabs.home': 'Home',
    'tabs.coupons': 'Coupons',
    'tabs.transactions': 'Bills',
    'tabs.profile': 'Me',

    'tier.silver': 'Silver',
    'tier.gold': 'Gold',
    'tier.platinum': 'Platinum',
    'tier.diamond': 'Diamond',

    'auth.subtitle': 'VIP Member Center',
    'auth.memberId': 'Member ID',
    'auth.password': 'Password',
    'auth.login': 'Sign in',
    'auth.forgotPassword': 'Forgot password?',
    'auth.register': 'Create account',
    'auth.firstLoginHint': 'First time? Register with your phone number.',
    'auth.memberIdRequired': 'Please enter Member ID',
    'auth.passwordRequired': 'Please enter password',
    'auth.loginFailed': 'Sign-in failed',
    'auth.invalidCredentials': 'Incorrect Member ID or password',

    'home.welcomeBack': 'Welcome back',
    'home.balance': 'Balance',
    'home.memberId': 'Member ID',
    'home.points': 'Points',
    'home.action.recharge': 'Top up',
    'home.action.coupons': 'Coupons',
    'home.action.transactions': 'Bills',
    'home.action.memberCode': 'Code',
    'home.recentTransactions': 'Recent transactions',
    'home.seeAll': 'See all',
    'home.promoTitle': 'Member Day Deal',
    'home.promoDesc': 'Double points on top-ups every Wednesday',
    'home.promoCta': 'Join now',

    'transactions.title': 'Transactions',
    'transactions.totalDeposit': 'Total top-up',
    'transactions.totalSpend': 'Total spend',
    'transactions.filter.all': 'All',
    'transactions.filter.deposit': 'Top-up',
    'transactions.filter.spend': 'Spend',
    'transactions.filter.bonus': 'Bonus',
    'transactions.empty': 'No transactions yet',
    'transactions.balancePrefix': 'Balance',

    'memberCode.title': 'Member Code',
    'memberCode.memberCardNo': 'Card No.',
    'memberCode.showToCashier': 'Show this code at checkout',
    'memberCode.balance': 'Balance',
    'memberCode.points': 'Points',
    'memberCode.pleaseLoginFirst': 'Please sign in first',

    'coupons.title': 'Coupon Wallet',
    'coupons.segment.available': 'Available',
    'coupons.segment.used': 'Used',
    'coupons.segment.expired': 'Expired',
    'coupons.section.offers': 'Offers',
    'coupons.empty.available': 'No available coupons',
    'coupons.empty.used': 'No used coupons',
    'coupons.empty.expired': 'No expired coupons',
    'coupons.claim': 'Claim',
    'coupons.claimed': 'Claimed',
    'coupons.locked': 'Locked',
    'coupons.requiresTier': 'Requires {tier}',
    'coupons.validTo': 'Valid until {date}',

    'couponDetail.title': 'Coupon Details',
    'couponDetail.redeemHint': 'Show QR/barcode to redeem in store',
    'couponDetail.markUsed': 'Mark as used',
    'couponDetail.used': 'Used',
    'couponDetail.expired': 'Expired',
    'couponDetail.notClaimed': 'Not claimed',
    'couponDetail.codeLabel': 'Redeem code',

    'profile.title': 'Me',
    'profile.memberId': 'Member ID',
    'profile.phone': 'Phone',
    'profile.joinDate': 'Join date',
    'profile.section.account': 'Account',
    'profile.section.support': 'Support',
    'profile.item.notifications': 'Notifications',
    'profile.item.security': 'Security',
    'profile.item.preferences': 'Preferences',
    'profile.item.nearbyStores': 'Nearby stores',
    'profile.item.supportChat': 'Support chat',
    'profile.item.helpCenter': 'Help center',
    'profile.logout': 'Sign out',
    'profile.logoutConfirmTitle': 'Sign out',
    'profile.logoutConfirmMessage': 'Sign out of this account?',
    'profile.version': 'Version {version}',

    'notFound.title': 'Not Found',
    'notFound.message': 'This page does not exist',
    'notFound.backHome': 'Go home',
  },
  es: {
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.copy': 'Copiar',
    'common.copied': 'Copiado',
    'common.ok': 'Aceptar',
    'common.refresh': 'Actualizar',
    'common.back': 'Atrás',
    'code.qrFailed': 'Error al generar el QR',
    'code.barcodeFailed': 'Error al generar el código de barras',

    'tabs.home': 'Inicio',
    'tabs.coupons': 'Cupones',
    'tabs.transactions': 'Movimientos',
    'tabs.profile': 'Yo',

    'tier.silver': 'Plata',
    'tier.gold': 'Oro',
    'tier.platinum': 'Platino',
    'tier.diamond': 'Diamante',

    'auth.subtitle': 'Centro VIP',
    'auth.memberId': 'ID de miembro',
    'auth.password': 'Contraseña',
    'auth.login': 'Iniciar sesión',
    'auth.forgotPassword': '¿Olvidaste la contraseña?',
    'auth.register': 'Crear cuenta',
    'auth.firstLoginHint': '¿Primera vez? Regístrate con tu número de teléfono.',
    'auth.memberIdRequired': 'Ingresa el ID de miembro',
    'auth.passwordRequired': 'Ingresa la contraseña',
    'auth.loginFailed': 'Error al iniciar sesión',
    'auth.invalidCredentials': 'ID de miembro o contraseña incorrectos',

    'home.welcomeBack': 'Bienvenido de nuevo',
    'home.balance': 'Saldo',
    'home.memberId': 'ID de miembro',
    'home.points': 'Puntos',
    'home.action.recharge': 'Recargar',
    'home.action.coupons': 'Cupones',
    'home.action.transactions': 'Movimientos',
    'home.action.memberCode': 'Código',
    'home.recentTransactions': 'Transacciones recientes',
    'home.seeAll': 'Ver todo',
    'home.promoTitle': 'Oferta del día de miembros',
    'home.promoDesc': 'Doble puntos en recargas todos los miércoles',
    'home.promoCta': 'Participar',

    'transactions.title': 'Transacciones',
    'transactions.totalDeposit': 'Total recargado',
    'transactions.totalSpend': 'Total gastado',
    'transactions.filter.all': 'Todo',
    'transactions.filter.deposit': 'Recarga',
    'transactions.filter.spend': 'Gasto',
    'transactions.filter.bonus': 'Bono',
    'transactions.empty': 'Aún no hay transacciones',
    'transactions.balancePrefix': 'Saldo',

    'memberCode.title': 'Código de miembro',
    'memberCode.memberCardNo': 'N.º de tarjeta',
    'memberCode.showToCashier': 'Muestra este código al pagar',
    'memberCode.balance': 'Saldo',
    'memberCode.points': 'Puntos',
    'memberCode.pleaseLoginFirst': 'Inicia sesión primero',

    'coupons.title': 'Billetera de cupones',
    'coupons.segment.available': 'Disponibles',
    'coupons.segment.used': 'Usados',
    'coupons.segment.expired': 'Vencidos',
    'coupons.section.offers': 'Ofertas',
    'coupons.empty.available': 'No hay cupones disponibles',
    'coupons.empty.used': 'No hay cupones usados',
    'coupons.empty.expired': 'No hay cupones vencidos',
    'coupons.claim': 'Obtener',
    'coupons.claimed': 'Obtenido',
    'coupons.locked': 'Bloqueado',
    'coupons.requiresTier': 'Requiere {tier}',
    'coupons.validTo': 'Válido hasta {date}',

    'couponDetail.title': 'Detalle del cupón',
    'couponDetail.redeemHint': 'Muestra el QR/código de barras para canjear en tienda',
    'couponDetail.markUsed': 'Marcar como usado',
    'couponDetail.used': 'Usado',
    'couponDetail.expired': 'Vencido',
    'couponDetail.notClaimed': 'No obtenido',
    'couponDetail.codeLabel': 'Código de canje',

    'profile.title': 'Yo',
    'profile.memberId': 'ID de miembro',
    'profile.phone': 'Teléfono',
    'profile.joinDate': 'Fecha de alta',
    'profile.section.account': 'Cuenta',
    'profile.section.support': 'Soporte',
    'profile.item.notifications': 'Notificaciones',
    'profile.item.security': 'Seguridad',
    'profile.item.preferences': 'Preferencias',
    'profile.item.nearbyStores': 'Tiendas cercanas',
    'profile.item.supportChat': 'Chat de soporte',
    'profile.item.helpCenter': 'Centro de ayuda',
    'profile.logout': 'Cerrar sesión',
    'profile.logoutConfirmTitle': 'Cerrar sesión',
    'profile.logoutConfirmMessage': '¿Cerrar sesión de esta cuenta?',
    'profile.version': 'Versión {version}',

    'notFound.title': 'No encontrado',
    'notFound.message': 'Esta página no existe',
    'notFound.backHome': 'Volver al inicio',
  },
};

function formatMessage(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export const [I18nProvider, useI18n] = createContextHook(() => {
  const [locale, setLocaleState] = useState<Locale>('zh');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        if (!isMounted) return;
        if (stored === 'zh' || stored === 'en' || stored === 'es') {
          setLocaleState(stored);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleLocale = useCallback(async () => {
    const next: Locale = locale === 'zh' ? 'en' : locale === 'en' ? 'es' : 'zh';
    await setLocale(next);
  }, [locale, setLocale]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      const message = MESSAGES[locale]?.[key] ?? MESSAGES.zh[key] ?? key;
      return formatMessage(message, params);
    };
  }, [locale]);

  return {
    locale,
    isLoading,
    setLocale,
    toggleLocale,
    t,
  };
});
