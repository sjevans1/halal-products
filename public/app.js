(() => {
  'use strict';
  const catalogue = window.TAYYIB_CATALOG;
  if (!catalogue || !Array.isArray(catalogue.products)) throw new Error('Catalogue data unavailable');
  const products = Object.fromEntries(catalogue.products.map(p => [p.id, {
    title: p.name, image: p.image, category: p.category, description: p.story, url: `/products/${p.id}/`
  }]));
  const recipes = {
    curry: {
      title: 'Island-style beef curry',
      intro:
        'A comforting Sunday-pot idea built around the Premium Beef Cubes line, with warm Jamaican curry flavour and tender halal beef.',
      ingredients: [
        '800 g Tayyib Halal Premium Beef Cubes',
        '2 tbsp curry powder',
        '1 onion, 3 garlic cloves and fresh thyme',
        '2 potatoes and 1 carrot',
        'Coconut milk or water, as needed',
        'Salt and black pepper to taste'
      ],
      steps: [
        'Season the beef with curry powder, garlic, thyme, salt and pepper.',
        'Soften the onion in a large pot, then add beef and brown lightly.',
        'Add liquid, cover and simmer gently until the beef is cooked and tender.',
        'Add vegetables and cook until soft and the sauce is rich. Serve with rice or your favourite sides.'
      ]
    },
    skewers: {
      title: 'Jerk beef skewers',
      intro:
        'Smoky, lively skewers that connect naturally to the beef range and bring a more social, entertaining feel to the catalogue.',
      ingredients: [
        '600 g halal beef cubes',
        '2 tbsp jerk seasoning or the Tayyib spice blend',
        '1 sweet pepper and 1 red onion',
        '1 tbsp oil and fresh lime',
        'Wooden skewers, soaked if using'
      ],
      steps: [
        'Toss beef with oil, jerk seasoning and a squeeze of lime.',
        'Thread beef and vegetables onto skewers.',
        'Cook on a hot grill or in an oven, turning as needed, until safely cooked throughout.',
        'Rest briefly, then serve with a fresh salad or rice.'
      ]
    },
    seasoned: {
      title: 'Golden seasoned vegetables',
      intro:
        'A simple pantry-led dish that demonstrates how the Roasted Meat Spice Blend can also work beyond meat.',
      ingredients: [
        '1 sweet potato',
        '2 carrots and 1 sweet pepper',
        '1 zucchini or seasonal vegetables',
        'Olive oil',
        'Tayyib Halal Roasted Meat Spice Blend'
      ],
      steps: [
        'Heat the oven to 200°C / 400°F.',
        'Cut vegetables into evenly sized pieces.',
        'Toss with oil and the spice blend.',
        'Roast until golden and tender, turning once. Serve warm.'
      ]
    }
  };

  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];
  function loadImages() {
    qsa('[data-brand-asset]').forEach(img => {
      const name = img.dataset.brandAsset;
      // Assets are first-party compressed WebP files, cacheable by Cloudflare and the browser.
      if (/^[a-z0-9-]+$/.test(name)) img.src = `/assets/${name}.webp`;
    });
  }
  const menu = qs('.mobile-menu-toggle');
  const mobileNav = qs('#mobile-nav');
  function closeMenu() {
    mobileNav.hidden = true;
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open menu');
  }
  menu.addEventListener('click', () => {
    const open = mobileNav.hidden;
    mobileNav.hidden = !open;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  qsa('.mobile-nav a').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  qsa('.filter-chip').forEach((button) =>
    button.addEventListener('click', () => {
      qsa('.filter-chip').forEach((b) => {
        b.classList.toggle('active', b === button);
        b.setAttribute('aria-pressed', String(b === button));
      });
      qsa('.product-card').forEach((card) => {
        card.hidden =
          button.dataset.filter !== 'all' &&
          card.dataset.category !== button.dataset.filter;
      });
    })
  );

  const savedKey = 'tayyib.launch.favourites.v2';
  let saved = [];
  try {
    const arr = JSON.parse(localStorage.getItem(savedKey) || '[]');
    if (Array.isArray(arr)) saved = arr.filter((id) => Object.hasOwn(products, id)).slice(0, 6);
  } catch {}

  function syncSaved() {
    qsa('[data-save]').forEach((b) => {
      const yes = saved.includes(b.dataset.save);
      b.setAttribute('aria-pressed', String(yes));
      b.textContent = yes ? '♥' : '♡';
      b.setAttribute('aria-label', `${yes ? 'Remove ' : 'Save '}${products[b.dataset.save].title}`);
    });
    const badge = qs('.saved-count');
    badge.textContent = String(saved.length);
    badge.hidden = saved.length === 0;
    const list = qs('#saved-list');
    list.replaceChildren();
    if (!saved.length) {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'No saved ideas yet. Tap the heart on a product to keep it here.';
      list.append(p);
    }
    saved.forEach((id) => {
      const row = document.createElement('div');
      row.className = 'saved-item';
      const title = document.createElement('span');
      title.textContent = products[id].title;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => toggleSaved(id));
      row.append(title, remove);
      list.append(row);
    });
  }

  function toggleSaved(id) {
    if (!Object.hasOwn(products, id)) return;
    saved = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    try { localStorage.setItem(savedKey, JSON.stringify(saved)); } catch {}
    syncSaved();
  }

  qsa('[data-save]').forEach((button) =>
    button.addEventListener('click', () => toggleSaved(button.dataset.save))
  );

  const productDialog = qs('#product-dialog');
  let currentProduct = null;
  function showProduct(id) {
    const p = products[id];
    if (!p) return;
    currentProduct = id;
    qs('#product-dialog-title').textContent = p.title;
    qs('#product-dialog-description').textContent = p.description;
    const photo = qs('#modal-product-image');
    photo.alt = `${p.title} packaging concept`;
    photo.src = `/assets/${p.image}`;
    qs('#modal-product-link').href = p.url;
    qs('.modal-save').textContent = saved.includes(id)
      ? 'Remove saved idea ♥'
      : 'Save this idea ♡';
    productDialog.showModal();
  }
  qsa('[data-detail]').forEach((button) =>
    button.addEventListener('click', () => showProduct(button.dataset.detail))
  );
  qs('.modal-save').addEventListener('click', () => {
    if (currentProduct) {
      toggleSaved(currentProduct);
      qs('.modal-save').textContent = saved.includes(currentProduct)
        ? 'Remove saved idea ♥'
        : 'Save this idea ♡';
    }
  });

  const recipeDialog = qs('#recipe-dialog');
  qsa('[data-recipe]').forEach((button) =>
    button.addEventListener('click', () => {
      const r = recipes[button.dataset.recipe];
      if (!r) return;
      qs('#recipe-dialog-title').textContent = r.title;
      qs('#recipe-dialog-intro').textContent = r.intro;
      const ingredients = qs('#recipe-ingredients');
      const steps = qs('#recipe-steps');
      ingredients.replaceChildren();
      steps.replaceChildren();
      r.ingredients.forEach((i) => {
        const li = document.createElement('li');
        li.textContent = i;
        ingredients.append(li);
      });
      r.steps.forEach((i) => {
        const li = document.createElement('li');
        li.textContent = i;
        steps.append(li);
      });
      recipeDialog.showModal();
    })
  );

  const searchDialog = qs('#search-dialog');
  const searchInput = qs('#site-search');
  const searchResults = qs('#search-results');
  const searchItems = [
    ...Object.entries(products).map(([id, p]) => ({
      title: p.title,
      type: 'PRODUCT',
      keywords: `${p.description} ${p.category}`,
      action: () => {
        searchDialog.close();
        showProduct(id);
      }
    })),
    ...Object.entries(recipes).map(([id, r]) => ({
      title: r.title,
      type: 'RECIPE',
      keywords: r.intro,
      action: () => {
        searchDialog.close();
        qs(`[data-recipe="${id}"]`).click();
      }
    })),
    {
      title: 'What is halal?',
      type: 'GUIDE',
      keywords: 'halal meaning lifestyle certification tayyib',
      action: () => { searchDialog.close(); location.hash = '#halal-guide'; }
    },
    {
      title: 'Our philosophy',
      type: 'ABOUT',
      keywords: 'story tayyib jamaica goodness',
      action: () => { searchDialog.close(); location.hash = '#our-way'; }
    },
    {
      title: 'Find Halal in Jamaica',
      type: 'DIRECTORY',
      keywords: 'mosque parish Kingston Montego Bay organization certification source map',
      action: () => { searchDialog.close(); location.href = '/discover/'; }
    },
    {
      title: 'Community resources',
      type: 'COMMUNITY',
      keywords: 'mosques jamaica groups visit',
      action: () => { searchDialog.close(); location.href = '/community/'; }
    },
    {
      title: 'Halal learning guides',
      type: 'GUIDES',
      keywords: 'halal tayyib labels ingredients beginners',
      action: () => { searchDialog.close(); location.href = '/learn/'; }
    },
    {
      title: 'Community events',
      type: 'EVENTS',
      keywords: 'Ramadan Eid gatherings local calendar',
      action: () => { searchDialog.close(); location.href = '/events/'; }
    },
    {
      title: 'Tayyib Kitchen meal planner',
      type: 'KITCHEN',
      keywords: 'shopping list recipes portions servings',
      action: () => { searchDialog.close(); location.href = '/kitchen/'; }
    },
    {
      title: 'Launch updates',
      type: 'JOIN',
      keywords: 'email register early access',
      action: () => { searchDialog.close(); location.hash = '#join'; }
    }
  ];

  function renderSearch() {
    const q = searchInput.value.trim().toLocaleLowerCase();
    searchResults.replaceChildren();
    const matching = q
      ? searchItems.filter((x) => (`${x.title} ${x.keywords}`).toLocaleLowerCase().includes(q))
      : searchItems.slice(0, 7);
    if (!matching.length) {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'No results. Try a product, recipe or halal living.';
      searchResults.append(p);
    }
    matching.forEach((item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'search-result';
      const label = document.createElement('span');
      label.textContent = item.title;
      const type = document.createElement('small');
      type.textContent = item.type;
      b.append(label, type);
      b.addEventListener('click', item.action);
      searchResults.append(b);
    });
  }

  qsa('.search-open').forEach((button) =>
    button.addEventListener('click', () => {
      searchInput.value = '';
      renderSearch();
      searchDialog.showModal();
      searchInput.focus();
    })
  );
  searchInput.addEventListener('input', renderSearch);
  qsa('.saved-open').forEach((button) =>
    button.addEventListener('click', () => qs('#saved-dialog').showModal())
  );
  qs('#saved-to-join').addEventListener('click', () => qs('#saved-dialog').close());
  qsa('.modal-close').forEach((button) =>
    button.addEventListener('click', () => button.closest('dialog').close())
  );
  qsa('dialog').forEach((d) =>
    d.addEventListener('click', (e) => {
      if (e.target === d) d.close();
    })
  );
  qs('#faq-jump').addEventListener('click', () => {
    location.hash = '#questions';
    qs('.faq-list details').open = true;
  });

  qs('#year').textContent = new Date().getFullYear();
  syncSaved();
  loadImages();

  const form = qs('#waitlist-form');
  const submit = qs('#join-submit');
  const status = qs('#form-status');
  let config = null, turnstileToken = null, turnstileId = null;
  const setStatus = (message, state = '') => {
    status.textContent = message;
    status.className = `form-status ${state}`;
  };

  function loadTurnstile(sitekey) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (!window.turnstile) return reject(Error('Turnstile unavailable'));
        turnstileId = window.turnstile.render('#turnstile-slot', {
          sitekey,
          callback: (t) => {
            turnstileToken = t;
            setStatus('Complete the form to join our launch list.');
          },
          'expired-callback': () => {
            turnstileToken = null;
            setStatus('Verification expired. Please try again.', 'error');
          },
          'error-callback': () => {
            turnstileToken = null;
            setStatus('Verification could not be completed.', 'error');
          }
        });
        resolve();
      };
      script.onerror = () => reject(Error('Verification could not load'));
      document.head.append(script);
    });
  }

  submit.disabled = true;
  fetch('/api/config', { headers: { accept: 'application/json' }, cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then(async (data) => {
      if (!data || data.enabled !== true || !data.turnstileSiteKey) {
        setStatus('Our launch list is not open yet. Please check back soon.');
        return;
      }
      config = data;
      await loadTurnstile(data.turnstileSiteKey);
      submit.disabled = false;
      setStatus('Complete the security check, then sign up for launch news.');
    })
    .catch(() => setStatus('Our launch list is being prepared. Please check back soon.'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!config) {
      setStatus('Registrations are not open yet.', 'error');
      return;
    }
    const email = qs('#email').value.trim();
    const consent = qs('#consent').checked;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      setStatus('Please enter a valid email address.', 'error');
      qs('#email').focus();
      return;
    }
    if (!consent) {
      setStatus('Please confirm your consent to receive launch emails.', 'error');
      qs('#consent').focus();
      return;
    }
    if (!turnstileToken) {
      setStatus('Please complete the security verification first.', 'error');
      return;
    }
    submit.disabled = true;
    setStatus('Saving your registration…');
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, website: form.elements.website.value, turnstileToken })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw Error(data?.error || 'Registration could not be completed.');
      setStatus('You’re on the list. Thank you for being part of the beginning!', 'success');
      form.reset();
    } catch (err) {
      setStatus(err.message || 'Please try again later.', 'error');
    } finally {
      turnstileToken = null;
      if (window.turnstile && turnstileId != null) window.turnstile.reset(turnstileId);
      submit.disabled = false;
    }
  });
})();
