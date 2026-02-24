/*
  Proposta Comercial — EcoNest House
  JS puro (sem frameworks)

  Requisitos atendidos:
  - Accordion "Ver detalhes" por plano (abre/fecha com animação)
  - Selecionar plano: destaca o card e atualiza o CTA final
  - Copiar resumo do plano (navigator.clipboard)
  - Scroll suave (CSS + ajuste de offset do header)
  - Funções separadas e código comentado
*/

document.addEventListener('DOMContentLoaded', () => {
  "use strict";

  // -----------------------------
  // Helpers
  // -----------------------------
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setYear() {
    const yearEl = qs('[data-year]');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  function getHeaderOffset() {
    const header = qs('.site-header');
    if (!header) return 0;
    const styles = window.getComputedStyle(header);
    const extra = 12;
    const height = header.getBoundingClientRect().height;
    const border = parseFloat(styles.borderBottomWidth || '0');
    return Math.round(height + border + extra);
  }

  // -----------------------------
  // Scroll com offset (header sticky)
  // -----------------------------
  function bindAnchorScroll() {
    const links = qsa('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const target = qs(href);
        if (!target) return;

        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
        window.scrollTo({ top, behavior: 'smooth' });

        // Fecha menu mobile se estiver aberto
        const navMenu = qs('#nav-menu');
        const menuBtn = qs('[data-menu-toggle]');
        if (navMenu && navMenu.classList.contains('is-open')) {
          navMenu.classList.remove('is-open');
          if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // -----------------------------
  // CTA dinâmico
  // -----------------------------
  function updateCTA(planName) {
    const ctaTitle = qs('[data-cta-title]');
    const ctaSubtitle = qs('[data-cta-subtitle]');
    const waLink = qs('[data-cta-whatsapp]');
    const waLabel = qs('[data-cta-whatsapp-label]');

    const baseUrl = 'https://wa.me/5511964956563';
    const baseText = 'Olá, quero falar sobre a proposta';

    const text = planName
      ? `${baseText}. Quero fechar o Plano ${planName}.`
      : baseText;

    if (ctaTitle) {
      ctaTitle.textContent = planName
        ? `Quero fechar o Plano ${planName}`
        : 'Vamos fechar o plano ideal?';
    }

    if (ctaSubtitle) {
      ctaSubtitle.textContent = planName
        ? 'Me envie os próximos passos (contrato, kickoff e cronograma) para iniciarmos.'
        : 'Selecione um plano acima para atualizar este CTA automaticamente.';
    }

    if (waLink) {
      waLink.href = `${baseUrl}?text=${encodeURIComponent(text)}`;
    }

    if (waLabel) {
      waLabel.textContent = planName ? `Quero fechar o Plano ${planName}` : 'Falar no WhatsApp';
    }
  }

  // -----------------------------
  // Seleção de plano
  // -----------------------------
  function selectPlan(cardEl) {
    const cards = qsa('.pricing-card');
    cards.forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');

    const planName = cardEl.getAttribute('data-plan-name') || cardEl.querySelector('.plan-name')?.textContent?.trim();
    updateCTA(planName || null);
  }

  function buildWhatsAppUrl(planName) {
    const baseUrl = 'https://wa.me/5511964956563';
    const baseText = 'Olá, quero falar sobre a proposta';
    const text = planName
      ? `${baseText}. Quero fechar o Plano ${planName}.`
      : baseText;

    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }

  function bindSelectPlan() {
    qsa('[data-select-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.pricing-card');
        if (!card) return;
        selectPlan(card);

        const planName = card.getAttribute('data-plan-name') || card.querySelector('.plan-name')?.textContent?.trim();
        const url = buildWhatsAppUrl(planName || null);
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    });
  }

  // -----------------------------
  // Copiar resumo do plano
  // -----------------------------
  function buildPlanSummary(cardEl) {
    const name = cardEl.getAttribute('data-plan-name') || 'Plano';
    const price = cardEl.getAttribute('data-plan-price') || '';
    const platforms = cardEl.getAttribute('data-plan-platforms') || '';
    const lps = cardEl.getAttribute('data-plan-lps') || '';
    const creatives = cardEl.getAttribute('data-plan-creatives') || '';
    const videos = cardEl.getAttribute('data-plan-videos') || '';
    const ideal = cardEl.getAttribute('data-plan-ideal') || '';

    const formattedPrice = price ? `R$ ${Number(price).toLocaleString('pt-BR')}/mês` : '';

    return [
      `Proposta EcoNest House — ${name}`,
      formattedPrice ? `Valor: ${formattedPrice}` : null,
      platforms ? `Plataformas: ${platforms}` : null,
      lps ? `Landing pages: ${lps}` : null,
      (creatives || videos) ? `Criativos/Vídeos: ${creatives || '-'} / ${videos || '-'}` : null,
      ideal ? `Indicado: ${ideal}` : null,
      'Observações: verba de anúncios paga à parte. Prazo mínimo recomendado: 3 meses.',
    ].filter(Boolean).join('\n');
  }

  async function copyPlanSummary(cardEl) {
    const text = buildPlanSummary(cardEl);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: textarea temporário
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }

      // Feedback discreto no botão
      const btn = qs('[data-copy-plan]', cardEl);
      if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Copiado ✓';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 1200);
      }
    } catch (err) {
      console.error('Falha ao copiar resumo:', err);
      alert('Não foi possível copiar automaticamente. Tente novamente ou copie manualmente.');
    }
  }

  function bindCopyPlan() {
    qsa('[data-copy-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.pricing-card');
        if (!card) return;
        copyPlanSummary(card);
      });
    });
  }

  // -----------------------------
  // Accordion (detalhes) com animação
  // -----------------------------
  function toggleAccordion(panelEl, open) {
    if (open) {
      panelEl.classList.remove('hidden');
      panelEl.style.height = '0px';
      panelEl.style.opacity = '0';

      const targetHeight = panelEl.scrollHeight;
      panelEl.animate(
        [
          { height: '0px', opacity: 0 },
          { height: `${targetHeight}px`, opacity: 1 },
        ],
        { duration: 220, easing: 'ease-out' }
      ).onfinish = () => {
        panelEl.style.height = '';
        panelEl.style.opacity = '';
      };
    } else {
      const currentHeight = panelEl.getBoundingClientRect().height;
      panelEl.style.height = `${currentHeight}px`;
      panelEl.style.opacity = '1';
      panelEl.animate(
        [
          { height: `${currentHeight}px`, opacity: 1 },
          { height: '0px', opacity: 0 },
        ],
        { duration: 200, easing: 'ease-in' }
      ).onfinish = () => {
        panelEl.classList.add('hidden');
        panelEl.style.height = '';
        panelEl.style.opacity = '';
      };
    }
  }

  function bindDetailsAccordion() {
    const detailsPanel = qs('#details-panel');
    const detailsTitle = qs('[data-details-title]');
    const detailsClose = qs('[data-details-close]');
    const triggers = qsa('[data-accordion-trigger]');
    const allDetails = qsa('.details-content');

    if (!detailsPanel) return;

    function hideAllDetails() {
      allDetails.forEach(el => (el.hidden = true));
    }

    function setExpandedState(targetId, expanded) {
      triggers.forEach(t => {
        const isTarget = t.getAttribute('data-target') === targetId;
        if (isTarget) t.setAttribute('aria-expanded', String(expanded));
        else t.setAttribute('aria-expanded', 'false');
      });
    }

    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const targetId = trigger.getAttribute('data-target');
        if (!targetId) return;

        const targetEl = qs(`#${targetId}`);
        if (!targetEl) return;

        const isOpen = !detailsPanel.classList.contains('hidden') && !targetEl.hidden;

        if (isOpen) {
          setExpandedState(targetId, false);
          toggleAccordion(detailsPanel, false);
          return;
        }

        hideAllDetails();
        targetEl.hidden = false;

        const card = trigger.closest('.pricing-card');
        const planName = card?.getAttribute('data-plan-name') || null;
        if (detailsTitle) detailsTitle.textContent = planName ? `Plano ${planName}` : 'Detalhes';

        setExpandedState(targetId, true);
        toggleAccordion(detailsPanel, true);

        // Scroll para o painel
        const top = detailsPanel.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });

    if (detailsClose) {
      detailsClose.addEventListener('click', () => {
        // Fecha e reseta aria
        triggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
        toggleAccordion(detailsPanel, false);
      });
    }
  }

  // -----------------------------
  // Menu mobile
  // -----------------------------
  function toggleMobileMenu() {
    const menuBtn = qs('[data-menu-toggle]');
    const navMenu = qs('#nav-menu');
    if (!menuBtn || !navMenu) return;

    const isOpen = navMenu.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  }

  function bindMobileMenu() {
    const menuBtn = qs('[data-menu-toggle]');
    if (!menuBtn) return;
    menuBtn.addEventListener('click', toggleMobileMenu);

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
      const navMenu = qs('#nav-menu');
      if (!navMenu || !menuBtn) return;
      const clickedInside = navMenu.contains(e.target) || menuBtn.contains(e.target);
      if (!clickedInside && navMenu.classList.contains('is-open')) {
        navMenu.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // -----------------------------
  // Init
  // -----------------------------
  setYear();
  updateCTA(null);
  bindAnchorScroll();
  bindMobileMenu();
  bindDetailsAccordion();
  bindSelectPlan();
  bindCopyPlan();
});
