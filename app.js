// TheCarders Client SPA Controller & Supabase Auth Client
(function () {
  const supabaseUrl = 'https://ygzcvvgxiznzhrcqexff.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnemN2dmd4aXpuemhyY3FleGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzU4ODAsImV4cCI6MjA5NDgxMTg4MH0.Qrx0aMROaf4k5jVUwNcvfjdHmAgS5y2NywDCdaTb1qU';
  const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
  // Utility Toast Notification System
  const ut = {
    toast(message, type = 'success') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      let icon = 'check-circle';
      if (type === 'error') icon = 'alert-triangle';
      
      toast.innerHTML = `
        <i data-lucide="${icon}" class="icon-sm"></i>
        <span class="toast-msg">${message}</span>
      `;
      
      container.appendChild(toast);
      lucide.createIcons();
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 4000);
    },
    success(msg) { this.toast(msg, 'success'); },
    error(msg) { this.toast(msg, 'error'); }
  };

  // Mock Database Setup (LocalStorage wrapper)
  const db = {
    get(key, defaultValue = null) {
      const val = localStorage.getItem(`carding_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    },
    set(key, value) {
      localStorage.setItem(`carding_${key}`, JSON.stringify(value));
    },
    initialize() {
      // Seed Cards if empty
      if (!this.get('cards')) {
        this.set('cards', [
          { id: 'c1', title: 'Chase Sapphire Visa Infinite', category: 'visa', bank: 'Chase Bank', country: 'United States', price: 45, status: 'available', card_number: '4111 22XX XXXX 9081', details: { number: '4111 2234 5678 9081', cvv: '284', expiry: '12/28' } },
          { id: 'c2', title: 'Barclays Aviator MasterCard Red', category: 'mastercard', bank: 'Barclays Bank', country: 'United Kingdom', price: 35, status: 'available', card_number: '5224 88XX XXXX 4412', details: { number: '5224 8812 3456 4412', cvv: '119', expiry: '06/27' } },
          { id: 'c3', title: 'Amex Gold Preferred Business', category: 'amex', bank: 'American Express', country: 'Canada', price: 60, status: 'available', card_number: '3782 99XX XXXX 1004', details: { number: '3782 9901 2345 1004', cvv: '4938', expiry: '09/29' } },
          { id: 'c4', title: 'Discover IT Cash Back Plus', category: 'discover', bank: 'Discover Bank', country: 'United States', price: 30, status: 'available', card_number: '6011 45XX XXXX 3390', details: { number: '6011 4512 8765 3390', cvv: '772', expiry: '03/28' } },
          { id: 'c5', title: 'Wells Fargo Active Cash Visa', category: 'visa', bank: 'Wells Fargo', country: 'United States', price: 40, status: 'available', card_number: '4532 77XX XXXX 1102', details: { number: '4532 7789 0123 1102', cvv: '005', expiry: '10/27' } },
          { id: 'c6', title: 'HSBC Premier World MasterCard', category: 'mastercard', bank: 'HSBC UK', country: 'United Kingdom', price: 55, status: 'available', card_number: '5412 75XX XXXX 6671', details: { number: '5412 7567 8901 6671', cvv: '921', expiry: '05/28' } }
        ]);
      }
      
      // Seed Balances
      if (!this.get('balances')) {
        this.set('balances', {});
      }
      
      // Seed Deposits if empty
      if (!this.get('deposits')) {
        this.set('deposits', []);
      }

      if (!this.get('deposit_mockup_seeded_v4')) {
        this.set('balances', {});
        this.set('deposits', []);
        this.set('deposit_mockup_seeded_v4', true);
      }

      // Seed Orders if empty
      if (!this.get('orders')) {
        this.set('orders', []);
      }

      // Seed Flash Packages if empty
      if (!this.get('flash_packages')) {
        this.set('flash_packages', [
          { id: 'fp1', name: 'Starter Package', flash_amount: 1000, price_usd: 50, is_popular: false },
          { id: 'fp2', name: 'Pro Package', flash_amount: 5000, price_usd: 200, is_popular: true },
          { id: 'fp3', name: 'Elite Package', flash_amount: 20000, price_usd: 500, is_popular: false }
        ]);
      }

      // Seed Products if empty
      if (!this.get('products')) {
        this.set('products', [
          {
            id: 'p1',
            title: 'CapCut Pro Subscription - Lifetime',
            description: 'Premium CapCut Pro account with full access to all pro features, filters, effects, and templates. Lifetime validity with no recurring charges.',
            original_price: 199.99,
            discounted_price: 49.99,
            image: '',
            category: 'subscriptions',
            created_date: new Date().toISOString()
          },
          {
            id: 'p2',
            title: 'Funded Trading Account - FTMO',
            description: 'Fully funded FTMO trading account with up to $200K capital. Passed verification, ready for live trading immediately.',
            original_price: 1499.99,
            discounted_price: 449.99,
            image: '',
            category: 'funded_accounts',
            created_date: new Date().toISOString()
          },
          {
            id: 'p3',
            title: 'Netflix Premium - 12 Months',
            description: 'Netflix Premium 4K UHD subscription for 12 full months. Works on all devices. Includes family sharing, no geo-restrictions.',
            original_price: 239.88,
            discounted_price: 59.99,
            image: '',
            category: 'subscriptions',
            created_date: new Date().toISOString()
          },
          {
            id: 'p4',
            title: 'Spotify Premium - Lifetime',
            description: 'Lifetime Spotify Premium account with ad-free music streaming, unlimited skips, offline downloads, and hi-fi audio quality.',
            original_price: 159.99,
            discounted_price: 39.99,
            image: '',
            category: 'subscriptions',
            created_date: new Date().toISOString()
          },
          {
            id: 'p5',
            title: 'Funded Forex Account - 100K',
            description: 'Pre-funded forex trading account with $100,000 in capital. Profit split 80/20 in your favor. Instant delivery and setup.',
            original_price: 999.99,
            discounted_price: 299.99,
            image: '',
            category: 'funded_accounts',
            created_date: new Date().toISOString()
          },
          {
            id: 'p6',
            title: 'Adobe Creative Cloud - All Apps',
            description: 'Full Adobe Creative Cloud suite including Photoshop, Premiere Pro, After Effects, Illustrator and 20+ apps. 1-year license.',
            original_price: 599.88,
            discounted_price: 149.99,
            image: '',
            category: 'subscriptions',
            created_date: new Date().toISOString()
          },
          {
            id: 'p7',
            title: 'Binance Verified Account',
            description: 'Fully KYC-verified Binance account with high withdrawal limits. Ready to trade spot, futures, and P2P markets.',
            original_price: 799.99,
            discounted_price: 199.99,
            image: '',
            category: 'accounts',
            created_date: new Date().toISOString()
          },
          {
            id: 'p8',
            title: 'ChatGPT Plus - 1 Year',
            description: 'ChatGPT Plus subscription with GPT-4 access, priority processing, DALL-E 3 image generation, and plugins. Full 12-month access.',
            original_price: 239.88,
            discounted_price: 79.99,
            image: '',
            category: 'subscriptions',
            created_date: new Date().toISOString()
          }
        ]);
      }

      // Seed Deposit Addresses if empty
      if (!this.get('deposit_addresses')) {
        this.set('deposit_addresses', [
          { id: 'da1', label: 'USDT (BEP20)', network: 'usdt_bep20', address: '0x99aef34f0e75de4336c1e345b18dfa567113bc62', icon: 'coins', iconColor: '#ffaa00', subtitle: 'Binance Smart Chain' },
          { id: 'da2', label: 'USDT (TRC20)', network: 'usdt_trc20', address: 'TYjGq8bMv82A6zF1K7hP4X9J3E2M9L5W1A', icon: 'zap', iconColor: '#ff4a4a', subtitle: 'Tron Network' },
          { id: 'da3', label: 'Bitcoin (BTC)', network: 'btc', address: 'bc1qxy2kg3ut5xg7z3qnw304n283lkpq7w8h20rlfd', icon: 'text', iconColor: '#ffaa00', subtitle: 'Bitcoin Network' },
          { id: 'da4', label: 'Solana (SOL)', network: 'sol', address: 'HN7cAB1R51aw65sRQNn5T199H7J71FfV7N1cABHN7cAB', icon: 'text', iconColor: '#8b5cf6', subtitle: 'Solana Network' },
          { id: 'da5', label: 'Binance UID Transfer', network: 'binance_uid', address: '883719027', icon: 'building', iconColor: '#eab308', subtitle: 'Binance Pay' }
        ]);
      }
    }
  };

  // Supabase Deposit Database Service
  const depositService = {
    async submitDeposit(deposit) {
      console.log('depositService: Submitting deposit to Supabase:', deposit);
      try {
        const { data, error } = await supabaseClient
          .from('deposits')
          .insert([{
            id: deposit.id,
            user_email: deposit.user_email,
            amount: parseFloat(deposit.amount),
            payment_method: deposit.payment_method,
            transaction_hash: deposit.transaction_hash,
            proof_image: deposit.proof_image || '',
            status: deposit.status,
            created_date: deposit.created_date
          }]);
        if (error) {
          console.error('depositService: Supabase insert error:', error);
          throw error;
        }
        console.log('depositService: Deposit successfully inserted:', data);
        return data;
      } catch (err) {
        console.error('depositService: Failed to submit deposit:', err);
        throw err;
      }
    },

    async fetchAllDeposits() {
      console.log('depositService: Fetching all deposits from Supabase');
      try {
        const { data, error } = await supabaseClient
          .from('deposits')
          .select('*')
          .order('created_date', { ascending: false });
        if (error) {
          console.error('depositService: Supabase fetch error:', error);
          throw error;
        }
        console.log(`depositService: Fetched ${data ? data.length : 0} deposits`);
        return data || [];
      } catch (err) {
        console.error('depositService: Failed to fetch all deposits:', err);
        return [];
      }
    },

    async fetchUserDeposits(email) {
      console.log(`depositService: Fetching deposits for user ${email} from Supabase`);
      try {
        const { data, error } = await supabaseClient
          .from('deposits')
          .select('*')
          .eq('user_email', email)
          .order('created_date', { ascending: false });
        if (error) {
          console.error('depositService: Supabase fetch error:', error);
          throw error;
        }
        console.log(`depositService: Fetched ${data ? data.length : 0} deposits for ${email}`);
        return data || [];
      } catch (err) {
        console.error(`depositService: Failed to fetch deposits for ${email}:`, err);
        return [];
      }
    },

    async updateDepositStatus(id, status) {
      console.log(`depositService: Updating deposit ${id} status to ${status} in Supabase`);
      try {
        const { data, error } = await supabaseClient
          .from('deposits')
          .update({ status: status })
          .eq('id', id);
        if (error) {
          console.error('depositService: Supabase update error:', error);
          throw error;
        }
        console.log(`depositService: Deposit ${id} status successfully updated to ${status}`);
        return data;
      } catch (err) {
        console.error(`depositService: Failed to update deposit status for ${id}:`, err);
        throw err;
      }
    },

    subscribeToDeposits(callback) {
      console.log('depositService: Subscribing to deposits realtime channel');
      const channel = supabaseClient
        .channel('public:deposits')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, payload => {
          console.log('depositService: Realtime change received:', payload);
          callback(payload);
        })
        .subscribe();
      return channel;
    }
  };

  // Main Application Instance
  const app = {
    currentUser: null,
    activeAuthTab: 'login',
    activeAdminTab: 'deposits',
    adminAuthenticated: false,
    
    syncUserBalance(deposits) {
      if (!this.currentUser) return;
      const email = this.currentUser.email;
      const credited = db.get('credited_deposits', []);
      const balances = db.get('balances', {});
      let userBalance = balances[email] || 0.00;
      let updated = false;

      deposits.forEach(d => {
        if (d.status === 'approved' && !credited.includes(d.id)) {
          console.log(`syncUserBalance: Crediting user ${email} with approved deposit of $${d.amount} (ID: ${d.id})`);
          userBalance += parseFloat(d.amount);
          credited.push(d.id);
          updated = true;
        }
      });

      if (updated) {
        balances[email] = userBalance;
        db.set('balances', balances);
        db.set('credited_deposits', credited);
        this.updateHeaderUI();
      }
    },
    
    init() {
      db.initialize();
      this.adminAuthenticated = false; // Never auto-login admin console, start clean in-memory
      
      // Sync Supabase Auth session
      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
          app.currentUser = { email: session.user.email, role: 'user' };
          db.set('session_user', app.currentUser);
          
          // Background sync user's deposits and balance from Supabase
          try {
            const myDeposits = await depositService.fetchUserDeposits(session.user.email);
            app.syncUserBalance(myDeposits);
          } catch (e) {
            console.error("Background deposit sync failed:", e);
          }
        } else {
          app.currentUser = null;
          db.set('session_user', null);
        }
        app.updateHeaderUI();
      });
      
      // Realtime subscription for deposits
      depositService.subscribeToDeposits((payload) => {
        console.log("Realtime deposit event received:", payload);
        
        // If we are currently viewing the admin panel and on the deposits tab, re-render it
        if (app.adminAuthenticated && app.activeAdminTab === 'deposits') {
          app.renderAdminSubTab();
        }
        
        // Show notification toast to admin if a new deposit is inserted
        if (payload.eventType === 'INSERT') {
          const newDep = payload.new;
          ut.success(`New deposit request: $${parseFloat(newDep.amount).toFixed(2)} from ${newDep.user_email}`);
          // Play a gentle notification sound
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, app.currentTime || audioCtx.currentTime); // D5
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.3);
          } catch (e) {
            console.log("Audio notification failed:", e);
          }
        }
      });

      // Hamburger Menu Toggle Logic
      const hamburgerBtn = document.getElementById('hamburger-menu-toggle');
      const mobileOverlay = document.getElementById('mobile-overlay');
      const closeMobileMenu = () => document.body.classList.remove('menu-open');
      const toggleMobileMenu = (e) => {
        e.stopPropagation();
        document.body.classList.toggle('menu-open');
      };
      
      if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
        hamburgerBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          toggleMobileMenu(e);
        });
      }
      if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
        mobileOverlay.addEventListener('touchend', (e) => {
          e.preventDefault();
          closeMobileMenu();
        });
      }
      
      // Close menu on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
          closeMobileMenu();
        }
      });
      
      // Load current user from session if any
      app.currentUser = db.get('session_user', null);
      if (app.currentUser) {
        // Trigger background sync for existing session
        depositService.fetchUserDeposits(app.currentUser.email).then(myDeposits => {
          app.syncUserBalance(myDeposits);
        }).catch(err => console.error("Session restore background sync failed:", err));
      }
      app.updateHeaderUI();
      
      // Router setup
      window.addEventListener('hashchange', () => this.route());
      this.route();
      
      // Listen for profile dropdown toggles
      document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profile-dropdown');
        const trigger = document.getElementById('profile-trigger');
        if (dropdown && trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
      
      // Profile trigger toggle listener
      const body = document.body;
      body.addEventListener('click', (e) => {
        if (e.target.closest('#profile-trigger')) {
          const dropdown = document.getElementById('profile-dropdown');
          dropdown.classList.toggle('open');
        }
      });

      // FAQ accordion handler
      body.addEventListener('click', (e) => {
        const trigger = e.target.closest('.faq-trigger');
        if (trigger) {
          const item = trigger.closest('.faq-item');
          if (item) {
            item.classList.toggle('active');
          }
        }
      });
    },

    // UI Render Helper
    render(html) {
      const viewPort = document.getElementById('app-router-view');
      if (viewPort) {
        viewPort.innerHTML = html;
        lucide.createIcons();
      }
    },

    // SPA Routing Engine
    route() {
      // Close mobile menu on route change
      document.body.classList.remove('menu-open');
      
      const hash = window.location.hash || '#/';
      
      // Show/hide floating WhatsApp button (hidden on admin pages)
      const whatsappBtn = document.getElementById('whatsapp-float');
      if (whatsappBtn) {
        whatsappBtn.classList.toggle('whatsapp-hidden', hash.startsWith('#/admin67'));
      }

      // Update Navigation active state in header
      document.querySelectorAll('.nav-item').forEach(item => {
        const routeAttr = item.getAttribute('data-route');
        if (hash === '#/' && routeAttr === 'home') {
          item.classList.add('active');
        } else if (hash.startsWith('#/cards') && routeAttr === 'cards') {
          item.classList.add('active');
        } else if (hash.startsWith('#/products') && routeAttr === 'products') {
          item.classList.add('active');
        } else if (hash.startsWith('#/orders') && routeAttr === 'orders') {
          item.classList.add('active');
        } else if (hash.startsWith('#/flash-usdt') && routeAttr === 'flash-usdt') {
          item.classList.add('active');
        } else if (hash.startsWith('#/deposit') && routeAttr === 'deposit') {
          item.classList.add('active');
        } else if (hash.startsWith('#/account') && routeAttr === 'account') {
          item.classList.add('active');
        } else if (hash.startsWith('#/admin67') && routeAttr === 'admin') {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      // Match routes
      if (hash === '#/') {
        this.viewHome();
      } else if (hash === '#/cards') {
        this.viewCards();
      } else if (hash.startsWith('#/checkout')) {
        this.viewCheckout();
      } else if (hash === '#/deposit') {
        this.viewDeposit();
      } else if (hash === '#/account') {
        this.viewAccount();
      } else if (hash.startsWith('#/flash-checkout')) {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const pkgId = urlParams.get('package') || 'fp1';
        this.viewFlashCheckout(pkgId);
      } else if (hash === '#/products') {
        this.viewProducts();
      } else if (hash.startsWith('#/product-checkout')) {
        this.viewProductCheckout();
      } else if (hash === '#/orders') {
        this.viewOrders();
      } else if (hash === '#/flash-usdt') {
        this.viewFlashUSDT();
      } else if (hash === '#/admin67') {
        if (!this.adminAuthenticated) {
          this.viewAdminLogin();
        } else {
          this.viewAdmin();
        }
      } else {
        this.view404();
      }
    },

    // Header UI updates based on session state
    updateHeaderUI() {
      const authBtn = document.getElementById('auth-btn');
      const profileDropdown = document.getElementById('profile-dropdown');
      const balanceWidget = document.getElementById('balance-widget');
      const adminLinks = document.querySelectorAll('.admin-only');
      const headerBalance = document.getElementById('header-balance');
      const mobileLoginBtn = document.getElementById('mobile-nav-login-btn');
      
      if (this.currentUser) {
        authBtn.classList.add('hidden');
        profileDropdown.classList.remove('open');
        profileDropdown.classList.remove('hidden');
        if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
        
        // Initials inside profile trigger
        const initials = this.currentUser.email.substring(0, 2).toUpperCase();
        document.querySelector('.profile-initials').innerText = initials;
        document.getElementById('dropdown-email').innerText = this.currentUser.email;
        
        // Show role
        const role = this.currentUser.role || 'User';
        const dropdownRole = document.getElementById('dropdown-role');
        dropdownRole.innerText = role.toUpperCase();
        if (role === 'admin') {
          dropdownRole.className = 'user-role badge badge-primary';
          adminLinks.forEach(l => l.classList.remove('hidden'));
        } else {
          dropdownRole.className = 'user-role badge badge-outline';
          adminLinks.forEach(l => l.classList.add('hidden'));
        }
        
        // Show balance widget
        balanceWidget.classList.remove('hidden');
        const balances = db.get('balances', {});
        const balance = balances[this.currentUser.email] || 0.00;
        headerBalance.innerText = `$${balance.toFixed(2)}`;
      } else {
        authBtn.classList.remove('hidden');
        profileDropdown.classList.add('hidden');
        balanceWidget.classList.add('hidden');
        adminLinks.forEach(l => l.classList.add('hidden'));
        if (mobileLoginBtn) mobileLoginBtn.classList.remove('hidden');
      }
    },

    // Require Auth Guard
    pendingRedirectRoute: null,
    requireAuth(redirectTarget = null) {
      if (!this.currentUser) {
        this.pendingRedirectRoute = redirectTarget || window.location.hash;
        ut.error("Authentication required! Please register or login to perform this action.");
        this.openAuthModal();
        return false;
      }
      return true;
    },

    // -------------------------------------------------------------
    // VIEWS RENDERERS
    // -------------------------------------------------------------
    
    // 1. Home Page View
    viewHome() {
      const html = `
        <div class="grid-2 mt-6">
          <div class="hero-text">
            <h1 class="hero-title font-heading font-extrabold leading-tight mb-4">
              Premium <br>
              <span class="text-primary text-glow">Flash USDT</span> <br>
              & Cards
            </h1>
            <p class="font-mono text-sm text-muted-foreground leading-relaxed mb-6" style="max-width: 460px;">
              Get instant access to flash USDT and premium credit cards with lightning-fast delivery, unbeatable rates, and 24/7 client support.
            </p>
            <div class="flex gap-4 mb-8">
              <a href="#/cards" class="btn btn-primary btn-lg glow-green font-bold text-sm">
                <i data-lucide="shopping-bag" class="icon-sm"></i> Browse Products
              </a>
              <a href="#/flash-usdt" class="btn btn-outline btn-lg font-bold text-sm">
                <i data-lucide="zap" class="icon-sm"></i> Buy Flash USDT
              </a>
            </div>
            
            <div class="hero-stats">
              <div class="stat-item">
                <h4 class="font-heading text-2xl font-bold">10K+</h4>
                <p>Cards Sold</p>
              </div>
              <div class="stat-item">
                <h4 class="font-heading text-2xl font-bold">99.9%</h4>
                <p>Success Rate</p>
              </div>
              <div class="stat-item">
                <h4 class="font-heading text-2xl font-bold">24/7</h4>
                <p>Active Support</p>
              </div>
            </div>
          </div>
          
          <div class="hero-graphic" style="display: flex; flex-direction: column; gap: 1.5rem; width: 100%;">
            <div class="hero-image-container">
              <img src="assets/home_hero.png" alt="" class="hero-custom-img" onerror="this.parentElement.style.display='none'">
            </div>
            <div class="holo-card" style="margin: 0 auto;">
              <div class="card-top">
                <div class="card-chip"></div>
                <div class="card-brand">THECAR4DERS</div>
              </div>
              <div class="card-middle">
                <div class="card-number">4111 22XX XXXX 9988</div>
              </div>
              <div class="card-bottom">
                <div class="card-holder">
                  <label>Card Holder</label>
                  <span>VIP MEMBER</span>
                </div>
                <div class="card-expiry">
                  <label>Expires</label>
                  <span>12 / 29</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section class="features-section">
          <div class="section-header">
            <h2 class="font-heading text-2xl font-bold text-center mb-2">Why Choose Our Service?</h2>
            <p class="font-mono text-xs text-muted-foreground text-center">Secured networks, custom parameters, maximum validation.</p>
          </div>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon-wrapper">
                <i data-lucide="zap" class="icon-md"></i>
              </div>
              <h3 class="font-heading font-bold text-sm mb-2">Instant Delivery</h3>
              <p class="font-mono text-xs text-muted-foreground">Digital goods are processed instantly and delivered to your private profile within 60 seconds of confirmation.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon-wrapper">
                <i data-lucide="shield-check" class="icon-md"></i>
              </div>
              <h3 class="font-heading font-bold text-sm mb-2">100% Secure</h3>
              <p class="font-mono text-xs text-muted-foreground">All transactions are processed through end-to-end encrypted tunnels. No trace, absolute anonymity.</p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon-wrapper">
                <i data-lucide="globe" class="icon-md"></i>
              </div>
              <h3 class="font-heading font-bold text-sm mb-2">Global Coverage</h3>
              <p class="font-mono text-xs text-muted-foreground">Premium cards verified across US, United Kingdom, Canada, European Union, and Asia-Pacific banks.</p>
            </div>
          </div>
        </section>

        <!-- How It Works -->
        <section class="how-it-works-section">
          <div class="section-header">
            <span class="badge badge-primary mb-3"><i data-lucide="check-square" class="icon-sm mr-1"></i> Simple Process</span>
            <h2 class="font-heading text-3xl font-extrabold text-glow text-primary text-center">How It Works</h2>
            <p class="font-mono text-xs text-muted-foreground text-center">Get started in just 3 simple steps. It's fast, easy, and secure.</p>
          </div>
          
          <div class="process-grid">
            <div class="process-step">
              <div class="step-number">1</div>
              <h3 class="font-heading font-bold text-base mb-2">Choose Your Product</h3>
              <p class="font-mono text-xs text-muted-foreground" style="max-width: 250px; margin: 0 auto; line-height: 1.5;">
                Browse our selection of premium cards and packages. Pick what suits you best.
              </p>
            </div>
            
            <div class="process-step">
              <div class="step-number">2</div>
              <h3 class="font-heading font-bold text-base mb-2">Make Payment</h3>
              <p class="font-mono text-xs text-muted-foreground" style="max-width: 250px; margin: 0 auto; line-height: 1.5;">
                Complete your purchase securely using crypto or other supported payment methods.
              </p>
            </div>
            
            <div class="process-step">
              <div class="step-number">3</div>
              <div class="step-number-glow"></div>
              <h3 class="font-heading font-bold text-base mb-2">Receive Instantly</h3>
              <p class="font-mono text-xs text-muted-foreground" style="max-width: 250px; margin: 0 auto; line-height: 1.5;">
                Your product is delivered instantly to your wallet or email. Start using it right away!
              </p>
            </div>
          </div>
        </section>

        <!-- What Our Clients Say -->
        <section class="testimonials-section">
          <div class="section-header">
            <span class="badge badge-primary mb-3"><i data-lucide="shield" class="icon-sm mr-1"></i> Testimonials</span>
            <h2 class="font-heading text-3xl font-extrabold text-glow text-primary text-center">What Our Clients Say</h2>
          </div>
          
          <div class="testimonials-grid">
            <div class="testimonial-card">
              <div class="stars">
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
              </div>
              <p class="testimonial-text">
                "Incredible service! Received my cards within minutes. The support team was super responsive. Will definitely buy again."
              </p>
              <div class="client-info">
                <div class="client-avatar" style="background-color: #10b981;">AK</div>
                <div class="client-meta">
                  <span class="client-name">Alex K.</span>
                  <span class="client-role">Crypto Trader</span>
                </div>
              </div>
            </div>
            
            <div class="testimonial-card">
              <div class="stars">
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
              </div>
              <p class="testimonial-text">
                "The Elite Black Card is amazing. Using it globally with no issues. Best purchase I've made this year. Highly recommend!"
              </p>
              <div class="client-info">
                <div class="client-avatar" style="background-color: #8b5cf6;">SM</div>
                <div class="client-meta">
                  <span class="client-name">Sarah M.</span>
                  <span class="client-role">Business Owner</span>
                </div>
              </div>
            </div>
            
            <div class="testimonial-card">
              <div class="stars">
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
                <i data-lucide="star" class="icon-sm fill-current"></i>
              </div>
              <p class="testimonial-text">
                "Fast, reliable, and secure. I've been using TheCA4DERS for months now and they never disappoint. Great prices too!"
              </p>
              <div class="client-info">
                <div class="client-avatar" style="background-color: #3b82f6;">DJ</div>
                <div class="client-meta">
                  <span class="client-name">David J.</span>
                  <span class="client-role">Freelancer</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Frequently Asked Questions -->
        <section class="faq-section">
          <div class="section-header">
            <h2 class="font-heading text-3xl font-extrabold text-glow text-primary text-center">Frequently Asked Questions</h2>
          </div>
          
          <div class="faq-container">
            <div class="faq-item">
              <button class="faq-trigger">
                <span class="faq-title">What is Flash USDT?</span>
                <i data-lucide="chevron-down" class="faq-icon"></i>
              </button>
              <div class="faq-content">
                <p class="faq-text">
                  Flash USDT is transactional demo cryptocurrency running on standard test network parameters (TRC20/BEP20) showing immediate delivery validations inside client environments.
                </p>
              </div>
            </div>
            
            <div class="faq-item">
              <button class="faq-trigger">
                <span class="faq-title">How fast is the delivery?</span>
                <i data-lucide="chevron-down" class="faq-icon"></i>
              </button>
              <div class="faq-content">
                <p class="faq-text">
                  Delivery is fully automated. Unlocked cards and transaction outputs appear instantly on your private dashboard within 60 seconds of checkout confirmation.
                </p>
              </div>
            </div>
            
            <div class="faq-item">
              <button class="faq-trigger">
                <span class="faq-title">What payment methods do you accept?</span>
                <i data-lucide="chevron-down" class="faq-icon"></i>
              </button>
              <div class="faq-content">
                <p class="faq-text">
                  We accept major cryptocurrencies including USDT (BEP-20 / TRC-20) and Bitcoin. You can credit your local balance by depositing funds via the Wallet screen.
                </p>
              </div>
            </div>
            
            <div class="faq-item">
              <button class="faq-trigger">
                <span class="faq-title">Is there a money-back guarantee?</span>
                <i data-lucide="chevron-down" class="faq-icon"></i>
              </button>
              <div class="faq-content">
                <p class="faq-text">
                  Yes, if a card encounters validation errors or fails verification tests, you can submit screenshots to support or use the dashboard to request balance refunds.
                </p>
              </div>
            </div>
            
            <div class="faq-item">
              <button class="faq-trigger">
                <span class="faq-title">Do the cards work internationally?</span>
                <i data-lucide="chevron-down" class="faq-icon"></i>
              </button>
              <div class="faq-content">
                <p class="faq-text">
                  All credit cards are verified for global processing networks and function across US, UK, Canada, EU, and Asian merchant gateways.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Support & Contact -->
        <section class="support-section">
          <div class="section-header">
            <span class="badge badge-primary mb-3"><i data-lucide="headset" class="icon-sm mr-1"></i> 24/7 Support</span>
            <h2 class="font-heading text-3xl font-extrabold text-glow text-primary text-center">Get In Touch</h2>
            <p class="font-mono text-xs text-muted-foreground text-center">Have a question or need help? We're here for you around the clock.</p>
          </div>
          
          <div class="support-grid">
            <div class="support-form-card">
              <h3 class="font-heading font-bold text-base mb-4">Open a Ticket</h3>
              <form id="support-ticket-form" onsubmit="app.handleTicketSubmit(event)">
                <div class="form-group">
                  <label class="form-label">Your Name</label>
                  <input type="text" class="form-input" id="ticket-name" placeholder="Enter your name" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" class="form-input" id="ticket-email" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Subject</label>
                  <select class="form-select" id="ticket-subject">
                    <option value="">Select a subject...</option>
                    <option value="payment">Payment Issue</option>
                    <option value="delivery">Delivery Problem</option>
                    <option value="card">Card Not Working</option>
                    <option value="account">Account Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Message</label>
                  <textarea class="form-textarea" id="ticket-message" rows="4" placeholder="Describe your issue in detail..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-full glow-green font-bold text-sm">
                  <i data-lucide="send" class="icon-sm"></i> Submit Ticket
                </button>
              </form>
            </div>
            
            <div class="support-info-card">
              <h3 class="font-heading font-bold text-base mb-4">Contact Us Directly</h3>
              
              <div class="support-contact-item">
                <i data-lucide="message-circle" class="icon-md text-primary"></i>
                <div>
                  <span class="support-contact-label">WhatsApp</span>
                  <span class="support-contact-value">+966 57 118 8336</span>
                </div>
              </div>
              
              <div class="support-contact-item">
                <i data-lucide="mail" class="icon-md text-primary"></i>
                <div>
                  <span class="support-contact-label">Email</span>
                  <span class="support-contact-value">support@thecarders.com</span>
                </div>
              </div>
              
              <div class="support-contact-item">
                <i data-lucide="clock" class="icon-md text-primary"></i>
                <div>
                  <span class="support-contact-label">Response Time</span>
                  <span class="support-contact-value">Typically within 5-10 minutes</span>
                </div>
              </div>
              
              <a href="https://wa.me/966571188336" target="_blank" rel="noopener noreferrer" class="btn btn-success w-full font-bold text-sm mt-4" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none;">
                <i data-lucide="message-circle" class="icon-sm"></i> Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>
      `;
      this.render(html);
    },

    // 2. Cards Page View
    viewCards() {
      const cards = db.get('cards', []).filter(c => c.status === 'available');
      const balances = db.get('balances', {});
      const userBalance = this.currentUser ? (balances[this.currentUser.email] || 0) : 0;
      
      let html = `
        <div class="welcome-widget" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 class="font-heading text-2xl sm:text-3xl font-extrabold text-card-foreground">
              Welcome to <span class="text-primary text-glow">THECAR4DERS</span>
            </h1>
            <p class="font-mono text-xs text-muted-foreground mt-1">Your premium cards dashboard — Real-time stats & instant purchases</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-success" style="box-shadow: 0 0 10px rgba(23, 207, 115, 0.2);"><i data-lucide="circle" class="icon-sm fill-current mr-1 animate-pulse"></i> All systems operational</span>
          </div>
        </div>

        <!-- Dashboard Stats Row -->
        <div class="stats-row">
          <div class="stat-card-custom" style="border-left: 3px solid #3b82f6;">
            <div class="stat-card-header">
              <i data-lucide="credit-card" class="icon-sm"></i>
              <span>Cards Sold</span>
            </div>
            <div class="stat-card-value text-glow">200K+</div>
            <div class="stat-card-sub"><span class="text-success-custom font-bold">+12.5%</span> vs last month</div>
          </div>
          
          <div class="stat-card-custom" style="border-left: 3px solid #8b5cf6;">
            <div class="stat-card-header">
              <i data-lucide="users" class="icon-sm"></i>
              <span>Active Users</span>
            </div>
            <div class="stat-card-value" style="color: #8b5cf6;">45K+</div>
            <div class="stat-card-sub"><span class="text-success-custom font-bold">+8.3%</span> vs last month</div>
          </div>
          
          <div class="stat-card-custom" style="border-left: 3px solid #10b981;">
            <div class="stat-card-header">
              <i data-lucide="dollar-sign" class="icon-sm text-primary"></i>
              <span>Revenue</span>
            </div>
            <div class="stat-card-value text-primary text-glow">$2.5M</div>
            <div class="stat-card-sub"><span class="text-success-custom font-bold">+23.1%</span> vs last month</div>
          </div>
          
          <div class="stat-card-custom" style="border-left: 3px solid #f59e0b;">
            <div class="stat-card-header">
              <i data-lucide="star" class="icon-sm"></i>
              <span>Success Rate</span>
            </div>
            <div class="stat-card-value text-glow" style="color: #ffaa00;">99.9%</div>
            <div class="stat-card-sub">Verified & trusted</div>
          </div>
        </div>

        <!-- Dashboard Detail Columns (Visual card, Feature list, Chart) -->
        <div class="dashboard-columns">
          <div class="col-panel">
            <div class="preview-cc-wrap">
              <div class="cc-brand-title">
                <i data-lucide="credit-card" class="icon-sm text-primary"></i>
                <span>THECAR4DERS</span>
                <span class="cc-status-dot"></span>
              </div>
              <div class="cc-number-preview">4829 •••• •••• 7642</div>
              <div class="cc-holder-info">
                <div class="cc-holder-meta">
                  <label>Holder</label>
                  <span>PREMIUM USER</span>
                </div>
                <div class="cc-holder-meta">
                  <label>Expires</label>
                  <span>12/28</span>
                </div>
                <i data-lucide="shield" class="icon-md text-primary" style="margin-bottom: -2px; filter: drop-shadow(0 0 5px hsla(var(--primary) / 0.5));"></i>
              </div>
            </div>
          </div>

          <div class="col-panel">
            <h3 class="font-heading font-bold text-sm mb-4">Premium Cards Available</h3>
            <p class="font-mono text-xs text-muted-foreground mb-5 leading-normal">
              High-balance cards with instant delivery. All cards are verified, fresh, and come with full details.
            </p>
            <div class="feat-list">
              <div class="feat-item">
                <i data-lucide="check" class="feat-icon-check"></i>
                <span>Balance guaranteed on all cards</span>
              </div>
              <div class="feat-item">
                <i data-lucide="check" class="feat-icon-check"></i>
                <span>Instant delivery via email</span>
              </div>
              <div class="feat-item">
                <i data-lucide="check" class="feat-icon-check"></i>
                <span>24/7 replacement guarantee</span>
              </div>
              <div class="feat-item">
                <i data-lucide="check" class="feat-icon-check"></i>
                <span>Full card details included</span>
              </div>
            </div>
          </div>

          <div class="col-panel">
            <div class="chart-panel-header">
              <span class="chart-title-lbl font-heading">Weekly Sales</span>
              <span class="font-mono text-xs text-primary font-bold">+18.2%</span>
            </div>
            
            <div class="chart-bars-wrap">
              <div class="chart-bar-col" style="height: 35%;"></div>
              <div class="chart-bar-col" style="height: 55%;"></div>
              <div class="chart-bar-col" style="height: 42%;"></div>
              <div class="chart-bar-col" style="height: 75%;"></div>
              <div class="chart-bar-col" style="height: 50%;"></div>
              <div class="chart-bar-col" style="height: 60%;"></div>
              <div class="chart-bar-col" style="height: 85%;"></div>
            </div>
            <div class="chart-labels-wrap">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        <!-- Product Table Catalog -->
        <div class="table-card-container">
          <div class="catalog-table-header">
            <div>
              <span class="badge badge-outline mb-1"><i data-lucide="folder" class="icon-sm mr-1"></i> Cards / CC</span>
              <h2 class="font-heading text-xl font-bold">Purchase Cards</h2>
              <p class="font-mono text-[10px] text-muted-foreground">Fresh, verified cards with guaranteed balance. Instant delivery.</p>
            </div>
            
            <div class="type-filters" style="margin-left: auto;">
              <button class="filter-btn active" data-filter="all" onclick="app.setCardFilter('all')">All</button>
              <button class="filter-btn" data-filter="visa" onclick="app.setCardFilter('visa')">Visa</button>
              <button class="filter-btn" data-filter="mastercard" onclick="app.setCardFilter('mastercard')">MasterCard</button>
              <button class="filter-btn" data-filter="amex" onclick="app.setCardFilter('amex')">Amex</button>
              <button class="filter-btn" data-filter="discover" onclick="app.setCardFilter('discover')">Discover</button>
            </div>
          </div>

          <div class="catalog-search-wrap mb-5">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" id="card-search-input" class="search-input" placeholder="Search cards..." oninput="app.filterCardsList()">
          </div>

          <div class="catalog-table-wrapper">
            <table class="catalog-table-view" id="cards-table-catalog">
              <thead>
                <tr>
                  <th>Card Type</th>
                  <th>Country</th>
                  <th>Card Info</th>
                  <th>Balance</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="catalog-table-body">
                ${this.getCardsTableHtml(cards)}
              </tbody>
            </table>
          </div>
        </div>
      `;
      this.render(html);
    },

    getCardsTableHtml(cards) {
      if (cards.length === 0) {
        return `
          <tr>
            <td colspan="6" class="text-center py-8">
              <div class="empty-catalog-state">
                <i data-lucide="credit-card" class="empty-catalog-icon"></i>
                <span class="empty-catalog-text">No cards available</span>
              </div>
            </td>
          </tr>
        `;
      }

      return cards.map(c => {
        const brand = c.category.toUpperCase();
        // Generate a high balance mock display for the card, e.g., $3,000.00
        const mockBalance = (c.price * 65).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        
        return `
          <tr class="catalog-row-item" data-category="${c.category}" data-bank="${c.bank.toLowerCase()}" data-country="${c.country.toLowerCase()}" data-title="${c.title.toLowerCase()}">
            <td>
              <span class="catalog-brand-badge">${brand}</span>
              <span class="font-bold ml-2 text-glow" style="color: #fff;">${c.title}</span>
            </td>
            <td>
              <div class="catalog-country-wrap font-mono">
                <i data-lucide="globe" class="icon-sm text-muted-foreground"></i>
                <span>${c.country}</span>
              </div>
            </td>
            <td>
              <div class="font-mono text-xs text-muted-foreground">
                <span class="text-white">${c.card_number}</span> 
                CVV: <span class="blurred-details">846</span> 
                Exp: <span class="blurred-details">12/28</span>
              </div>
            </td>
            <td class="font-mono text-primary font-bold text-glow">${mockBalance}</td>
            <td class="font-mono font-bold" style="color: #fff;">$${c.price.toFixed(2)}</td>
            <td>
              <a href="#/checkout?card=${c.id}" class="btn btn-primary btn-sm glow-green font-bold">Buy Now</a>
            </td>
          </tr>
        `;
      }).join('');
    },

    setCardFilter(filterVal) {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.getAttribute('data-filter') === filterVal) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      this.filterCardsList();
    },

    filterCardsList() {
      const search = document.getElementById('card-search-input').value.toLowerCase();
      const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
      
      document.querySelectorAll('.catalog-row-item').forEach(card => {
        const cat = card.getAttribute('data-category');
        const bank = card.getAttribute('data-bank');
        const country = card.getAttribute('data-country');
        const title = card.getAttribute('data-title');
        
        const matchesSearch = bank.includes(search) || country.includes(search) || title.includes(search);
        const matchesFilter = activeFilter === 'all' || cat === activeFilter;
        
        if (matchesSearch && matchesFilter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    },

    // 3. Products Page View
    viewProducts() {
      const products = db.get('products', []);
      const balances = db.get('balances', {});

      let html = `
        <div class="welcome-widget" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1 class="font-heading text-2xl sm:text-3xl font-extrabold text-card-foreground">
              <span class="text-primary text-glow">Exclusive</span> Products
            </h1>
            <p class="font-mono text-xs text-muted-foreground mt-1">Premium digital products at 50-70% below market prices — limited stock</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-success" style="box-shadow: 0 0 10px rgba(23, 207, 115, 0.2);"><i data-lucide="circle" class="icon-sm fill-current mr-1 animate-pulse"></i> ${products.length} Products Available</span>
          </div>
        </div>

        <div class="products-section-header">
          <div class="products-filter-row">
            <div class="products-search-wrap">
              <i data-lucide="search" class="search-icon"></i>
              <input type="text" id="product-search-input" class="search-input" placeholder="Search products..." oninput="app.filterProductsList()">
            </div>
            <div class="products-cat-filters">
              <button class="filter-btn active" data-cat="all" onclick="app.setProductFilter('all')">All</button>
              <button class="filter-btn" data-cat="subscriptions" onclick="app.setProductFilter('subscriptions')">Subscriptions</button>
              <button class="filter-btn" data-cat="funded_accounts" onclick="app.setProductFilter('funded_accounts')">Funded Accounts</button>
              <button class="filter-btn" data-cat="accounts" onclick="app.setProductFilter('accounts')">Accounts</button>
            </div>
          </div>
        </div>

        <div class="products-grid" id="products-grid">
          ${this.getProductsGridHtml(products)}
        </div>
      `;
      this.render(html);
    },

    getProductsGridHtml(products) {
      if (products.length === 0) {
        return `
          <div class="empty-catalog-state" style="grid-column: 1 / -1; padding: 4rem 0;">
            <i data-lucide="package" class="empty-catalog-icon"></i>
            <span class="empty-catalog-text">No products available yet</span>
          </div>
        `;
      }

      return products.map(p => {
        const discountPercent = Math.round((1 - p.discounted_price / p.original_price) * 100);
        const imgHtml = p.image
          ? `<img src="${p.image}" alt="${p.title}" class="product-card-img">`
          : `<div class="product-card-img-placeholder"><i data-lucide="image" class="product-card-img-icon"></i></div>`;

        return `
          <div class="product-card-item" data-category="${p.category}" data-title="${p.title.toLowerCase()}">
            <div class="product-card-img-wrap">
              ${imgHtml}
              <span class="product-discount-badge">-${discountPercent}%</span>
            </div>
            <div class="product-card-body">
              <span class="product-card-category">${p.category.replace('_', ' ')}</span>
              <h3 class="product-card-title">${p.title}</h3>
              <p class="product-card-desc">${p.description.substring(0, 80)}${p.description.length > 80 ? '...' : ''}</p>
              <div class="product-card-pricing">
                <span class="product-price-current">$${p.discounted_price.toFixed(2)}</span>
                <span class="product-price-original">$${p.original_price.toFixed(2)}</span>
              </div>
              <a href="#/product-checkout?id=${p.id}" class="btn btn-primary btn-sm w-full glow-green font-bold">
                <i data-lucide="shopping-cart" class="icon-sm"></i> Buy Now
              </a>
            </div>
          </div>
        `;
      }).join('');
    },

    setProductFilter(catVal) {
      document.querySelectorAll('.products-cat-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-cat') === catVal);
      });
      this.filterProductsList();
    },

    filterProductsList() {
      const search = document.getElementById('product-search-input')?.value.toLowerCase() || '';
      const activeFilter = document.querySelector('.products-cat-filters .filter-btn.active')?.getAttribute('data-cat') || 'all';

      document.querySelectorAll('.product-card-item').forEach(item => {
        const cat = item.getAttribute('data-category');
        const title = item.getAttribute('data-title');
        const matchesSearch = title.includes(search);
        const matchesFilter = activeFilter === 'all' || cat === activeFilter;
        item.classList.toggle('hidden', !(matchesSearch && matchesFilter));
      });
    },

    // 4. Product Checkout Page View
    viewProductCheckout() {
      if (!this.requireAuth('#/products')) return;

      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const productId = urlParams.get('id');

      if (!productId) {
        this.render(`
          <div class="max-w-md mx-auto text-center py-16 font-mono text-sm">
            <i data-lucide="alert-triangle" class="text-destructive mx-auto mb-4" style="width: 3rem; height: 3rem;"></i>
            <p class="text-muted-foreground mb-4">No product selected.</p>
            <a href="#/products" class="btn btn-secondary">Browse Products</a>
          </div>
        `);
        return;
      }

      const products = db.get('products', []);
      const product = products.find(p => p.id === productId);
      if (!product) {
        this.render(`
          <div class="max-w-md mx-auto text-center py-16 font-mono text-sm">
            <i data-lucide="alert-triangle" class="text-destructive mx-auto mb-4" style="width: 3rem; height: 3rem;"></i>
            <p class="text-muted-foreground mb-4">Product not found or no longer available.</p>
            <a href="#/products" class="btn btn-secondary">Back to Products</a>
          </div>
        `);
        return;
      }

      const balances = db.get('balances', {});
      const balance = balances[this.currentUser.email] || 0.00;
      const canAfford = balance >= product.discounted_price;
      const discountPercent = Math.round((1 - product.discounted_price / product.original_price) * 100);
      const userEmail = this.currentUser.email;

      const imgHtml = product.image
        ? `<img src="${product.image}" alt="${product.title}" style="width: 100%; height: 180px; object-fit: cover; border-radius: var(--radius);">`
        : `<div style="width: 100%; height: 180px; background: hsl(var(--secondary)); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; color: hsl(var(--muted-foreground));"><i data-lucide="package" style="width: 2.5rem; height: 2.5rem;"></i></div>`;

      const html = `
        <div class="max-w-2xl mx-auto px-4 py-4">
          <a href="#/products" class="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors mb-6 text-xs font-mono" style="text-decoration: none;">
            <i data-lucide="arrow-left" class="icon-sm"></i> Back to Products
          </a>

          <div class="flex items-center gap-2 mb-6">
            <i data-lucide="shopping-cart" class="text-primary icon-md"></i>
            <h1 class="font-heading text-2xl font-bold">Checkout</h1>
          </div>

          <div class="checkout-layout">
            <div class="checkout-product-panel">
              ${imgHtml}
              <div style="padding: 1rem 0;">
                <span class="badge badge-success" style="margin-bottom: 0.5rem;">-${discountPercent}% OFF</span>
                <h2 class="font-heading text-lg font-bold" style="color: #fff; margin-bottom: 0.25rem;">${product.title}</h2>
                <p class="font-mono text-xs text-muted-foreground mb-3">${product.description}</p>
                <div class="product-card-pricing" style="margin: 0;">
                  <span class="product-price-current">$${product.discounted_price.toFixed(2)}</span>
                  <span class="product-price-original">$${product.original_price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="checkout-form-panel">
              <div class="product-card" style="margin-bottom: 1rem;">
                <h3 class="font-heading font-bold text-sm mb-4" style="color: #fff;">Delivery Information</h3>
                <form id="checkout-form" onsubmit="app.handleProductCheckoutSubmit(event, '${product.id}')">
                  <div class="form-group">
                    <label class="form-label" for="co-name">Full Name</label>
                    <input type="text" id="co-name" class="form-input" placeholder="Enter your full name" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="co-email">Email Address</label>
                    <input type="email" id="co-email" class="form-input" value="${userEmail}" placeholder="Enter your email" required>
                  </div>
                  <div class="checkout-balance-info">
                    <div class="flex justify-between text-xs font-mono mb-2">
                      <span class="text-muted-foreground">Your Balance:</span>
                      <span>$${balance.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between text-xs font-mono mb-2">
                      <span class="text-muted-foreground">Product Price:</span>
                      <span class="text-destructive">-$${product.discounted_price.toFixed(2)}</span>
                    </div>
                    <div class="dropdown-divider"></div>
                    <div class="flex justify-between text-xs font-mono mt-2 mb-4">
                      <span class="text-muted-foreground">Remaining:</span>
                      <span class="${canAfford ? 'text-primary' : 'text-destructive'} font-bold">$${canAfford ? (balance - product.discounted_price).toFixed(2) : '0.00'}</span>
                    </div>
                  </div>
                  ${canAfford ? `
                    <button type="submit" class="btn btn-primary w-full py-3 font-bold glow-green" style="font-size: 0.9rem;">
                      <i data-lucide="check" class="icon-sm"></i> Confirm Purchase — $${product.discounted_price.toFixed(2)}
                    </button>
                  ` : `
                    <div class="flex flex-col gap-2">
                      <p class="font-mono text-[10px] text-destructive mb-1"><i data-lucide="alert-circle" class="icon-sm align-middle"></i> Insufficient balance. Please deposit funds first.</p>
                      <a href="#/deposit" class="btn btn-primary w-full font-bold glow-green"><i data-lucide="wallet" class="icon-sm"></i> Deposit Funds</a>
                    </div>
                  `}
                </form>
              </div>
            </div>
          </div>
        </div>
      `;
      this.render(html);
    },

    handleProductCheckoutSubmit(e, productId) {
      e.preventDefault();
      if (!this.currentUser) return;

      const products = db.get('products', []);
      const prodIdx = products.findIndex(p => p.id === productId);
      if (prodIdx === -1) { ut.error('Product not found.'); return; }

      const product = products[prodIdx];
      const balances = db.get('balances', {});
      const balance = balances[this.currentUser.email] || 0.00;

      if (balance < product.discounted_price) {
        ut.error('Insufficient balance.');
        return;
      }

      const name = document.getElementById('co-name').value.trim();
      const email = document.getElementById('co-email').value.trim();
      if (!name || !email) { ut.error('Please fill in all fields.'); return; }

      balances[this.currentUser.email] = balance - product.discounted_price;
      db.set('balances', balances);

      const orders = db.get('orders', []);
      orders.push({
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        card_id: `prod_${product.id}`,
        card_title: product.title,
        amount: product.discounted_price,
        payment_method: 'wallet_balance',
        status: 'approved',
        buyer_name: name,
        buyer_email: this.currentUser.email,
        delivery_email: email,
        details: { product_id: product.id, product_title: product.title, delivery_name: name, delivery_email: email },
        created_date: new Date().toISOString()
      });
      db.set('orders', orders);

      this.updateHeaderUI();
      ut.success(`${product.title} purchased successfully!`);

      this.render(`
        <div class="max-w-md mx-auto px-4 py-8 text-center">
          <div class="product-card" style="border-color: #17cf73; padding: 2rem; box-shadow: 0 0 20px rgba(23, 207, 115, 0.15);">
            <div class="feature-icon-wrapper mx-auto" style="background-color: rgba(23, 207, 115, 0.1); border-color: rgba(23, 207, 115, 0.3); margin-bottom: 1.5rem;">
              <i data-lucide="check" class="text-primary" style="width: 1.5rem; height: 1.5rem;"></i>
            </div>
            <h2 class="font-heading text-xl font-bold mb-2">Purchase Successful!</h2>
            <p class="font-mono text-xs text-muted-foreground mb-6">Your order has been confirmed. Delivery details are below.</p>
            <div class="card-details font-mono" style="text-align: left; background-color: hsl(var(--secondary)); border-radius: var(--radius); padding: 1rem; border: 1px dashed hsl(var(--border));">
              <div class="detail-row" style="margin-bottom: 0.5rem;">
                <span class="detail-label">Product:</span>
                <span class="detail-val" style="color: #fff;">${product.title}</span>
              </div>
              <div class="detail-row" style="margin-bottom: 0.5rem;">
                <span class="detail-label">Name:</span>
                <span class="detail-val" style="color: #fff;">${name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-val" style="color: #fff;">${email}</span>
              </div>
            </div>
            <p class="font-mono text-[9px] text-muted-foreground mt-4 mb-6">You can view all your orders in the My Orders page.</p>
            <div class="flex gap-4">
              <a href="#/products" class="btn btn-secondary w-full">Browse More</a>
              <a href="#/orders" class="btn btn-primary glow-green w-full">My Orders</a>
            </div>
          </div>
        </div>
      `);
      lucide.createIcons();
    },

    // 4. Checkout Page View
    viewCheckout() {
      if (!this.requireAuth()) return;
      
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const cardId = urlParams.get('card');
      
      if (!cardId) {
        this.render(`
          <div class="max-w-md mx-auto text-center py-16 font-mono text-sm">
            <i data-lucide="alert-triangle" class="text-destructive mx-auto mb-4" style="width: 3rem; height: 3rem;"></i>
            <p class="text-muted-foreground mb-4">No card selected for checkout.</p>
            <a href="#/cards" class="btn btn-secondary">Browse Premium Cards</a>
          </div>
        `);
        return;
      }
      
      const cards = db.get('cards', []);
      const card = cards.find(c => c.id === cardId);
      
      if (!card) {
        this.render(`
          <div class="max-w-md mx-auto text-center py-16 font-mono text-sm">
            <i data-lucide="alert-triangle" class="text-destructive mx-auto mb-4" style="width: 3rem; height: 3rem;"></i>
            <p class="text-muted-foreground mb-4">The selected card was not found or is no longer available.</p>
            <a href="#/cards" class="btn btn-secondary">Back to Cards</a>
          </div>
        `);
        return;
      }
      
      const balances = db.get('balances', {});
      const balance = balances[this.currentUser.email] || 0.00;
      const canAfford = balance >= card.price;
      
      const html = `
        <div class="max-w-md mx-auto px-4 py-4" id="checkout-root">
          <a href="#/cards" class="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors mb-6 text-xs font-mono" style="text-decoration: none;">
            <i data-lucide="arrow-left" class="icon-sm"></i> Back to Cards
          </a>
          
          <div class="flex items-center gap-2 mb-6">
            <i data-lucide="shopping-cart" class="text-primary icon-md"></i>
            <h1 class="font-heading text-2xl font-bold">Checkout</h1>
          </div>
          
          <div class="space-y-4 flex flex-col gap-4">
            <div class="product-card" style="border-color: hsla(var(--primary) / 0.15);">
              <h3 class="card-title font-heading mb-1">${card.title}</h3>
              <p class="font-mono text-[10px] text-muted-foreground mb-4">${card.bank}</p>
              
              <div class="card-details">
                <div class="detail-row">
                  <span class="detail-label">Billing Country:</span>
                  <span class="detail-val">${card.country}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Masked Number:</span>
                  <span class="detail-val font-mono">${card.card_number}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-val badge badge-success">Verified & Live</span>
                </div>
              </div>
              
              <div class="flex justify-between items-center mt-2">
                <span class="font-mono text-xs text-muted-foreground">Price:</span>
                <span class="card-price">$${card.price.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="product-card">
              <h3 class="font-heading font-semibold text-sm mb-3">Order Payment</h3>
              <div class="flex justify-between text-xs font-mono mb-2">
                <span class="text-muted-foreground">Your Balance:</span>
                <span>$${balance.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-xs font-mono mb-4">
                <span class="text-muted-foreground">Card Cost:</span>
                <span class="text-destructive">-$${card.price.toFixed(2)}</span>
              </div>
              
              <div class="dropdown-divider"></div>
              
              ${canAfford ? `
                <div class="flex justify-between text-xs font-mono mb-6">
                  <span class="text-muted-foreground">Remaining Balance:</span>
                  <span class="text-primary font-bold">$${(balance - card.price).toFixed(2)}</span>
                </div>
                <button class="btn btn-primary w-full font-bold glow-green" onclick="app.executeCardPurchase('${card.id}')">
                  Confirm Purchase
                </button>
              ` : `
                <div class="flex flex-col gap-2 mt-2">
                  <p class="font-mono text-[10px] text-destructive mb-2"><i data-lucide="alert-circle" class="icon-sm align-middle"></i> Not enough balance in your account.</p>
                  <a href="#/deposit" class="btn btn-primary w-full font-bold glow-green"><i data-lucide="wallet" class="icon-sm"></i> Deposit Funds Now</a>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
      this.render(html);
    },

    executeCardPurchase(cardId) {
      if (!this.currentUser) return;
      
      const cards = db.get('cards', []);
      const cardIdx = cards.findIndex(c => c.id === cardId);
      
      if (cardIdx === -1 || cards[cardIdx].status !== 'available') {
        ut.error("Item no longer available.");
        return;
      }
      
      const card = cards[cardIdx];
      const balances = db.get('balances', {});
      const balance = balances[this.currentUser.email] || 0.00;
      
      if (balance < card.price) {
        ut.error("Insufficient balance.");
        return;
      }
      
      // Update Balance
      balances[this.currentUser.email] = balance - card.price;
      db.set('balances', balances);
      
      // Mark Card as Sold
      cards[cardIdx].status = 'sold';
      db.set('cards', cards);
      
      // Create Order
      const orders = db.get('orders', []);
      const order = {
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        card_id: card.id,
        card_title: card.title,
        amount: card.price,
        payment_method: 'wallet_balance',
        status: 'approved',
        buyer_email: this.currentUser.email,
        details: card.details,
        created_date: new Date().toISOString()
      };
      orders.push(order);
      db.set('orders', orders);
      
      this.updateHeaderUI();
      ut.success(`${card.title} purchased successfully!`);
      
      // Show Unlock Screen
      this.render(`
        <div class="max-w-md mx-auto px-4 py-8 text-center">
          <div class="product-card" style="border-color: #17cf73; padding: 2rem; box-shadow: 0 0 20px rgba(23, 207, 115, 0.15);">
            <div class="feature-icon-wrapper mx-auto" style="background-color: rgba(23, 207, 115, 0.1); border-color: rgba(23, 207, 115, 0.3); margin-bottom: 1.5rem;">
              <i data-lucide="check" class="text-primary" style="width: 1.5rem; height: 1.5rem;"></i>
            </div>
            
            <h2 class="font-heading text-xl font-bold mb-2">Purchase Successful!</h2>
            <p class="font-mono text-xs text-muted-foreground mb-6">Card details have been unlocked below.</p>
            
            <div class="card-details font-mono" style="text-align: left; background-color: hsl(var(--secondary)); border-radius: var(--radius); padding: 1rem; border: 1px dashed hsl(var(--border));">
              <div class="detail-row" style="margin-bottom: 0.5rem;">
                <span class="detail-label">Product:</span>
                <span class="detail-val" style="color: #fff;">${card.title}</span>
              </div>
              <div class="detail-row" style="margin-bottom: 0.5rem;">
                <span class="detail-label">Card Number:</span>
                <span class="detail-val text-primary" style="font-weight: 700; letter-spacing: 0.05em;">${card.details.number}</span>
              </div>
              <div class="detail-row" style="margin-bottom: 0.5rem;">
                <span class="detail-label">Expiry Date:</span>
                <span class="detail-val" style="color: #fff;">${card.details.expiry}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">CVV Code:</span>
                <span class="detail-val text-primary" style="font-weight: 700;">${card.details.cvv}</span>
              </div>
            </div>
            
            <p class="font-mono text-[9px] text-muted-foreground mt-4 mb-6">Note: Save these credentials immediately. They are also stored under your Order Logs.</p>
            
            <div class="flex gap-4">
              <a href="#/cards" class="btn btn-secondary w-full">Browse More</a>
              <button class="btn btn-primary glow-green w-full" onclick="window.print()">Print Details</button>
            </div>
          </div>
        </div>
      `);
      lucide.createIcons();
    },

    // 4. Deposit Funds View
    getDepositAddressMap() {
      const addresses = db.get('deposit_addresses', []);
      const map = {};
      addresses.forEach(a => { map[a.network] = a.address; });
      return map;
    },

    renderDepositUI(cryptoAddresses, userBalance, myDeposits, isLoading) {
      const html = `
        <div class="welcome-widget mb-6">
          <h1 class="font-heading text-2xl font-bold flex items-center gap-2">
            <i data-lucide="wallet" class="text-primary text-glow"></i> Deposit Funds
          </h1>
          <p class="font-mono text-xs text-muted-foreground mt-1">Add balance to your account via crypto</p>
        </div>
        
        <div class="grid-2">
          <!-- Left Column (Inputs and payment selector) -->
          <div class="flex flex-col gap-5">
            
            <!-- Deposit Amount Panel -->
            <div class="product-card">
              <h3 class="font-heading font-bold text-sm mb-4 flex items-center gap-2" style="color: #fff;">
                <i data-lucide="trending-up" class="text-primary icon-sm"></i> Deposit Amount
              </h3>
              
              <div class="form-group">
                <label class="form-label" for="dep-amount">Amount (USD) *</label>
                <div class="deposit-input-wrapper">
                  <span class="deposit-input-sign">$</span>
                  <input type="number" step="any" id="dep-amount" class="deposit-amount-input" placeholder="0.00" value="0.00" oninput="app.updateDepositPresetActive(this.value)" required>
                </div>
              </div>
              
              <div class="deposit-preset-row">
                <div class="preset-item" onclick="app.setDepositPreset(10)">$10</div>
                <div class="preset-item" onclick="app.setDepositPreset(25)">$25</div>
                <div class="preset-item" onclick="app.setDepositPreset(50)">$50</div>
                <div class="preset-item" onclick="app.setDepositPreset(100)">$100</div>
                <div class="preset-item" onclick="app.setDepositPreset(250)">$250</div>
                <div class="preset-item" onclick="app.setDepositPreset(500)">$500</div>
              </div>
            </div>
            
            <!-- Crypto Payment Methods -->
            <div class="product-card">
              <h3 class="font-heading font-bold text-sm mb-4 flex items-center gap-2" style="color: #fff;">
                <i data-lucide="wallet" class="text-primary icon-sm"></i> Crypto Payment Methods
              </h3>
              
              <div class="deposit-method-item active" data-wallet="usdt_bep20" onclick="app.selectDepositWallet('usdt_bep20')">
                <div class="deposit-radio-circle">
                  <div class="deposit-radio-dot"></div>
                </div>
                <div class="deposit-coin-icon" style="background-color: rgba(255, 170, 0, 0.1); color: #ffaa00; border: 1px solid rgba(255, 170, 0, 0.2);">
                  <i data-lucide="coins" class="icon-sm"></i>
                </div>
                <div class="deposit-method-info">
                  <span class="deposit-method-title">USDT (BEP20)</span>
                  <span class="deposit-method-network">Binance Smart Chain</span>
                </div>
              </div>
              
              <div class="deposit-method-item" data-wallet="usdt_trc20" onclick="app.selectDepositWallet('usdt_trc20')">
                <div class="deposit-radio-circle">
                  <div class="deposit-radio-dot"></div>
                </div>
                <div class="deposit-coin-icon" style="background-color: rgba(255, 74, 74, 0.1); color: #ff4a4a; border: 1px solid rgba(255, 74, 74, 0.2);">
                  <i data-lucide="zap" class="icon-sm"></i>
                </div>
                <div class="deposit-method-info">
                  <span class="deposit-method-title">USDT (TRC20)</span>
                  <span class="deposit-method-network">Tron Network</span>
                </div>
              </div>
              
              <div class="deposit-method-item" data-wallet="btc" onclick="app.selectDepositWallet('btc')">
                <div class="deposit-radio-circle">
                  <div class="deposit-radio-dot"></div>
                </div>
                <div class="deposit-coin-icon" style="background-color: rgba(255, 170, 0, 0.15); color: #ffaa00; border: 1px solid rgba(255, 170, 0, 0.3);">
                  B
                </div>
                <div class="deposit-method-info">
                  <span class="deposit-method-title">Bitcoin (BTC)</span>
                  <span class="deposit-method-network">Bitcoin Network</span>
                </div>
              </div>
              
              <div class="deposit-method-item" data-wallet="sol" onclick="app.selectDepositWallet('sol')">
                <div class="deposit-radio-circle">
                  <div class="deposit-radio-dot"></div>
                </div>
                <div class="deposit-coin-icon" style="background-color: rgba(139, 92, 246, 0.1); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.2);">
                  S
                </div>
                <div class="deposit-method-info">
                  <span class="deposit-method-title">Solana (SOL)</span>
                  <span class="deposit-method-network">Solana Network</span>
                </div>
              </div>
              
              <!-- Binance Pay Section -->
              <h4 class="font-heading font-bold text-xs mt-6 mb-3 flex items-center gap-2" style="color: #fff;">
                <i data-lucide="landmark" class="text-primary icon-sm"></i> Binance Pay
              </h4>
              
              <div class="deposit-method-item" data-wallet="binance_uid" onclick="app.selectDepositWallet('binance_uid')">
                <div class="deposit-radio-circle">
                  <div class="deposit-radio-dot"></div>
                </div>
                <div class="deposit-coin-icon" style="background-color: rgba(234, 179, 8, 0.1); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.2);">
                  <i data-lucide="building" class="icon-sm"></i>
                </div>
                <div class="deposit-method-info">
                  <span class="deposit-method-title">Binance UID Transfer</span>
                  <span class="deposit-method-network">Send via Binance internal transfer</span>
                </div>
              </div>
            </div>
            
            <!-- Dynamic Copy Address Details Box -->
            <div class="product-card">
              <h3 class="font-heading font-bold text-sm mb-4 flex items-center gap-2" style="color: #fff;">
                <i data-lucide="qr-code" class="text-primary icon-sm"></i> 2. Transfer Funds
              </h3>
              <p class="font-mono text-[10px] text-muted-foreground mb-4">Send the exact amount to the deposit address below. QR Code is provided for mobile wallets.</p>
              
              <div class="address-box mb-4">
                <span class="font-mono text-[10px] text-muted-foreground block mb-1 font-bold" id="deposit-addr-label">USDT (BEP20) Address</span>
                <div class="flex gap-2 items-center">
                  <span class="address-text" id="deposit-address-txt" style="word-break: break-all; font-size: 0.75rem;">${cryptoAddresses.usdt_bep20}</span>
                  <button class="btn btn-secondary btn-sm" onclick="app.copyDepositAddress()"><i data-lucide="copy" class="icon-sm"></i> Copy</button>
                </div>
              </div>
              
              <div class="qr-code-box">
                <div class="qr-placeholder mx-auto" style="width: 150px; height: 150px; background: transparent; border: none; padding: 0;">
                  <img id="deposit-qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${cryptoAddresses.usdt_bep20}" alt="QR code" style="width: 100%; height: 100%; border-radius: var(--radius);">
                </div>
              </div>
            </div>
            
            <!-- Payment Proof Form -->
            <div class="product-card">
              <h3 class="font-heading font-bold text-sm mb-4" style="color: #fff;">Payment Proof</h3>
              
              <form id="deposit-submit-form" onsubmit="app.handleDepositSubmit(event)">
                <div class="form-group mb-4">
                  <label class="form-label" for="dep-hash">Transaction Hash / TX ID *</label>
                  <input type="text" id="dep-hash" class="form-input font-mono text-xs" placeholder="Paste your transaction hash..." style="background-color: hsla(220, 15%, 10%, 0.4);" required>
                </div>
                
                <div class="form-group mb-5">
                  <label class="form-label">Screenshot (optional but recommended)</label>
                  <div class="file-upload-wrapper" style="border: 1px dashed hsl(var(--border)); background-color: hsla(220, 15%, 10%, 0.2); padding: 1.5rem 1rem;">
                    <i data-lucide="upload-cloud" class="text-muted-foreground mb-2" style="width: 1.5rem; height: 1.5rem;"></i>
                    <span class="font-heading font-bold text-xs" id="upload-txt">Click to upload screenshot</span>
                    <input type="file" class="file-upload-input" onchange="app.handleDepositFile(this)">
                    <img id="file-preview" class="file-upload-preview hidden" src="" alt="preview" style="max-height: 100px; border-radius: var(--radius); margin-top: 0.5rem;">
                  </div>
                </div>
                
                <button type="submit" class="btn btn-primary w-full py-4 font-bold glow-green" style="font-size: 0.9rem; border-radius: var(--radius); text-transform: uppercase;">
                  <i data-lucide="send" class="icon-sm"></i> Submit Deposit
                </button>
              </form>
            </div>
          </div>
          
          <!-- Right Column (Balance and history) -->
          <div class="flex flex-col gap-5">
            
            <!-- Balance Card -->
            <div class="balance-glow-panel">
              <span class="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block font-bold">YOUR BALANCE</span>
              <div class="balance-glow-val">$${userBalance.toFixed(2)}</div>
              <span class="font-mono text-[10px] text-muted-foreground">Available to spend</span>
            </div>
            
            <!-- History Card -->
            <div class="history-panel">
              <h3 class="font-heading font-bold text-sm mb-4 flex items-center gap-2" style="color: #fff;">
                <i data-lucide="history" class="text-primary icon-sm"></i> Deposit History
              </h3>
              
              <div class="flex flex-col">
                ${isLoading ? `
                  <div class="text-center font-mono text-xs text-muted-foreground py-6 flex items-center justify-center gap-2">
                    <span class="spinner"></span> Loading deposit history...
                  </div>
                ` : (!myDeposits || myDeposits.length === 0) ? `
                  <div class="text-center font-mono text-xs text-muted-foreground py-6">No recent deposit logs found.</div>
                ` : myDeposits.map(d => {
                  let statusClass = 'status-pending';
                  if (d.status === 'approved') statusClass = 'status-approved';
                  if (d.status === 'declined') statusClass = 'status-declined';
                  
                  const dateObj = new Date(d.created_date);
                  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + 
                                        dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                  
                  return `
                    <div class="history-item-row">
                      <div>
                        <span class="history-amount-lbl">$${parseFloat(d.amount).toFixed(2)}</span>
                        <span class="history-date-sub block">${formattedDate}</span>
                      </div>
                      <div>
                        <span class="status-badge-clear ${statusClass}">${d.status}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
      this.render(html);
    },

    async viewDeposit() {
      if (!this.requireAuth()) return;
      
      const cryptoAddresses = this.getDepositAddressMap();
      const balances = db.get('balances', {});
      const userBalance = balances[this.currentUser.email] || 0.00;
      
      // Render initial view with loading state for history
      this.renderDepositUI(cryptoAddresses, userBalance, null, true);
      
      try {
        const myDeposits = await depositService.fetchUserDeposits(this.currentUser.email);
        this.syncUserBalance(myDeposits);
        
        const updatedBalance = db.get('balances', {})[this.currentUser.email] || 0.00;
        this.renderDepositUI(cryptoAddresses, updatedBalance, myDeposits, false);
      } catch (error) {
        console.error("Error loading user deposits:", error);
        // Fallback
        const localDeps = db.get('deposits', []).filter(d => d.user_email === this.currentUser.email);
        this.renderDepositUI(cryptoAddresses, userBalance, localDeps, false);
      }
    },

    selectDepositWallet(walletType) {
      const cryptoAddresses = this.getDepositAddressMap();
      
      document.querySelectorAll('.deposit-method-item').forEach(card => {
        if (card.getAttribute('data-wallet') === walletType) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
      
      const addr = cryptoAddresses[walletType];
      const allAddresses = db.get('deposit_addresses', []);
      const addrObj = allAddresses.find(a => a.network === walletType);
      
      document.getElementById('deposit-addr-label').innerText = addrObj ? addrObj.label + ' Address' : 'Address';
      document.getElementById('deposit-address-txt').innerText = addr;
      document.getElementById('deposit-qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${addr}`;
    },

    setDepositPreset(amount) {
      const input = document.getElementById('dep-amount');
      input.value = amount.toFixed(2);
      this.updateDepositPresetActive(amount);
    },

    updateDepositPresetActive(value) {
      const floatVal = parseFloat(value);
      document.querySelectorAll('.preset-item').forEach(item => {
        const itemVal = parseFloat(item.innerText.replace('$', ''));
        if (floatVal === itemVal) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    },

    copyDepositAddress() {
      const addrText = document.getElementById('deposit-address-txt').innerText;
      navigator.clipboard.writeText(addrText).then(() => {
        ut.success("Deposit destination copied!");
      }).catch(() => {
        ut.error("Failed to copy destination.");
      });
    },

    uploadedFileBase64: '',
    handleDepositFile(input) {
      const file = input.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('file-preview');
        const uploadTxt = document.getElementById('upload-txt');
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        if (uploadTxt) uploadTxt.innerText = "Screenshot loaded!";
        this.uploadedFileBase64 = e.target.result;
        ut.success("Screenshot loaded successfully!");
      };
      reader.readAsDataURL(file);
    },

    async handleDepositSubmit(e) {
      e.preventDefault();
      if (!this.currentUser) return;
      
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn.innerHTML;
      
      const amountInput = document.getElementById('dep-amount');
      const amount = parseFloat(amountInput.value);
      const hash = document.getElementById('dep-hash').value;
      const activeItem = document.querySelector('.deposit-method-item.active');
      const activeWallet = activeItem ? activeItem.getAttribute('data-wallet') : 'usdt_bep20';
      
      if (!amount || amount <= 0) {
        ut.error("Invalid amount.");
        return;
      }
      
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> Submitting...`;
        
        const newDeposit = {
          id: 'dep_' + Math.random().toString(36).substr(2, 9),
          user_email: this.currentUser.email,
          amount: amount,
          payment_method: activeWallet,
          transaction_hash: hash,
          proof_image: this.uploadedFileBase64 || '',
          status: 'pending',
          created_date: new Date().toISOString()
        };
        
        await depositService.submitDeposit(newDeposit);
        
        // Save to local cache as fallback/instant visual feedback
        const deposits = db.get('deposits', []);
        deposits.push(newDeposit);
        db.set('deposits', deposits);
        
        ut.success("Deposit submitted! Awaiting administrator approval.");
        this.uploadedFileBase64 = '';
        
        // Reset form
        e.target.reset();
        const preview = document.getElementById('file-preview');
        if (preview) preview.classList.add('hidden');
        const uploadTxt = document.getElementById('upload-txt');
        if (uploadTxt) uploadTxt.innerText = "Click to upload screenshot";
        
        await this.viewDeposit();
      } catch (err) {
        console.error("Error submitting deposit:", err);
        ut.error("Failed to submit deposit. Please check connection and try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    },

    // 5. Flash USDT View
    viewFlashUSDT() {
      const packages = db.get('flash_packages', []);
      const balances = db.get('balances', {});
      const userBalance = this.currentUser ? (balances[this.currentUser.email] || 0.00) : 0.00;
      
      const html = `
        <div class="welcome-widget text-center mb-8" style="margin-top: 2rem;">
          <div style="display: inline-flex; align-items: center; justify-content: center; background-color: hsla(var(--primary) / 0.05); border: 1px solid hsla(var(--primary) / 0.2); padding: 0.35rem 0.75rem; border-radius: 9999px; gap: 0.35rem; margin-bottom: 1.5rem;">
            <i data-lucide="zap" class="icon-sm text-primary"></i>
            <span class="font-mono text-[10px] font-bold text-primary">Flash USDT</span>
          </div>
          <h1 class="font-heading text-4xl sm:text-5xl font-extrabold text-card-foreground text-glow" style="letter-spacing: -0.02em;">
            Buy <span class="text-primary text-glow">Flash USDT</span>
          </h1>
          <p class="font-mono text-xs text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
            Instant delivery to your wallet. Choose your package below and get Flash USDT in seconds.
          </p>
          
          <div class="flex items-center justify-center gap-2 mt-6 font-mono text-sm">
            <span class="text-muted-foreground">Your balance:</span>
            <span class="text-primary font-bold text-glow">$${userBalance.toFixed(2)}</span>
            <a href="#/deposit" class="btn btn-secondary btn-sm ml-2 font-bold" style="border-radius: var(--radius); padding: 0.35rem 0.75rem; font-size: 0.75rem;">Deposit</a>
          </div>
        </div>

        <!-- Features Banner -->
        <div class="flash-feature-row">
          <div class="flash-feature-card">
            <i data-lucide="zap" class="text-primary mb-2" style="width: 1.5rem; height: 1.5rem;"></i>
            <h3 class="font-heading font-bold text-sm text-card-foreground">Instant Delivery</h3>
            <p class="font-mono text-[10px] text-muted-foreground">Under 60 seconds</p>
          </div>
          
          <div class="flash-feature-card">
            <i data-lucide="shield" class="text-primary mb-2" style="width: 1.5rem; height: 1.5rem;"></i>
            <h3 class="font-heading font-bold text-sm text-card-foreground">100% Secure</h3>
            <p class="font-mono text-[10px] text-muted-foreground">Verified & encrypted</p>
          </div>
          
          <div class="flash-feature-card">
            <i data-lucide="clock" class="text-primary mb-2" style="width: 1.5rem; height: 1.5rem;"></i>
            <h3 class="font-heading font-bold text-sm text-card-foreground">24/7 Available</h3>
            <p class="font-mono text-[10px] text-muted-foreground">Round the clock</p>
          </div>
        </div>
        
        <!-- Pricing Cards -->
        <div class="flash-plans-container">
          ${packages.map(p => {
            const isPopular = p.is_popular;
            const canAfford = this.currentUser ? (userBalance >= p.price_usd) : false;
            const cardBrand = p.name.split(' ')[0];
            const formattedAmount = p.flash_amount.toLocaleString();
            
            // Custom rate label corresponding to mockups
            let rateLabel = "$5.0¢ per USDT";
            if (p.flash_amount === 5000) rateLabel = "$4.0¢ per USDT";
            if (p.flash_amount === 20000) rateLabel = "$2.5¢ per USDT";
            
            return `
              <div class="flash-plan-card ${isPopular ? 'popular' : ''}">
                ${isPopular ? `<span class="flash-plan-pop-badge">MOST POPULAR</span>` : ''}
                
                <div class="flash-plan-header">
                  <h3 class="flash-plan-name">
                    <i data-lucide="zap" class="icon-sm text-primary"></i>
                    <span>${cardBrand}</span>
                  </h3>
                  <p class="flash-plan-desc">
                    Perfect for beginners. ${formattedAmount} Flash USDT instant delivery.
                  </p>
                </div>
                
                <div class="flash-plan-amount-wrap">
                  <div class="flash-plan-amount">
                    ${formattedAmount} <span class="font-mono text-xs font-normal text-muted-foreground">USDT</span>
                  </div>
                  <div class="flash-plan-rate">
                    <i data-lucide="trending-up" class="icon-sm text-primary"></i>
                    <span>Rate: ${rateLabel}</span>
                  </div>
                </div>
                
                <div class="flash-plan-checklist">
                  <div class="flash-plan-check-item">
                    <i data-lucide="check-circle" class="icon-sm text-primary"></i>
                    <span>Instant wallet delivery</span>
                  </div>
                  <div class="flash-plan-check-item">
                    <i data-lucide="check-circle" class="icon-sm text-primary"></i>
                    <span>Contract: <span class="blurred-details" style="font-size: 8px;">0x71C...8eA2</span></span>
                  </div>
                  <div class="flash-plan-check-item">
                    <i data-lucide="check-circle" class="icon-sm text-primary"></i>
                    <span>Tx Hash: <span class="blurred-details" style="font-size: 8px;">0x99aef...113bc</span></span>
                  </div>
                  <div class="flash-plan-check-item">
                    <i data-lucide="check-circle" class="icon-sm text-primary"></i>
                    <span>No KYC required</span>
                  </div>
                  <div class="flash-plan-check-item">
                    <i data-lucide="check-circle" class="icon-sm text-primary"></i>
                    <span>24/7 support</span>
                  </div>
                </div>
                
                <button class="btn btn-primary flash-plan-btn glow-green" onclick="window.location.hash = '#/flash-checkout?package=${p.id}'">
                  <i data-lucide="zap" class="icon-sm"></i> Buy for $${p.price_usd}
                </button>
                
                ${(this.currentUser && !canAfford) ? `
                  <div class="insuf-lbl">
                    Insufficient balance. <a href="#/deposit">Deposit funds</a>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
      this.render(html);
    },

    // New Direct Checkout View for Flash USDT
    viewFlashCheckout(pkgId) {
      if (!this.requireAuth()) return;
      
      const packages = db.get('flash_packages', []);
      const pkg = packages.find(p => p.id === pkgId);
      if (!pkg) {
        ut.error("Package not found.");
        return;
      }
      
      const balances = db.get('balances', {});
      const userBalance = balances[this.currentUser.email] || 0.00;
      const canAfford = userBalance >= pkg.price_usd;
      
      const html = `
        <div class="flash-checkout-container">
          <div class="welcome-widget" style="margin-bottom: 1.5rem;">
            <h1 class="font-heading text-2xl font-bold flex items-center gap-2">
              <i data-lucide="zap" class="text-primary text-glow"></i> Flash USDT Checkout
            </h1>
          </div>
          
          <!-- Order Summary Card -->
          <div class="flash-checkout-panel">
            <span class="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-4">Order Summary</span>
            <div class="flash-checkout-summary-row">
              <div>
                <h3 class="font-heading font-extrabold text-md" style="color: #fff;">${pkg.name}</h3>
                <p class="font-mono text-[10px] text-muted-foreground mt-1">Flash USDT • Instant delivery</p>
              </div>
              <div class="text-right">
                <span class="font-heading font-extrabold text-2xl text-primary text-glow">${pkg.flash_amount.toLocaleString()}</span>
                <span class="font-mono text-[10px] text-muted-foreground block">USDT</span>
              </div>
            </div>
            
            <div class="dropdown-divider" style="margin: 1.5rem 0;"></div>
            
            <div class="flex justify-between items-center font-mono text-sm">
              <span class="text-muted-foreground">Total Cost</span>
              <span class="font-bold text-glow" style="color: #17cf73;">$${pkg.price_usd}</span>
            </div>
          </div>
          
          <!-- Wallet Balance Card -->
          <div class="flash-checkout-panel flex justify-between items-center" style="padding: 1.25rem 1.75rem;">
            <div class="flex items-center gap-2">
              <i data-lucide="wallet" class="icon-sm text-primary"></i>
              <span class="font-mono text-xs text-muted-foreground">YOUR BALANCE</span>
            </div>
            <div class="text-right">
              <span class="font-mono text-md font-bold" style="color: #17cf73;">$${userBalance.toFixed(2)}</span>
              ${canAfford ? `
                <span class="font-mono text-[9px] text-muted-foreground block mt-1">After purchase: $${(userBalance - pkg.price_usd).toFixed(2)}</span>
              ` : ''}
            </div>
          </div>
          
          <!-- Delivery Network Card -->
          <div class="flash-checkout-panel">
            <span class="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-3">Delivery Wallet</span>
            <span class="font-heading text-xs font-bold" style="color: #fff;">Select Network</span>
            
            <div class="flash-checkout-net-grid">
              <div class="flash-checkout-net-card active" data-network="trc20" onclick="app.selectFlashNetwork('trc20')">
                <div class="flash-checkout-net-lbl" style="color: #ff4a4a;">USDT TRC20</div>
                <div class="flash-checkout-net-desc">Tron Network</div>
              </div>
              
              <div class="flash-checkout-net-card" data-network="bep20" onclick="app.selectFlashNetwork('bep20')">
                <div class="flash-checkout-net-lbl" style="color: #ffaa00;">USDT BEP20</div>
                <div class="flash-checkout-net-desc">BSC Network</div>
              </div>
            </div>
            
            <div class="flash-checkout-input-group">
              <label class="font-mono text-xs text-muted-foreground block mb-2" id="net-addr-lbl">Your TRC20 Wallet Address</label>
              <input type="text" id="flash-wallet-addr-input" class="flash-checkout-input" placeholder="T..." required>
              <span class="font-mono text-[9px] text-muted-foreground block mt-2" id="net-hint-lbl">Works with Trust Wallet, Binance, MetaMask & any TRC20 wallet</span>
            </div>
          </div>
          
          <!-- Confirm Purchase Action -->
          ${canAfford ? `
            <button class="btn btn-primary w-full py-4 font-bold glow-green" onclick="app.confirmFlashPurchase('${pkg.id}')" style="font-size: 0.95rem; border-radius: var(--radius);">
              <i data-lucide="zap" class="icon-sm"></i> CONFIRM ORDER — $${pkg.price_usd}
            </button>
            <p class="font-mono text-[10px] text-muted-foreground text-center mt-2">
              Flash USDT is delivered within 15–30 minutes after order confirmation.
            </p>
          ` : `
            <div class="flex flex-col gap-2">
              <p class="font-mono text-xs text-destructive text-center"><i data-lucide="alert-circle" class="icon-sm align-middle mr-1"></i> Insufficient balance.</p>
              <a href="#/deposit" class="btn btn-primary w-full py-3 font-bold glow-green text-center">Deposit Funds</a>
            </div>
          `}
        </div>
      `;
      this.render(html);
    },

    selectFlashNetwork(network) {
      document.querySelectorAll('.flash-checkout-net-card').forEach(card => {
        if (card.getAttribute('data-network') === network) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
      
      const addrLbl = document.getElementById('net-addr-lbl');
      const input = document.getElementById('flash-wallet-addr-input');
      const hintLbl = document.getElementById('net-hint-lbl');
      
      if (network === 'trc20') {
        addrLbl.innerText = 'Your TRC20 Wallet Address';
        input.placeholder = 'T...';
        hintLbl.innerText = 'Works with Trust Wallet, Binance, MetaMask & any TRC20 wallet';
      } else {
        addrLbl.innerText = 'Your BEP20 Wallet Address';
        input.placeholder = '0x...';
        hintLbl.innerText = 'Works with Trust Wallet, Safepal, MetaMask & any BSC wallet';
      }
    },

    confirmFlashPurchase(pkgId) {
      if (!this.currentUser) return;
      
      const addr = document.getElementById('flash-wallet-addr-input').value.trim();
      if (!addr) {
        ut.error("Please provide a valid destination wallet address.");
        return;
      }
      
      const packages = db.get('flash_packages', []);
      const pkg = packages.find(p => p.id === pkgId);
      if (!pkg) {
        ut.error("Package not found.");
        return;
      }
      
      const balances = db.get('balances', {});
      const balance = balances[this.currentUser.email] || 0.00;
      if (balance < pkg.price_usd) {
        ut.error("Insufficient balance.");
        return;
      }
      
      const network = document.querySelector('.flash-checkout-net-card.active').getAttribute('data-network').toUpperCase();
      
      // Deduct balance
      balances[this.currentUser.email] = balance - pkg.price_usd;
      db.set('balances', balances);
      
      // Add Order
      const orders = db.get('orders', []);
      const order = {
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        card_id: `flash_${pkg.id}`,
        card_title: `Flash USDT — ${pkg.flash_amount.toLocaleString()} USDT`,
        amount: pkg.price_usd,
        payment_method: 'wallet_balance',
        status: 'approved',
        buyer_email: this.currentUser.email,
        details: { wallet: network, address: addr, txid: '0x' + Math.random().toString(16).substr(2, 28) },
        created_date: new Date().toISOString()
      };
      orders.push(order);
      db.set('orders', orders);
      
      this.updateHeaderUI();
      ut.success(`${pkg.flash_amount.toLocaleString()} Flash USDT purchase submitted successfully!`);
      
      // Render success screen
      this.render(`
        <div class="max-w-md mx-auto px-4 py-8 text-center">
          <div class="product-card" style="border-color: #17cf73; padding: 2rem; box-shadow: 0 0 20px rgba(23, 207, 115, 0.15);">
            <div class="feature-icon-wrapper mx-auto" style="background-color: rgba(23, 207, 115, 0.1); border-color: rgba(23, 207, 115, 0.3); margin-bottom: 1.5rem;">
              <i data-lucide="check" class="text-primary" style="width: 1.5rem; height: 1.5rem;"></i>
            </div>
            
            <h2 class="font-heading text-xl font-bold mb-2">Order Confirmed!</h2>
            <p class="font-mono text-xs text-muted-foreground mb-6">Flash USDT is being processed and will be sent to your wallet shortly.</p>
            
            <div class="card-details font-mono" style="text-align: left; background-color: hsl(var(--secondary)); border-radius: var(--radius); padding: 1rem; border: 1px dashed hsl(var(--border));">
              <div class="detail-row" style="margin-bottom: 0.5rem;">
                <span class="detail-label">Asset:</span>
                <span class="detail-val" style="color: #fff;">${pkg.flash_amount.toLocaleString()} USDT (${network})</span>
              </div>
              <div class="detail-row" style="margin-bottom: 0.5rem;">
                <span class="detail-label">Dest Wallet:</span>
                <span class="detail-val text-primary" style="font-weight: 700; word-break: break-all;">${addr}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-val text-glow" style="color: #17cf73; font-weight: 700;">Processing (15-30m)</span>
              </div>
            </div>
            
            <p class="font-mono text-[9px] text-muted-foreground mt-4 mb-6">Note: A confirmation record with status trackers has been saved to your Order History logs.</p>
            
            <div class="flex gap-4">
              <a href="#/flash-usdt" class="btn btn-secondary w-full">Order Again</a>
              <a href="#/orders" class="btn btn-primary w-full glow-green">View Orders</a>
            </div>
          </div>
        </div>
      `);
      lucide.createIcons();
    },

    // 8. Orders History Page View
    viewOrders() {
      if (!this.requireAuth('#/orders')) return;

      const allOrders = db.get('orders', []);
      const userOrders = allOrders.filter(o => o.buyer_email === this.currentUser.email).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const cards = db.get('cards', []);
      const products = db.get('products', []);

      const html = `
        <div class="welcome-widget">
          <h1 class="font-heading text-2xl font-bold flex items-center gap-2">
            <i data-lucide="shopping-bag" class="text-primary"></i> My Orders
          </h1>
          <p class="font-mono text-xs text-muted-foreground mt-1">View your purchase history and delivery details</p>
        </div>

        ${userOrders.length === 0 ? `
          <div class="empty-catalog-state" style="padding: 4rem 0;">
            <i data-lucide="shopping-bag" class="empty-catalog-icon"></i>
            <span class="empty-catalog-text">No orders yet</span>
            <a href="#/products" class="btn btn-primary glow-green font-bold mt-4">Start Shopping</a>
          </div>
        ` : `
          <div class="orders-list">
            ${userOrders.map(o => {
              const dateObj = new Date(o.created_date);
              const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + 
                                    dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

              let typeIcon = 'package';
              let typeLabel = 'Product';

              if (o.card_id && o.card_id.startsWith('flash_')) {
                typeIcon = 'zap';
                typeLabel = 'Flash USDT';
              } else if (o.card_id && o.card_id.startsWith('c')) {
                typeIcon = 'credit-card';
                typeLabel = 'Card';
              }

              let detailsHtml = '';
              if (o.details) {
                if (o.details.number) {
                  detailsHtml = `
                    <div class="order-detail-row">
                      <span class="order-detail-label">Card Number:</span>
                      <span class="order-detail-value text-primary font-bold" style="letter-spacing: 0.05em;">${o.details.number}</span>
                    </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">CVV:</span>
                      <span class="order-detail-value text-primary font-bold">${o.details.cvv}</span>
                    </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">Expiry:</span>
                      <span class="order-detail-value">${o.details.expiry}</span>
                    </div>
                  `;
                } else if (o.details.txid) {
                  detailsHtml = `
                    <div class="order-detail-row">
                      <span class="order-detail-label">Transaction:</span>
                      <span class="order-detail-value font-mono text-xs">${o.details.txid}</span>
                    </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">Wallet:</span>
                      <span class="order-detail-value font-mono text-xs">${o.details.wallet || 'N/A'}</span>
                    </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">Address:</span>
                      <span class="order-detail-value font-mono text-xs">${o.details.address || 'N/A'}</span>
                    </div>
                  `;
                } else if (o.details.delivery_name) {
                  detailsHtml = `
                    <div class="order-detail-row">
                      <span class="order-detail-label">Delivery Name:</span>
                      <span class="order-detail-value">${o.details.delivery_name}</span>
                    </div>
                    <div class="order-detail-row">
                      <span class="order-detail-label">Delivery Email:</span>
                      <span class="order-detail-value">${o.details.delivery_email}</span>
                    </div>
                  `;
                }
              }

              return `
                <div class="order-card">
                  <div class="order-card-header">
                    <div class="order-type-badge">
                      <i data-lucide="${typeIcon}" class="icon-sm"></i>
                      <span>${typeLabel}</span>
                    </div>
                    <span class="order-date">${formattedDate}</span>
                    <span class="badge badge-success">${o.status}</span>
                  </div>
                  <div class="order-card-body">
                    <h3 class="font-heading font-bold text-sm" style="color: #fff;">${o.card_title}</h3>
                    <div class="order-meta">
                      <span class="order-id font-mono text-[10px] text-muted-foreground">Order #${o.id}</span>
                      <span class="order-amount font-bold text-primary">$${o.amount.toFixed(2)}</span>
                    </div>
                    ${detailsHtml ? `
                      <div class="order-details-reveal">
                        <div class="dropdown-divider" style="margin: 0.75rem 0;"></div>
                        ${detailsHtml}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `;
      this.render(html);
    },

    // Account Page View
    viewAccount() {
      if (!this.requireAuth('#/')) return;

      const balances = db.get('balances', {});
      const balance = balances[this.currentUser.email] || 0.00;
      const orders = db.get('orders', []);
      const userOrders = orders.filter(o => o.buyer_email === this.currentUser.email);
      const initials = this.currentUser.email.substring(0, 2).toUpperCase();

      const html = `
        <div class="welcome-widget">
          <h1 class="font-heading text-2xl font-bold flex items-center gap-2">
            <i data-lucide="user" class="text-primary"></i> My Account
          </h1>
        </div>

        <div class="account-grid">
          <div class="product-card account-profile-card">
            <div class="account-avatar-wrap">
              <span class="account-avatar">${initials}</span>
            </div>
            <h3 class="font-heading font-bold text-lg mt-4" style="color: #fff;">${this.currentUser.email}</h3>
            <span class="badge badge-primary mt-2">${(this.currentUser.role || 'user').toUpperCase()}</span>
          </div>

          <div class="product-card">
            <h3 class="font-heading font-bold text-sm flex items-center gap-2 mb-4" style="color: #fff;">
              <i data-lucide="wallet" class="text-primary icon-sm"></i> Balance
            </h3>
            <div class="account-balance-val">$${balance.toFixed(2)}</div>
            <a href="#/deposit" class="btn btn-primary w-full glow-green font-bold mt-4">
              <i data-lucide="plus" class="icon-sm"></i> Deposit Funds
            </a>
          </div>

          <div class="product-card">
            <h3 class="font-heading font-bold text-sm flex items-center gap-2 mb-4" style="color: #fff;">
              <i data-lucide="shopping-bag" class="text-primary icon-sm"></i> Orders
            </h3>
            <div class="account-stat-val">${userOrders.length}</div>
            <p class="font-mono text-xs text-muted-foreground mb-4">Total orders placed</p>
            <a href="#/orders" class="btn btn-secondary w-full font-bold">
              <i data-lucide="eye" class="icon-sm"></i> View Orders
            </a>
          </div>

          <div class="product-card">
            <h3 class="font-heading font-bold text-sm flex items-center gap-2 mb-4" style="color: #fff;">
              <i data-lucide="credit-card" class="text-primary icon-sm"></i> Quick Actions
            </h3>
            <div class="account-actions">
              <a href="#/cards" class="btn btn-outline w-full font-bold">
                <i data-lucide="credit-card" class="icon-sm"></i> Browse Cards
              </a>
              <a href="#/flash-usdt" class="btn btn-outline w-full font-bold">
                <i data-lucide="zap" class="icon-sm"></i> Flash USDT
              </a>
              <button class="btn btn-outline w-full font-bold text-destructive" onclick="app.logout()">
                <i data-lucide="log-out" class="icon-sm"></i> Log Out
              </button>
            </div>
          </div>
        </div>
      `;
      this.render(html);
    },

    // Admin Login View
    viewAdminLogin() {
      const html = `
        <div class="admin-login-wrapper">
          <div class="admin-login-card">
            <div class="admin-login-header">
              <span class="admin-login-glow-logo">
                <i data-lucide="shield" style="width: 3rem; height: 3rem;"></i>
              </span>
              <h2 class="admin-login-title">Console Authentication</h2>
              <p class="font-mono text-[10px] text-muted-foreground mt-1">Admin console authorization required</p>
            </div>
            
            <form onsubmit="app.handleAdminConsoleLogin(event)">
              <div class="form-group mb-4">
                <label class="form-label" for="admin-email">Admin Gmail</label>
                <input type="email" id="admin-email" class="form-input" placeholder="admin@gmail.com" required>
              </div>
              <div class="form-group mb-4">
                <label class="form-label" for="admin-password">Console Password</label>
                <input type="password" id="admin-password" class="form-input" placeholder="••••••••" required>
              </div>
              
              <button type="submit" class="btn btn-primary w-full font-bold glow-green mt-6" style="padding: 0.85rem 1rem;">
                Authenticate Session
              </button>
            </form>
          </div>
        </div>
      `;
      this.render(html);
      lucide.createIcons();
    },

    handleAdminConsoleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value;
      
      if (email === 'iamcuteabubakar@gmail.com' && password === '@Usmankh11') {
        this.adminAuthenticated = true;
        this.currentUser = { email: email, role: 'admin' };
        this.updateHeaderUI();
        ut.success("Console authenticated successfully.");
        this.viewAdmin();
      } else {
        ut.error("Invalid administrator credentials.");
      }
    },

    // 6. Admin Dashboard View
    async viewAdmin() {
      if (!this.requireAuth()) return;
      if (this.currentUser.role !== 'admin') {
        ut.error("Access denied. Admin authorization required.");
        window.location.hash = '#/';
        return;
      }
      
      let pendingDepositsCount = 0;
      try {
        const deposits = await depositService.fetchAllDeposits();
        pendingDepositsCount = deposits.filter(d => d.status === 'pending').length;
      } catch (err) {
        console.error("Failed to fetch pending deposits count for admin sidebar:", err);
      }
      
      const html = `
        <div class="welcome-widget">
          <h1 class="font-heading text-2xl font-bold flex items-center gap-2">
            <i data-lucide="shield" class="text-primary"></i> Admin Dashboard
          </h1>
          <p class="font-mono text-xs text-muted-foreground mt-1">Overview systems controls and approve/decline client deposits</p>
        </div>
        
        <div class="admin-layout">
          <aside class="admin-sidebar">
            <button class="admin-tab-btn ${this.activeAdminTab === 'deposits' ? 'active' : ''}" onclick="app.setAdminTab('deposits')">
              <i data-lucide="wallet"></i> Deposits ${pendingDepositsCount > 0 ? `<span class="badge badge-primary ml-auto">${pendingDepositsCount}</span>` : ''}
            </button>
            <button class="admin-tab-btn ${this.activeAdminTab === 'deposit-addresses' ? 'active' : ''}" onclick="app.setAdminTab('deposit-addresses')">
              <i data-lucide="map-pin"></i> Deposit Addresses
            </button>
            <button class="admin-tab-btn ${this.activeAdminTab === 'cards' ? 'active' : ''}" onclick="app.setAdminTab('cards')">
              <i data-lucide="credit-card"></i> Cards
            </button>
            <button class="admin-tab-btn ${this.activeAdminTab === 'flash' ? 'active' : ''}" onclick="app.setAdminTab('flash')">
              <i data-lucide="zap"></i> Flash USDT
            </button>
            <button class="admin-tab-btn ${this.activeAdminTab === 'products' ? 'active' : ''}" onclick="app.setAdminTab('products')">
              <i data-lucide="package"></i> Products
            </button>
            <button class="admin-tab-btn ${this.activeAdminTab === 'orders' ? 'active' : ''}" onclick="app.setAdminTab('orders')">
              <i data-lucide="shopping-bag"></i> Orders
            </button>
          </aside>
          
          <main class="admin-content" id="admin-subcontent">
            <!-- Sub tabs view rendered here -->
          </main>
        </div>
      `;
      this.render(html);
      this.renderAdminSubTab();
    },

    async setAdminTab(tabName) {
      this.activeAdminTab = tabName;
      await this.viewAdmin();
    },

    async renderAdminSubTab() {
      const container = document.getElementById('admin-subcontent');
      if (!container) return;
      
      if (this.activeAdminTab === 'deposits') {
        container.innerHTML = `
          <h3 class="font-heading font-bold text-lg mb-4">Deposit Approvals</h3>
          <div class="text-center font-mono text-xs text-muted-foreground py-12 flex items-center justify-center gap-2">
            <span class="spinner"></span> Loading deposit requests from Supabase...
          </div>
        `;
        
        try {
          const deposits = await depositService.fetchAllDeposits();
          
          container.innerHTML = `
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-heading font-bold text-lg">Deposit Approvals</h3>
              <span class="font-mono text-xs text-muted-foreground">Total: ${deposits.length} deposits</span>
            </div>
            
            <div class="table-wrapper">
              <table class="app-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Network</th>
                    <th>TxID</th>
                    <th>Proof</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${deposits.length === 0 ? `
                    <tr>
                      <td colspan="7" class="text-center font-mono text-xs text-muted-foreground py-6">No deposit submissions registered.</td>
                    </tr>
                  ` : deposits.map(d => {
                    const hasProof = d.proof_image ? `<button class="btn btn-secondary btn-sm" onclick="app.showProofModal('${d.id}')">View</button>` : '<span class="text-muted-foreground">None</span>';
                    
                    let actionCell = '';
                    if (d.status === 'pending') {
                      actionCell = `
                        <div class="flex gap-2">
                          <button class="btn btn-primary btn-sm glow-green font-bold" onclick="app.approveDeposit('${d.id}')">Approve</button>
                          <button class="btn btn-outline btn-sm text-destructive" onclick="app.declineDeposit('${d.id}')">Decline</button>
                        </div>
                      `;
                    } else {
                      actionCell = `<span class="text-muted-foreground capitalize">${d.status}</span>`;
                    }

                    let statusClass = 'badge-primary';
                    if (d.status === 'approved') statusClass = 'badge-success';
                    if (d.status === 'declined') statusClass = 'badge-danger';
                    
                    return `
                      <tr>
                        <td class="font-mono text-xs">${d.user_email}</td>
                        <td class="font-bold text-primary">$${parseFloat(d.amount).toFixed(2)}</td>
                        <td class="capitalize">${d.payment_method.replace('_', ' ').toUpperCase()}</td>
                        <td class="font-mono text-xs">${d.transaction_hash}</td>
                        <td>${hasProof}</td>
                        <td><span class="badge ${statusClass}">${d.status}</span></td>
                        <td>${actionCell}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
          lucide.createIcons();
        } catch (error) {
          console.error("Error loading admin deposits:", error);
          container.innerHTML = `
            <h3 class="font-heading font-bold text-lg mb-4">Deposit Approvals</h3>
            <div class="text-center font-mono text-xs text-destructive py-6">
              Failed to load deposits from Supabase.
            </div>
          `;
        }
      } else if (this.activeAdminTab === 'cards') {
        const cards = db.get('cards', []);
        
        container.innerHTML = `
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-heading font-bold text-lg">Inventory Cards</h3>
            <button class="btn btn-primary btn-sm glow-green" onclick="app.openAddCardModal()"><i data-lucide="plus" class="icon-sm"></i> Add Card</button>
          </div>
          
          <div class="table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Bank</th>
                  <th>Country</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${cards.length === 0 ? `
                  <tr>
                    <td colspan="7" class="text-center font-mono text-xs text-muted-foreground py-6">No inventory cards recorded.</td>
                  </tr>
                ` : cards.map(c => {
                  let statusClass = 'badge-primary';
                  if (c.status === 'available') statusClass = 'badge-success';
                  if (c.status === 'sold') statusClass = 'badge-outline';
                  
                  return `
                    <tr>
                      <td class="font-bold">${c.title}</td>
                      <td class="font-mono text-xs">${c.bank}</td>
                      <td>${c.country}</td>
                      <td class="capitalize">${c.category}</td>
                      <td class="font-mono text-primary">$${c.price.toFixed(2)}</td>
                      <td><span class="badge ${statusClass}">${c.status}</span></td>
                      <td>
                        <button class="btn btn-outline btn-sm text-destructive" onclick="app.deleteInventoryCard('${c.id}')"><i data-lucide="trash" class="icon-sm"></i></button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (this.activeAdminTab === 'flash') {
        const packages = db.get('flash_packages', []);
        
        container.innerHTML = `
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-heading font-bold text-lg">Flash USDT Packages</h3>
            <button class="btn btn-primary btn-sm glow-green" onclick="app.openAddFlashModal()"><i data-lucide="plus" class="icon-sm"></i> Add Package</button>
          </div>
          
          <div class="table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Flash Amount</th>
                  <th>Price (USD)</th>
                  <th>Popular</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${packages.length === 0 ? `
                  <tr>
                    <td colspan="5" class="text-center font-mono text-xs text-muted-foreground py-6">No Flash packages recorded.</td>
                  </tr>
                ` : packages.map(p => {
                  return `
                    <tr>
                      <td class="font-bold">${p.name}</td>
                      <td class="font-mono text-xs text-primary font-bold">${p.flash_amount.toLocaleString()} USDT</td>
                      <td class="font-mono">$${p.price_usd.toFixed(2)}</td>
                      <td class="font-mono text-xs">${p.is_popular ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-outline">No</span>'}</td>
                      <td>
                        <button class="btn btn-outline btn-sm text-destructive" onclick="app.deleteInventoryFlash('${p.id}')"><i data-lucide="trash" class="icon-sm"></i></button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (this.activeAdminTab === 'products') {
        const products = db.get('products', []);

        container.innerHTML = `
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-heading font-bold text-lg">Products Management</h3>
            <button class="btn btn-primary btn-sm glow-green" onclick="app.openAddProductModal()"><i data-lucide="plus" class="icon-sm"></i> Add Product</button>
          </div>

          <div class="table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Original Price</th>
                  <th>Our Price</th>
                  <th>Discount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${products.length === 0 ? `
                  <tr>
                    <td colspan="7" class="text-center font-mono text-xs text-muted-foreground py-6">No products recorded.</td>
                  </tr>
                ` : products.map(p => {
                  const discountPercent = Math.round((1 - p.discounted_price / p.original_price) * 100);
                  const thumbHtml = p.image
                    ? `<img src="${p.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: var(--radius);">`
                    : `<div style="width: 40px; height: 40px; background: hsl(var(--secondary)); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; color: hsl(var(--muted-foreground));"><i data-lucide="image" class="icon-sm"></i></div>`;

                  return `
                    <tr>
                      <td>${thumbHtml}</td>
                      <td class="font-bold" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.title}</td>
                      <td class="capitalize">${p.category.replace('_', ' ')}</td>
                      <td class="font-mono text-xs text-muted-foreground" style="text-decoration: line-through;">$${p.original_price.toFixed(2)}</td>
                      <td class="font-mono text-primary font-bold">$${p.discounted_price.toFixed(2)}</td>
                      <td><span class="badge badge-success">-${discountPercent}%</span></td>
                      <td>
                        <button class="btn btn-outline btn-sm text-destructive" onclick="app.deleteProduct('${p.id}')"><i data-lucide="trash" class="icon-sm"></i></button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (this.activeAdminTab === 'orders') {
        const orders = db.get('orders', []);
        
        container.innerHTML = `
          <h3 class="font-heading font-bold text-lg mb-4">Client Order History</h3>
          
          <div class="table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>OrderID</th>
                  <th>Client</th>
                  <th>Product</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Unlocked Data</th>
                </tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? `
                  <tr>
                    <td colspan="6" class="text-center font-mono text-xs text-muted-foreground py-6">No orders recorded in system.</td>
                  </tr>
                ` : orders.map(o => {
                  let detailsHtml = '';
                  if (o.details) {
                    if (o.details.number) {
                      detailsHtml = `<span class="font-mono text-xs text-primary">${o.details.number} CVV:${o.details.cvv} Exp:${o.details.expiry}</span>`;
                    } else if (o.details.txid) {
                      detailsHtml = `<span class="font-mono text-xs text-muted-foreground">Tx: ${o.details.txid.substring(0, 12)}...</span>`;
                    }
                  }
                  
                  return `
                    <tr>
                      <td class="font-mono text-xs">${o.id}</td>
                      <td class="font-mono text-xs">${o.buyer_email}</td>
                      <td>${o.card_title}</td>
                      <td class="font-bold text-primary">$${o.amount.toFixed(2)}</td>
                      <td><span class="badge badge-success">${o.status}</span></td>
                      <td>${detailsHtml}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (this.activeAdminTab === 'deposit-addresses') {
        const addresses = db.get('deposit_addresses', []);
        
        container.innerHTML = `
          <div class="flex justify-between items-center mb-6">
            <h3 class="font-heading font-bold text-lg">Deposit Addresses</h3>
            <button class="btn btn-primary btn-sm glow-green" onclick="app.openAddAddressModal()"><i data-lucide="plus" class="icon-sm"></i> Add Address</button>
          </div>
          
          <div class="table-wrapper">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Network</th>
                  <th>Address / UID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${addresses.length === 0 ? `
                  <tr>
                    <td colspan="5" class="text-center font-mono text-xs text-muted-foreground py-6">No deposit addresses configured.</td>
                  </tr>
                ` : addresses.map(a => `
                  <tr>
                    <td class="font-bold">${a.label}</td>
                    <td class="font-mono text-xs capitalize">${a.network.replace(/_/g, ' ').toUpperCase()}</td>
                    <td class="font-mono text-xs" style="word-break: break-all; max-width: 300px;">${a.address}</td>
                    <td><span class="badge badge-success">Active</span></td>
                    <td>
                      <div class="flex gap-2">
                        <button class="btn btn-secondary btn-sm" onclick="app.openEditAddressModal('${a.id}')"><i data-lucide="pencil" class="icon-sm"></i></button>
                        <button class="btn btn-outline btn-sm text-destructive" onclick="app.deleteDepositAddress('${a.id}')"><i data-lucide="trash" class="icon-sm"></i></button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      lucide.createIcons();
    },

    async approveDeposit(depId) {
      try {
        const deposits = await depositService.fetchAllDeposits();
        const deposit = deposits.find(d => d.id === depId);
        
        if (!deposit) {
          ut.error("Deposit not found.");
          return;
        }
        
        await depositService.updateDepositStatus(depId, 'approved');
        
        // Also update local cache
        const localDeps = db.get('deposits', []);
        const idx = localDeps.findIndex(d => d.id === depId);
        if (idx !== -1) {
          localDeps[idx].status = 'approved';
          db.set('deposits', localDeps);
        }
        
        // Credit client balance
        const balances = db.get('balances', {});
        const userBal = balances[deposit.user_email] || 0.00;
        balances[deposit.user_email] = userBal + parseFloat(deposit.amount);
        db.set('balances', balances);
        
        // Save to credited_deposits to prevent double-crediting
        const credited = db.get('credited_deposits', []);
        if (!credited.includes(depId)) {
          credited.push(depId);
          db.set('credited_deposits', credited);
        }
        
        this.updateHeaderUI();
        ut.success(`Deposit of $${parseFloat(deposit.amount).toFixed(2)} approved for ${deposit.user_email}!`);
        await this.renderAdminSubTab();
      } catch (err) {
        console.error("Error approving deposit:", err);
        ut.error("Failed to approve deposit.");
      }
    },

    async declineDeposit(depId) {
      try {
        await depositService.updateDepositStatus(depId, 'declined');
        
        // Also update local cache
        const localDeps = db.get('deposits', []);
        const idx = localDeps.findIndex(d => d.id === depId);
        if (idx !== -1) {
          localDeps[idx].status = 'declined';
          db.set('deposits', localDeps);
        }
        
        ut.success("Deposit declined.");
        await this.renderAdminSubTab();
      } catch (err) {
        console.error("Error declining deposit:", err);
        ut.error("Failed to decline deposit.");
      }
    },

    deleteInventoryCard(cardId) {
      let cards = db.get('cards', []);
      cards = cards.filter(c => c.id !== cardId);
      db.set('cards', cards);
      ut.success("Card inventory item deleted.");
      this.renderAdminSubTab();
    },

    // View screenshot proof modal
    async showProofModal(depId) {
      try {
        const deposits = await depositService.fetchAllDeposits();
        const dep = deposits.find(d => d.id === depId);
        if (!dep || !dep.proof_image) {
          ut.error("Proof image not found.");
          return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'proof-modal';
        modal.innerHTML = `
          <div class="modal-container">
            <div class="modal-header">
              <h3 class="font-heading font-bold">Proof Screenshot</h3>
              <button class="modal-close" onclick="document.getElementById('proof-modal').remove()"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body text-center">
              <img src="${dep.proof_image}" style="max-width: 100%; max-height: 70vh; border-radius: var(--radius); border: 1px solid hsl(var(--border));">
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        lucide.createIcons();
      } catch (err) {
        console.error("Error showing proof modal:", err);
        ut.error("Failed to fetch proof image.");
      }
    },

    // 7. Add Card Modal (Admin tab)
    openAddCardModal() {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'add-card-modal';
      modal.innerHTML = `
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="font-heading font-bold">Add Inventory Card</h3>
            <button class="modal-close" onclick="document.getElementById('add-card-modal').remove()"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body">
            <form onsubmit="app.handleAddCardSubmit(event)">
              <div class="form-group">
                <label class="form-label" for="add-c-title">Card Name</label>
                <input type="text" id="add-c-title" class="form-input" placeholder="e.g. Wells Fargo Gold Visa" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-c-bank">Bank Name</label>
                <input type="text" id="add-c-bank" class="form-input" placeholder="e.g. Wells Fargo" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-c-country">Country</label>
                <input type="text" id="add-c-country" class="form-input" placeholder="e.g. United States" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-c-cat">Brand Category</label>
                <select id="add-c-cat" class="form-select">
                  <option value="visa">Visa</option>
                  <option value="mastercard">MasterCard</option>
                  <option value="amex">Amex</option>
                  <option value="discover">Discover</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-c-price">Price (USD)</label>
                <input type="number" id="add-c-price" class="form-input" placeholder="e.g. 45" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-c-number">Full Card Number</label>
                <input type="text" id="add-c-number" class="form-input" placeholder="e.g. 4111 2222 3333 4444" required>
              </div>
              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label class="form-label" for="add-c-exp">Expiry (MM/YY)</label>
                  <input type="text" id="add-c-exp" class="form-input" placeholder="10/28" required>
                </div>
                <div>
                  <label class="form-label" for="add-c-cvv">CVV</label>
                  <input type="text" id="add-c-cvv" class="form-input" placeholder="123" required>
                </div>
              </div>
              
              <button type="submit" class="btn btn-primary w-full glow-green mt-2 font-bold">Add to Inventory</button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      lucide.createIcons();
    },

    handleAddCardSubmit(e) {
      e.preventDefault();
      
      const title = document.getElementById('add-c-title').value;
      const bank = document.getElementById('add-c-bank').value;
      const country = document.getElementById('add-c-country').value;
      const category = document.getElementById('add-c-cat').value;
      const price = parseFloat(document.getElementById('add-c-price').value);
      const number = document.getElementById('add-c-number').value;
      const expiry = document.getElementById('add-c-exp').value;
      const cvv = document.getElementById('add-c-cvv').value;
      
      // Mask card number for catalog display
      const cardNumParts = number.split(' ');
      let maskedNum = '';
      if (cardNumParts.length >= 4) {
        maskedNum = `${cardNumParts[0]} ${cardNumParts[1].substring(0,2)}XX XXXX ${cardNumParts[3]}`;
      } else {
        maskedNum = number.substring(0, 4) + ' XXXX XXXX ' + number.substring(number.length - 4);
      }
      
      const cards = db.get('cards', []);
      const newCard = {
        id: 'c_' + Math.random().toString(36).substr(2, 9),
        title,
        bank,
        country,
        category,
        price,
        status: 'available',
        card_number: maskedNum,
        details: { number, cvv, expiry }
      };
      
      cards.push(newCard);
      db.set('cards', cards);
      
      document.getElementById('add-card-modal').remove();
      ut.success(`${title} added to system inventory!`);
      this.renderAdminSubTab();
    },

    openAddFlashModal() {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'add-flash-modal';
      modal.innerHTML = `
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="font-heading font-bold">Add Flash USDT Package</h3>
            <button class="modal-close" onclick="document.getElementById('add-flash-modal').remove()"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body">
            <form onsubmit="app.handleAddFlashSubmit(event)">
              <div class="form-group">
                <label class="form-label" for="add-fp-name">Package Name</label>
                <input type="text" id="add-fp-name" class="form-input" placeholder="e.g. Starter Package" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-fp-amount">Flash Amount (USDT)</label>
                <input type="number" id="add-fp-amount" class="form-input" placeholder="e.g. 1000" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-fp-price">Price (USD)</label>
                <input type="number" id="add-fp-price" class="form-input" placeholder="e.g. 50" required>
              </div>
              <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
                <input type="checkbox" id="add-fp-popular" style="width: auto; margin: 0;">
                <label class="form-label" for="add-fp-popular" style="margin: 0; cursor: pointer;">Mark as Popular Package</label>
              </div>
              
              <button type="submit" class="btn btn-primary w-full glow-green mt-6 font-bold">Add Flash Package</button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      lucide.createIcons();
    },

    handleAddFlashSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('add-fp-name').value;
      const flash_amount = parseFloat(document.getElementById('add-fp-amount').value);
      const price_usd = parseFloat(document.getElementById('add-fp-price').value);
      const is_popular = document.getElementById('add-fp-popular').checked;
      
      const packages = db.get('flash_packages', []);
      const newPackage = {
        id: 'fp_' + Math.random().toString(36).substr(2, 9),
        name,
        flash_amount,
        price_usd,
        is_popular
      };
      
      packages.push(newPackage);
      db.set('flash_packages', packages);
      
      document.getElementById('add-flash-modal').remove();
      ut.success(`${name} added to system inventory!`);
      this.renderAdminSubTab();
    },

    deleteInventoryFlash(pkgId) {
      let packages = db.get('flash_packages', []);
      packages = packages.filter(p => p.id !== pkgId);
      db.set('flash_packages', packages);
      ut.success("Flash package deleted.");
      this.renderAdminSubTab();
    },

    // -------------------------------------------------------------
    // PRODUCTS CRUD (Admin)
    // -------------------------------------------------------------
    openAddProductModal() {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'add-product-modal';
      modal.innerHTML = `
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="font-heading font-bold">Add Product</h3>
            <button class="modal-close" onclick="document.getElementById('add-product-modal').remove()"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body">
            <form onsubmit="app.handleAddProductSubmit(event)">
              <div class="form-group">
                <label class="form-label" for="add-prod-title">Product Title</label>
                <input type="text" id="add-prod-title" class="form-input" placeholder="e.g. CapCut Pro Subscription" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-prod-desc">Description</label>
                <textarea id="add-prod-desc" class="form-textarea" rows="3" placeholder="Describe the product..." required></textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-prod-cat">Category</label>
                <select id="add-prod-cat" class="form-select">
                  <option value="subscriptions">Subscriptions</option>
                  <option value="funded_accounts">Funded Accounts</option>
                  <option value="accounts">Accounts</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label class="form-label" for="add-prod-original">Original Price ($)</label>
                  <input type="number" id="add-prod-original" class="form-input" placeholder="199.99" step="0.01" required>
                </div>
                <div>
                  <label class="form-label" for="add-prod-discounted">Our Price ($)</label>
                  <input type="number" id="add-prod-discounted" class="form-input" placeholder="49.99" step="0.01" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Product Image</label>
                <div class="file-upload-wrapper" style="border: 1px dashed hsl(var(--border)); background-color: hsla(220, 15%, 10%, 0.2); padding: 1.5rem 1rem;">
                  <i data-lucide="upload-cloud" class="text-muted-foreground mb-2" style="width: 1.5rem; height: 1.5rem;"></i>
                  <span class="font-heading font-bold text-xs" id="prod-upload-txt">Click to upload image</span>
                  <input type="file" class="file-upload-input" accept="image/*" onchange="app.handleProductImage(this)">
                  <img id="prod-file-preview" class="file-upload-preview hidden" src="" alt="preview" style="max-height: 100px; border-radius: var(--radius); margin-top: 0.5rem;">
                </div>
              </div>
              <button type="submit" class="btn btn-primary w-full glow-green mt-2 font-bold">Add Product</button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      lucide.createIcons();
    },

    handleProductImage(input) {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('prod-file-preview');
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        document.getElementById('prod-upload-txt').innerText = 'Image selected';
      };
      reader.readAsDataURL(file);
    },

    handleAddProductSubmit(e) {
      e.preventDefault();
      const title = document.getElementById('add-prod-title').value;
      const description = document.getElementById('add-prod-desc').value;
      const category = document.getElementById('add-prod-cat').value;
      const original_price = parseFloat(document.getElementById('add-prod-original').value);
      const discounted_price = parseFloat(document.getElementById('add-prod-discounted').value);
      const preview = document.getElementById('prod-file-preview');
      const image = preview && !preview.classList.contains('hidden') ? preview.src : '';

      const products = db.get('products', []);
      products.push({
        id: 'p_' + Math.random().toString(36).substr(2, 9),
        title,
        description,
        original_price,
        discounted_price,
        image,
        category,
        created_date: new Date().toISOString()
      });
      db.set('products', products);

      document.getElementById('add-product-modal').remove();
      ut.success(`${title} added to products!`);
      this.renderAdminSubTab();
    },

    deleteProduct(productId) {
      let products = db.get('products', []);
      products = products.filter(p => p.id !== productId);
      db.set('products', products);
      ut.success('Product deleted.');
      this.renderAdminSubTab();
    },

    // -------------------------------------------------------------
    // DEPOSIT ADDRESS CRUD (Admin)
    // -------------------------------------------------------------
    openAddAddressModal() {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'add-address-modal';
      modal.innerHTML = `
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="font-heading font-bold">Add Deposit Address</h3>
            <button class="modal-close" onclick="document.getElementById('add-address-modal').remove()"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body">
            <form onsubmit="app.handleAddAddressSubmit(event)">
              <div class="form-group">
                <label class="form-label" for="add-addr-label">Label</label>
                <input type="text" id="add-addr-label" class="form-input" placeholder="e.g. USDT (BEP20)" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-addr-network">Network Key</label>
                <select id="add-addr-network" class="form-select">
                  <option value="usdt_bep20">USDT BEP20</option>
                  <option value="usdt_trc20">USDT TRC20</option>
                  <option value="btc">Bitcoin (BTC)</option>
                  <option value="sol">Solana (SOL)</option>
                  <option value="binance_uid">Binance UID</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-addr-subtitle">Subtitle</label>
                <input type="text" id="add-addr-subtitle" class="form-input" placeholder="e.g. Binance Smart Chain" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="add-addr-address">Address / UID</label>
                <input type="text" id="add-addr-address" class="form-input" placeholder="Wallet address or UID" required>
              </div>
              <button type="submit" class="btn btn-primary w-full glow-green mt-2 font-bold">Add Address</button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      lucide.createIcons();
    },

    handleAddAddressSubmit(e) {
      e.preventDefault();
      const label = document.getElementById('add-addr-label').value;
      const network = document.getElementById('add-addr-network').value;
      const subtitle = document.getElementById('add-addr-subtitle').value;
      const address = document.getElementById('add-addr-address').value;

      const addresses = db.get('deposit_addresses', []);
      const newAddr = {
        id: 'da_' + Math.random().toString(36).substr(2, 9),
        label,
        network,
        address,
        subtitle
      };
      addresses.push(newAddr);
      db.set('deposit_addresses', addresses);

      document.getElementById('add-address-modal').remove();
      ut.success(`Address "${label}" added!`);
      this.renderAdminSubTab();
    },

    openEditAddressModal(addrId) {
      const addresses = db.get('deposit_addresses', []);
      const addr = addresses.find(a => a.id === addrId);
      if (!addr) return;

      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'edit-address-modal';
      modal.innerHTML = `
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="font-heading font-bold">Edit Deposit Address</h3>
            <button class="modal-close" onclick="document.getElementById('edit-address-modal').remove()"><i data-lucide="x"></i></button>
          </div>
          <div class="modal-body">
            <form onsubmit="app.handleEditAddressSubmit(event)">
              <input type="hidden" id="edit-addr-id" value="${addr.id}">
              <div class="form-group">
                <label class="form-label" for="edit-addr-label">Label</label>
                <input type="text" id="edit-addr-label" class="form-input" value="${addr.label}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="edit-addr-network">Network Key</label>
                <select id="edit-addr-network" class="form-select">
                  <option value="usdt_bep20" ${addr.network === 'usdt_bep20' ? 'selected' : ''}>USDT BEP20</option>
                  <option value="usdt_trc20" ${addr.network === 'usdt_trc20' ? 'selected' : ''}>USDT TRC20</option>
                  <option value="btc" ${addr.network === 'btc' ? 'selected' : ''}>Bitcoin (BTC)</option>
                  <option value="sol" ${addr.network === 'sol' ? 'selected' : ''}>Solana (SOL)</option>
                  <option value="binance_uid" ${addr.network === 'binance_uid' ? 'selected' : ''}>Binance UID</option>
                  <option value="other" ${addr.network === 'other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="edit-addr-subtitle">Subtitle</label>
                <input type="text" id="edit-addr-subtitle" class="form-input" value="${addr.subtitle || ''}" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="edit-addr-address">Address / UID</label>
                <input type="text" id="edit-addr-address" class="form-input" value="${addr.address}" required>
              </div>
              <button type="submit" class="btn btn-primary w-full glow-green mt-2 font-bold">Save Changes</button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      lucide.createIcons();
    },

    handleEditAddressSubmit(e) {
      e.preventDefault();
      const id = document.getElementById('edit-addr-id').value;
      const label = document.getElementById('edit-addr-label').value;
      const network = document.getElementById('edit-addr-network').value;
      const subtitle = document.getElementById('edit-addr-subtitle').value;
      const address = document.getElementById('edit-addr-address').value;

      const addresses = db.get('deposit_addresses', []);
      const idx = addresses.findIndex(a => a.id === id);
      if (idx === -1) return;

      addresses[idx].label = label;
      addresses[idx].network = network;
      addresses[idx].subtitle = subtitle;
      addresses[idx].address = address;
      db.set('deposit_addresses', addresses);

      document.getElementById('edit-address-modal').remove();
      ut.success(`Address "${label}" updated!`);
      this.renderAdminSubTab();
    },

    deleteDepositAddress(addrId) {
      let addresses = db.get('deposit_addresses', []);
      const addr = addresses.find(a => a.id === addrId);
      if (!addr) return;
      addresses = addresses.filter(a => a.id !== addrId);
      db.set('deposit_addresses', addresses);
      ut.success(`Address "${addr.label}" removed.`);
      this.renderAdminSubTab();
    },

    // 8. 404 View
    view404() {
      const html = `
        <div class="max-w-md mx-auto text-center py-20 font-mono">
          <h1 class="text-7xl font-bold text-muted-foreground opacity-50 mb-2">404</h1>
          <div class="dropdown-divider" style="max-width: 80px; margin: 0.5rem auto 1.5rem auto;"></div>
          <h3 class="font-heading font-semibold text-lg mb-2">System Routing Error</h3>
          <p class="text-muted-foreground text-xs leading-normal mb-8">The requested path does not map to any active node in this application.</p>
          <a href="#/" class="btn btn-primary glow-green font-bold">Return Home</a>
        </div>
      `;
      this.render(html);
    },

    // -------------------------------------------------------------
    // AUTH MODAL LOGIC
    // -------------------------------------------------------------
    openAuthModal() {
      document.getElementById('auth-modal').classList.remove('hidden');
      lucide.createIcons();
    },
    
    closeAuthModal() {
      document.getElementById('auth-modal').classList.add('hidden');
    },
    
    setAuthTab(tab) {
      this.activeAuthTab = tab;
      const tabLogin = document.getElementById('tab-login');
      const tabReg = document.getElementById('tab-register');
      const authTitle = document.getElementById('auth-title');
      const submitBtn = document.getElementById('auth-submit-btn');
      
      if (tab === 'login') {
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
        authTitle.innerText = 'Welcome Back';
        submitBtn.innerText = 'Sign In';
      } else {
        tabLogin.classList.remove('active');
        tabReg.classList.add('active');
        authTitle.innerText = 'Create Account';
        submitBtn.innerText = 'Sign Up';
      }
    },
    
    async handleAuthSubmit(e) {
      e.preventDefault();
      
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      
      if (!email || !password) return;
      
      if (this.activeAuthTab === 'login') {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          ut.error(error.message);
          return;
        }
        
        const user = data.user;
        this.currentUser = { email: user.email, role: 'user' };
        db.set('session_user', this.currentUser);
        
        // Initialize balance to 0.00 for new/resetted accounts if not set
        const balances = db.get('balances', {});
        if (balances[user.email] === undefined) {
          balances[user.email] = 0.00; 
          db.set('balances', balances);
        }
        
        ut.success(`Logged in as ${user.email}`);
        this.closeAuthModal();
        this.updateHeaderUI();
        
        if (this.pendingRedirectRoute) {
          const redirect = this.pendingRedirectRoute;
          this.pendingRedirectRoute = null;
          window.location.hash = redirect;
        } else {
          window.location.hash = '#/account';
        }
        
      } else {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password
        });
        
        if (error) {
          ut.error(error.message);
          return;
        }
        
        const user = data.user;
        // Check if registration was successful or requires verification
        if (user) {
          this.currentUser = { email: user.email, role: 'user' };
          db.set('session_user', this.currentUser);
          
          const balances = db.get('balances', {});
          balances[user.email] = 0.00; // New registers start at $0.00 balance
          db.set('balances', balances);
          
          ut.success("Account created successfully!");
          this.closeAuthModal();
          this.updateHeaderUI();
          
          if (this.pendingRedirectRoute) {
            const redirect = this.pendingRedirectRoute;
            this.pendingRedirectRoute = null;
            window.location.hash = redirect;
          } else {
            window.location.hash = '#/account';
          }
        } else {
          ut.success("Confirmation link sent to your email!");
          this.closeAuthModal();
        }
      }
    },
    
    async logout() {
      await supabaseClient.auth.signOut();
      this.currentUser = null;
      this.adminAuthenticated = false;
      localStorage.removeItem('carding_session_user');
      localStorage.removeItem('carding_admin_authenticated');
      this.updateHeaderUI();
      ut.success("Logged out successfully.");
      window.location.hash = '#/';
    },

    handleTicketSubmit(e) {
      e.preventDefault();
      
      const name = document.getElementById('ticket-name').value.trim();
      const email = document.getElementById('ticket-email').value.trim();
      const subject = document.getElementById('ticket-subject').value;
      const message = document.getElementById('ticket-message').value.trim();
      
      if (!name || !email || !subject || !message) {
        ut.error("Please fill in all fields.");
        return;
      }
      
      if (!subject) {
        ut.error("Please select a subject.");
        return;
      }
      
      const tickets = db.get('tickets', []);
      const ticket = {
        id: 'tkt_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        subject,
        message,
        status: 'open',
        created_date: new Date().toISOString()
      };
      
      tickets.push(ticket);
      db.set('tickets', tickets);
      
      document.getElementById('support-ticket-form').reset();
      
      ut.success("Ticket submitted successfully! We'll get back to you shortly.");
    }
  };

  // Expose app to global window namespace
  window.app = app;

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
})();
