/* ============================================
   South Jordan Home Insurance — Main JS
   Form handling, mobile nav, FAQ accordion,
   zip redirect, sticky CTA, multi-step form,
   older-home conditional fields
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Nav ---
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  const overlay = document.querySelector('.nav-overlay');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      overlay?.classList.toggle('active');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
    overlay?.addEventListener('click', () => {
      nav.classList.remove('open');
      overlay.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        overlay?.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('active');

      document.querySelectorAll('.faq-item').forEach(el => {
        el.classList.remove('active');
        el.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // --- Hero Zip Form Redirect ---
  const zipForm = document.querySelector('.hero-zip-form');
  if (zipForm) {
    zipForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const zipInput = zipForm.querySelector('input');
      const zip = zipInput.value.trim();
      if (/^\d{5}$/.test(zip)) {
        window.location.href = 'home-insurance-quote#zip=' + zip;
      } else {
        zipForm.classList.add('shake');
        setTimeout(() => zipForm.classList.remove('shake'), 400);
        zipInput.focus();
      }
    });
  }

  // --- Hash-based Zip Pre-fill ---
  const hash = window.location.hash;
  if (hash && hash.includes('zip=')) {
    const zip = hash.split('zip=')[1];
    if (/^\d{5}$/.test(zip)) {
      const zipField = document.querySelector('#zip, input[name="zipCode"]');
      if (zipField) zipField.value = zip;
    }
  }

  // --- Older Home Conditional Fields ---
  const yearBuiltField = document.querySelector('#yearBuilt');
  const olderHomeFields = document.querySelector('.older-home-fields');
  if (yearBuiltField && olderHomeFields) {
    yearBuiltField.addEventListener('input', () => {
      const val = yearBuiltField.value.trim();
      if (/^\d{4}$/.test(val) && parseInt(val, 10) < 1960) {
        olderHomeFields.classList.add('visible');
      } else {
        olderHomeFields.classList.remove('visible');
      }
    });
  }

  // --- Multi-Step Form ---
  document.querySelectorAll('.multi-step-form').forEach(form => {
    const steps = form.querySelectorAll('.form-step');
    const progressSteps = form.closest('.form-wrapper')?.querySelectorAll('.form-progress-step');
    const progressLines = form.closest('.form-wrapper')?.querySelectorAll('.form-progress-line');
    let currentStep = 0;

    function showStep(idx) {
      steps.forEach((s, i) => {
        s.classList.toggle('active', i === idx);
      });
      if (progressSteps) {
        progressSteps.forEach((ps, i) => {
          ps.classList.remove('active', 'completed');
          if (i < idx) ps.classList.add('completed');
          if (i === idx) ps.classList.add('active');
        });
      }
      if (progressLines) {
        progressLines.forEach((pl, i) => {
          pl.classList.toggle('active', i < idx);
        });
      }
      currentStep = idx;
    }

    form.querySelectorAll('[data-next-step]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Validate current step required fields
        const currentStepEl = steps[currentStep];
        let valid = true;
        currentStepEl.querySelectorAll('[required]').forEach(field => {
          const group = field.closest('.form-group');
          if (!field.value.trim()) {
            valid = false;
            if (group) group.classList.add('has-error');
          } else {
            if (group) group.classList.remove('has-error');
          }
        });
        // Email validation
        const emailField = currentStepEl.querySelector('input[type="email"]');
        if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
          valid = false;
          const group = emailField.closest('.form-group');
          if (group) group.classList.add('has-error');
        }
        // Phone validation
        const phoneField = currentStepEl.querySelector('input[type="tel"]');
        if (phoneField && phoneField.value && !/^[\d\s\-\(\)\+]{7,}$/.test(phoneField.value)) {
          valid = false;
          const group = phoneField.closest('.form-group');
          if (group) group.classList.add('has-error');
        }
        if (valid && currentStep < steps.length - 1) {
          showStep(currentStep + 1);
          form.closest('.form-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (!valid) {
          const firstError = currentStepEl.querySelector('.has-error');
          if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    form.querySelectorAll('[data-prev-step]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentStep > 0) showStep(currentStep - 1);
      });
    });

    form.querySelectorAll('[data-skip-step]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Submit from current step, skipping optional enrichment
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });

    showStep(0);
  });

  // --- Form Handling ---
  document.querySelectorAll('form[data-webhook]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear previous errors
      form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));

      // Validate required fields (only visible/active step fields)
      let valid = true;
      const activeStep = form.querySelector('.form-step.active');
      const fieldsToValidate = activeStep
        ? activeStep.querySelectorAll('[required]')
        : form.querySelectorAll('[required]');

      fieldsToValidate.forEach(field => {
        if (field.type === 'checkbox' && !field.checked) {
          valid = false;
          const group = field.closest('.form-group') || field.closest('.form-consent');
          if (group) group.classList.add('has-error');
        } else if (field.type !== 'checkbox' && !field.value.trim()) {
          valid = false;
          const group = field.closest('.form-group');
          if (group) group.classList.add('has-error');
        }
      });

      // Also validate consent checkbox (always required)
      const consent = form.querySelector('#consent');
      if (consent && !consent.checked) {
        valid = false;
        const group = consent.closest('.form-consent');
        if (group) group.classList.add('has-error');
      }

      // Email validation
      const emailField = form.querySelector('input[type="email"]');
      if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
        valid = false;
        const group = emailField.closest('.form-group');
        if (group) group.classList.add('has-error');
      }

      // Phone validation
      const phoneField = form.querySelector('input[type="tel"]');
      if (phoneField && phoneField.value && !/^[\d\s\-\(\)\+]{7,}$/.test(phoneField.value)) {
        valid = false;
        const group = phoneField.closest('.form-group');
        if (group) group.classList.add('has-error');
      }

      if (!valid) {
        const firstError = form.querySelector('.has-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const successEl = form.querySelector('.form-success');
      const errorEl = form.querySelector('.form-error');
      const webhook = form.getAttribute('data-webhook');
      const redirect = form.getAttribute('data-redirect');

      // Collect all form data (across all steps)
      const data = {};
      new FormData(form).forEach((value, key) => { data[key] = value; });
      data.source = window.location.hostname;
      data.page = window.location.pathname;
      data.timestamp = new Date().toISOString();
      data.referrer = document.referrer || 'direct';

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      if (successEl) successEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'none';

      // Get Turnstile token
      const turnstileWidget = form.querySelector('.cf-turnstile');
      const turnstileToken = turnstileWidget ? turnstile.getResponse(turnstileWidget) : null;
      if (turnstileWidget && !turnstileToken) {
          if (statusEl) {
              statusEl.className = 'form-status error';
              statusEl.textContent = 'Please complete the security check.';
          }
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          return;
      }

      // Route through form proxy for Turnstile validation
      const proxyUrl = 'https://cf-form-proxy.pages.dev/api/submit';
      const payload = {
          ...data,
          cf_turnstile_token: turnstileToken,
          cf_webhook_url: webhook,
          cf_site_key: turnstileWidget?.dataset.sitekey || '',
      };

      try {
        const res = await fetch(turnstileToken ? proxyUrl : webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(turnstileToken ? payload : data)
        });

        if (res.ok || res.status === 0) {
          if (redirect) {
            window.location.href = redirect;
          } else {
            form.reset();
            if (successEl) successEl.style.display = 'block';
            submitBtn.textContent = 'Sent!';
            setTimeout(() => {
              submitBtn.textContent = submitBtn.dataset.label || 'Submit';
              submitBtn.disabled = false;
            }, 3000);
          }
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        if (errorEl) errorEl.style.display = 'block';
        submitBtn.textContent = submitBtn.dataset.label || 'Submit';
        submitBtn.disabled = false;
      }
    });
  });

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        nav?.classList.remove('open');
        overlay?.classList.remove('active');
      }
    });
  });

  // --- Active Nav Link ---
  const currentPath = window.location.pathname.replace(/\/$/, '').replace(/\.html$/, '');
  document.querySelectorAll('.main-nav a').forEach(link => {
    const href = link.getAttribute('href')?.replace(/\/$/, '').replace(/\.html$/, '');
    if (!href) return;
    if ((currentPath === '' || currentPath === '/') && (href === './' || href === '../' || href === '/')) {
      link.classList.add('active');
    } else if (href !== './' && href !== '../' && href !== '/' && currentPath.endsWith(href)) {
      link.classList.add('active');
    }
  });

  // --- Sticky Mobile CTA ---
  const stickyCta = document.querySelector('.sticky-cta');
  const heroSection = document.querySelector('.hero');
  if (stickyCta && heroSection) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        stickyCta.classList.add('visible');
      } else {
        stickyCta.classList.remove('visible');
      }
    }, { threshold: 0 });
    observer.observe(heroSection);
  }

});
