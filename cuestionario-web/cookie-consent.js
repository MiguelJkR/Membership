// Cookie consent banner — GDPR/CCPA compliant.
// Shared across all MacLorian X Group sites; theme via cookie-consent.css per site.
// Bilingüe ES/EN: sigue el atributo lang de <html> (que el cuestionario cambia con setLang),
// vía MutationObserver — sin acoplar al código de la página.
(function() {
  const STORAGE_KEY = 'mclx_cookie_consent_v1';
  const CONSENT_EXPIRY_DAYS = 365;

  const I18N = {
    es: {
      title: 'Usamos cookies',
      intro: 'Las esenciales son necesarias para el sitio. Las de analytics y marketing son opcionales — tú eliges.',
      reject: 'Solo esenciales',
      customize: 'Personalizar',
      accept: 'Aceptar todas',
      modalTitle: 'Preferencias de cookies',
      modalIntro: 'Elige qué tipos de cookies aceptas. Las esenciales no se pueden desactivar.',
      essential: 'Esenciales',
      essentialDesc: 'Sesión y seguridad. Sin estas el sitio no funciona.',
      analytics: 'Analytics',
      analyticsDesc: 'Datos agregados anónimos para mejorar el sitio.',
      marketing: 'Marketing',
      marketingDesc: 'Recordar preferencias. Sin rastreo entre sitios.',
      cancel: 'Cancelar',
      save: 'Guardar'
    },
    en: {
      title: 'We use cookies',
      intro: 'Essential cookies are required for the site. Analytics and marketing cookies are optional — you choose.',
      reject: 'Essential only',
      customize: 'Customize',
      accept: 'Accept all',
      modalTitle: 'Cookie preferences',
      modalIntro: 'Choose which cookies you accept. Essential cookies can’t be turned off.',
      essential: 'Essential',
      essentialDesc: 'Session and security. The site won’t work without these.',
      analytics: 'Analytics',
      analyticsDesc: 'Anonymous aggregate data to improve the site.',
      marketing: 'Marketing',
      marketingDesc: 'Remember preferences. No cross-site tracking.',
      cancel: 'Cancel',
      save: 'Save'
    }
  };
  function lang() {
    const l = (document.documentElement.lang || 'es').toLowerCase();
    return l.startsWith('en') ? 'en' : 'es';
  }
  function tr() { return I18N[lang()]; }

  function getConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.expiresAt && Date.now() > data.expiresAt) return null;
      return data;
    } catch (e) { return null; }
  }
  function saveConsent(analytics, marketing) {
    const data = {
      essential: true, analytics: !!analytics, marketing: !!marketing,
      timestamp: Date.now(),
      expiresAt: Date.now() + CONSENT_EXPIRY_DAYS * 86400000,
      version: 1
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    fireConsentEvent(data);
  }
  function fireConsentEvent(data) {
    window.dispatchEvent(new CustomEvent('cookieConsent', { detail: data }));
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: data.analytics ? 'granted' : 'denied',
        ad_storage: data.marketing ? 'granted' : 'denied',
        ad_user_data: data.marketing ? 'granted' : 'denied',
        ad_personalization: data.marketing ? 'granted' : 'denied'
      });
    }
  }
  function buildBanner() {
    const T = tr();
    const banner = document.createElement('div');
    banner.id = 'mclx-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.innerHTML = `
      <div class="mclx-cc-inner">
        <div class="mclx-cc-text">
          <strong data-cc="title">${T.title}</strong>
          <p data-cc="intro">${T.intro}</p>
        </div>
        <div class="mclx-cc-actions">
          <button id="mclx-cc-reject" class="mclx-cc-btn mclx-cc-btn-secondary" type="button" data-cc="reject">${T.reject}</button>
          <button id="mclx-cc-customize" class="mclx-cc-btn mclx-cc-btn-secondary" type="button" data-cc="customize">${T.customize}</button>
          <button id="mclx-cc-accept" class="mclx-cc-btn mclx-cc-btn-primary" type="button" data-cc="accept">${T.accept}</button>
        </div>
      </div>`;
    document.body.appendChild(banner);
    document.getElementById('mclx-cc-accept').addEventListener('click', () => { saveConsent(true, true); banner.remove(); });
    document.getElementById('mclx-cc-reject').addEventListener('click', () => { saveConsent(false, false); banner.remove(); });
    document.getElementById('mclx-cc-customize').addEventListener('click', () => { banner.remove(); buildModal(); });
  }
  function buildModal() {
    const T = tr();
    const modal = document.createElement('div');
    modal.id = 'mclx-cookie-modal';
    modal.innerHTML = `
      <div class="mclx-mod-backdrop"></div>
      <div class="mclx-mod-card">
        <h3 data-cc="modalTitle">${T.modalTitle}</h3>
        <p data-cc="modalIntro">${T.modalIntro}</p>
        <div class="mclx-cat">
          <label class="mclx-cat-row">
            <input type="checkbox" checked disabled>
            <div><strong data-cc="essential">${T.essential}</strong><small data-cc="essentialDesc">${T.essentialDesc}</small></div>
          </label>
          <label class="mclx-cat-row">
            <input type="checkbox" id="mclx-mod-analytics">
            <div><strong data-cc="analytics">${T.analytics}</strong><small data-cc="analyticsDesc">${T.analyticsDesc}</small></div>
          </label>
          <label class="mclx-cat-row">
            <input type="checkbox" id="mclx-mod-marketing">
            <div><strong data-cc="marketing">${T.marketing}</strong><small data-cc="marketingDesc">${T.marketingDesc}</small></div>
          </label>
        </div>
        <div class="mclx-mod-actions">
          <button id="mclx-mod-cancel" class="mclx-cc-btn mclx-cc-btn-secondary" type="button" data-cc="cancel">${T.cancel}</button>
          <button id="mclx-mod-save" class="mclx-cc-btn mclx-cc-btn-primary" type="button" data-cc="save">${T.save}</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('mclx-mod-cancel').addEventListener('click', () => { modal.remove(); buildBanner(); });
    document.getElementById('mclx-mod-save').addEventListener('click', () => {
      saveConsent(document.getElementById('mclx-mod-analytics').checked, document.getElementById('mclx-mod-marketing').checked);
      modal.remove();
    });
  }
  // Re-traducir banner/modal visibles cuando el usuario cambia el idioma de la página.
  function retranslate() {
    const T = tr();
    document.querySelectorAll('[data-cc]').forEach(el => {
      const k = el.getAttribute('data-cc');
      if (T[k] != null) el.textContent = T[k];
    });
  }
  function watchLang() {
    try {
      new MutationObserver(retranslate).observe(
        document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    } catch (e) { /* no-op */ }
  }
  function init() {
    watchLang();
    const existing = getConsent();
    if (existing) { fireConsentEvent(existing); return; }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildBanner);
    else buildBanner();
  }
  window.mclxCookie = {
    openPreferences: () => {
      document.getElementById('mclx-cookie-banner')?.remove();
      buildModal();
      const c = getConsent();
      if (c) {
        const a = document.getElementById('mclx-mod-analytics');
        const m = document.getElementById('mclx-mod-marketing');
        if (a) a.checked = !!c.analytics;
        if (m) m.checked = !!c.marketing;
      }
    },
    getConsent
  };
  init();
})();
