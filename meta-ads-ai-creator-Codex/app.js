const AUTH_STORAGE_KEY = 'metaAdsUserProfile';
const SUPABASE_CONFIG = {
    url: typeof window !== 'undefined' ? (window.SUPABASE_URL || '').trim() : '',
    anonKey: typeof window !== 'undefined' ? (window.SUPABASE_ANON_KEY || '').trim() : ''
};

let supabaseClient = null;
let currentSession = null;
let currentUserProfile = null;
let authMode = 'signup';
let campaignStore = [];

// Application Data
const appData = {
  "campaign_objectives": [
    {
      "id": "awareness",
      "name": "Reconocimiento",
      "description": "Aumenta el conocimiento de tu marca",
      "icon": "???",
      "subcategories": ["Alcance", "Impresiones de marca"],
      "recommended_budget": "10-50",
      "ideal_for": "Lanzamientos de marca, nuevos productos"
    },
    {
      "id": "traffic", 
      "name": "Tr�fico",
      "description": "Dirige personas a tu sitio web",
      "icon": "??",
      "subcategories": ["Clics al enlace", "Visualizaciones de p�gina"],
      "recommended_budget": "15-75",
      "ideal_for": "E-commerce, blogs, landing pages"
    },
    {
      "id": "engagement",
      "name": "Interacci�n", 
      "description": "Aumenta likes, comentarios y compartidos",
      "icon": "??",
      "subcategories": ["Me gusta de p�gina", "Interacciones con publicaciones"],
      "recommended_budget": "5-30",
      "ideal_for": "Construcci�n de comunidad, contenido viral"
    },
    {
      "id": "leads",
      "name": "Clientes Potenciales",
      "description": "Recopila informaci�n de contacto", 
      "icon": "??",
      "subcategories": ["Generaci�n de clientes potenciales", "Mensajes"],
      "recommended_budget": "20-100",
      "ideal_for": "B2B, servicios, suscripciones"
    },
    {
      "id": "app_promotion",
      "name": "Promoci�n de App",
      "description": "Aumenta instalaciones y uso de tu app",
      "icon": "??", 
      "subcategories": ["Instalaciones de aplicaci�n", "Eventos en aplicaci�n"],
      "recommended_budget": "25-150",
      "ideal_for": "Apps m�viles, juegos, SaaS"
    },
    {
      "id": "sales",
      "name": "Ventas",
      "description": "Impulsa compras y conversiones",
      "icon": "??",
      "subcategories": ["Conversiones", "Ventas del cat�logo"],
      "recommended_budget": "30-500",
      "ideal_for": "E-commerce, tiendas online, servicios"
    }
  ],
  "targeting_interests": [
    {
      "category": "Tecnolog�a",
      "interests": ["Smartphones", "Gadgets", "Innovaci�n", "Inteligencia Artificial", "Apps m�viles", "Gaming"]
    },
    {
      "category": "Moda y Belleza", 
      "interests": ["Moda femenina", "Moda masculina", "Cosm�ticos", "Cuidado de la piel", "Tendencias", "Streetwear"]
    },
    {
      "category": "Deportes y Fitness",
      "interests": ["Fitness", "Yoga", "Running", "Nutrici�n", "Gym", "Deportes extremos"]
    },
    {
      "category": "Viajes y Turismo",
      "interests": ["Viajes internacionales", "Hoteles", "Aventura", "Gastronom�a", "Cultura", "Playa"]
    },
    {
      "category": "Negocios y Finanzas",
      "interests": ["Emprendimiento", "Inversiones", "Marketing Digital", "Educaci�n online", "Fintech", "Criptomonedas"]
    },
    {
      "category": "Entretenimiento",
      "interests": ["M�sica", "Cine", "Series", "Streaming", "Conciertos", "Festivales"]
    }
  ],
  "creative_styles": [
    {
      "id": "minimal",
      "name": "Minimalista",
      "description": "Dise�o limpio y simple",
      "preview_color": "#F8F9FA"
    },
    {
      "id": "modern",
      "name": "Moderno", 
      "description": "Tendencias actuales y fresh",
      "preview_color": "#6C63FF"
    },
    {
      "id": "elegant",
      "name": "Elegante",
      "description": "Sofisticado y premium",
      "preview_color": "#2C3E50"
    },
    {
      "id": "vibrant",
      "name": "Vibrante",
      "description": "Colores llamativos y energ�ticos", 
      "preview_color": "#FF6B6B"
    },
    {
      "id": "professional",
      "name": "Profesional",
      "description": "Corporativo y confiable",
      "preview_color": "#34495E"
    }
  ],
  "cta_options": [
    "Comprar ahora",
    "M�s informaci�n", 
    "Registrarse",
    "Descargar",
    "Contactar",
    "Ver m�s",
    "Solicitar presupuesto",
    "Probar gratis",
    "Reservar ahora",
    "Suscribirse"
  ],
  "sample_campaigns": [
    {
      "id": 1,
      "name": "Campa�a Zapatos Deportivos",
      "objective": "sales",
      "status": "active",
      "budget": 45,
      "impressions": 12540,
      "clicks": 892,
      "ctr": 7.1,
      "cpm": 3.58,
      "conversions": 23,
      "roas": 4.2,
      "created_date": "2025-09-10"
    },
    {
      "id": 2, 
      "name": "Lanzamiento App Fitness",
      "objective": "app_promotion",
      "status": "active",
      "budget": 75,
      "impressions": 8420,
      "clicks": 634,
      "ctr": 7.5,
      "cpm": 8.91,
      "conversions": 89,
      "roas": 3.8,
      "created_date": "2025-09-08"
    },
    {
      "id": 3,
      "name": "Curso Marketing Digital",
      "objective": "leads", 
      "status": "paused",
      "budget": 30,
      "impressions": 5670,
      "clicks": 234,
      "ctr": 4.1,
      "cpm": 5.29,
      "conversions": 12,
      "roas": 2.1,
      "created_date": "2025-09-05"
    }
  ]
};

campaignStore = Array.isArray(appData.sample_campaigns) ? [...appData.sample_campaigns] : [];
supabaseClient = initializeSupabaseClient();

function initializeSupabaseClient() {
    if (typeof window === 'undefined' || typeof window.supabase === 'undefined') {
        console.warn('Supabase SDK no disponible, se usara modo local.');
        return null;
    }

    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey ||
        SUPABASE_CONFIG.url.includes('TU-PROYECTO') ||
        SUPABASE_CONFIG.anonKey.includes('SUPABASE_ANON_KEY')) {
        console.warn('Configura SUPABASE_URL y SUPABASE_ANON_KEY en index.html antes de continuar.');
        return null;
    }

    try {
        const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        console.log('Supabase client inicializado');
        return client;
    } catch (error) {
        console.error('No fue posible inicializar Supabase', error);
        return null;
    }
}

function buildProfileFromSupabaseUser(user) {
    if (!user) {
        return null;
    }

    const meta = user.user_metadata || {};
    const fullName = meta.full_name || (user.email ? user.email\.split('@')[0] : 'Usuario');

    return {
        id: user.id,
        email: user.email,
        fullName,
        metadata: meta
    };
}

async function hydrateSessionFromSupabase() {
    if (!supabaseClient) {
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
            throw error;
        }

        if (data?.session?.user) {
            await handleSupabaseSessionChange(data.session);
        } else {
            lockAppForRegistration();
        }
    } catch (error) {
        console.error('No fue posible recuperar la sesion de Supabase', error);
        setAuthMessage('No pudimos validar tu sesion. Inicia sesion nuevamente.', 'error');
        lockAppForRegistration();
    }

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        await handleSupabaseSessionChange(session);
    });
}

function hydrateSessionFromLocalStorage() {
    let storedProfile = null;

    try {
        storedProfile = localStorage.getItem(AUTH_STORAGE_KEY);
    } catch (error) {
        console.warn('No es posible acceder a localStorage. El registro se solicitara en cada visita.', error);
    }

    if (storedProfile) {
        try {
            const parsed = JSON.parse(storedProfile);
            if (parsed && parsed.fullName && parsed.email) {
                currentUserProfile = parsed;
                completeAuthentication(parsed);
                return;
            }
        } catch (error) {
            console.warn('Perfil almacenado invalido, se eliminara.', error);
            try {
                localStorage.removeItem(AUTH_STORAGE_KEY);
            } catch (removeError) {
                console.warn('No fue posible limpiar el perfil almacenado.', removeError);
            }
        }
    }

    lockAppForRegistration();
}

async function handleSupabaseSessionChange(session) {
    if (session?.user) {
        currentSession = session;
        currentUserProfile = buildProfileFromSupabaseUser(session.user);
        if (currentUserProfile) {
            completeAuthentication(currentUserProfile);
            await syncCampaignsFromSupabase();
        }
    } else {
        currentSession = null;
        currentUserProfile = null;
        setCampaignStore(Array.isArray(appData.sample_campaigns) ? [...appData.sample_campaigns] : []);
        lockAppForRegistration();
    }
}

function toggleAuthMode(forceMode) {
    const authForm = document.getElementById('authForm');
    if (!authForm) {
        return;
    }

    const targetMode = forceMode || (authMode === 'signup' ? 'login' : 'signup');
    authMode = targetMode;
    authForm.dataset.mode = targetMode;

    const titleEl = document.getElementById('authTitle');
    const subtitleEl = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const switchText = document.getElementById('authSwitchText');
    const switchBtn = document.getElementById('authSwitchBtn');
    const nameField = authForm.querySelector('.auth-field--name');
    const nameInput = document.getElementById('fullName');
    const termsContainer = document.getElementById('termsContainer');
    const termsCheckbox = document.getElementById('terms');
    const passwordInput = document.getElementById('password');

    if (targetMode === 'login') {
        if (titleEl) titleEl.textContent = 'Bienvenido de nuevo';
        if (subtitleEl) subtitleEl.textContent = 'Inicia sesion para continuar creando campanas inteligentes.';
        if (submitBtn) submitBtn.textContent = 'Iniciar sesion';
        if (switchText) switchText.textContent = 'Aun no tienes cuenta?';
        if (switchBtn) switchBtn.textContent = 'Crear cuenta';
        if (nameField) nameField.classList.add('auth-hidden');
        if (nameInput) nameInput.required = false;
        if (termsContainer) termsContainer.classList.add('auth-hidden');
        if (termsCheckbox) {
            termsCheckbox.required = false;
            termsCheckbox.checked = false;
        }
        if (passwordInput) passwordInput.setAttribute('autocomplete', 'current-password');
    } else {
        if (titleEl) titleEl.textContent = 'Bienvenido a MetaAds AI Creator';
        if (subtitleEl) subtitleEl.textContent = 'Registra tu cuenta para comenzar a crear campanas inteligentes.';
        if (submitBtn) submitBtn.textContent = 'Crear cuenta y continuar';
        if (switchText) switchText.textContent = 'Ya tienes cuenta?';
        if (switchBtn) switchBtn.textContent = 'Iniciar sesion';
        if (nameField) nameField.classList.remove('auth-hidden');
        if (nameInput) nameInput.required = true;
        if (termsContainer) termsContainer.classList.remove('auth-hidden');
        if (termsCheckbox) termsCheckbox.required = true;
        if (passwordInput) passwordInput.setAttribute('autocomplete', 'new-password');
    }

    clearAuthMessage();
}

function setAuthMessage(message, type = 'info') {
    const messageEl = document.getElementById('authMessage');
    if (!messageEl) {
        return;
    }

    if (!message) {
        clearAuthMessage();
        return;
    }

    messageEl.textContent = message;
    messageEl.className = 'auth-message';
    messageEl.classList.add('is-visible');
    messageEl.classList.add(`auth-message--${type}`);
    messageEl.removeAttribute('hidden');
}

function clearAuthMessage() {
    const messageEl = document.getElementById('authMessage');
    if (!messageEl) {
        return;
    }

    messageEl.textContent = '';
    messageEl.className = 'auth-message';
    messageEl.setAttribute('hidden', 'hidden');
}

function setAuthLoading(isLoading) {
    const submitBtn = document.getElementById('authSubmitBtn');
    if (!submitBtn) {
        return;
    }

    if (isLoading) {
        if (!submitBtn.dataset.originalLabel) {
            submitBtn.dataset.originalLabel = submitBtn.innerHTML;
        }
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
    } else {
        const original = submitBtn.dataset.originalLabel;
        if (original) {
            submitBtn.innerHTML = original;
        } else {
            submitBtn.textContent = authMode === 'login' ? 'Iniciar sesion' : 'Crear cuenta y continuar';
        }
        submitBtn.disabled = false;
        delete submitBtn.dataset.originalLabel;
    }
}

function openUserMenu() {
    const menu = document.getElementById('userMenu');
    const toggle = document.getElementById('userMenuToggle');
    if (menu && toggle) {
        menu.removeAttribute('hidden');
        toggle.setAttribute('aria-expanded', 'true');
    }
}

function closeUserMenu() {
    const menu = document.getElementById('userMenu');
    const toggle = document.getElementById('userMenuToggle');
    if (menu) {
        menu.setAttribute('hidden', 'hidden');
    }
    if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
    }
}

function addCampaignToStore(campaign) {
    if (!campaign) {
        return;
    }

    campaignStore.unshift(campaign);
    refreshCampaignDataView();
}

function setCampaignStore(campaigns) {
    campaignStore = Array.isArray(campaigns) ? [...campaigns] : [];
    refreshCampaignDataView();
}

function getCampaignStore() {
    return campaignStore;
}

function refreshCampaignDataView() {
    loadCampaignsTable();
    updateDashboardStats();
}

async function handleLogout() {
    try {
        if (supabaseClient) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                throw error;
            }
        } else {
            try {
                localStorage.removeItem(AUTH_STORAGE_KEY);
            } catch (storageError) {
                console.warn('No fue posible limpiar los datos locales.', storageError);
            }
        }
    } catch (error) {
        console.error('Error al cerrar sesion', error);
    } finally {
        closeUserMenu();
        if (!supabaseClient) {
            currentSession = null;
            currentUserProfile = null;
            setCampaignStore(Array.isArray(appData.sample_campaigns) ? [...appData.sample_campaigns] : []);
            lockAppForRegistration();
        }
        resetCampaignData();
    }
}

// Application State
let currentStep = 1;
let currentSection = 'home';
let campaignData = {
  objective: null,
  audience: {
    ageMin: 18,
    ageMax: 55,
    gender: ['all'],
    interests: [],
    budgetType: 'daily',
    budgetAmount: 25
  },
  creative: {
    productName: '',
    productPrice: '',
    productDescription: '',
    images: [],
    cta: 'Comprar ahora',
    tone: 'professional',
    style: 'modern'
  },
  generatedCreatives: []
};

// Initialize Application
function initializeAuthGate() {
    const overlay = document.getElementById('authOverlay');
    const authForm = document.getElementById('authForm');
    const nav = document.querySelector('.navbar');
    const mainApp = document.getElementById('app');
    const switchBtn = document.getElementById('authSwitchBtn');

    if (!overlay || !authForm || !nav || !mainApp) {
        console.warn('Authentication gate could not find necessary elements.');
        return;
    }

    toggleAuthMode('signup');

    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            toggleAuthMode(authMode === 'signup' ? 'login' : 'signup');
        });
    }

    authForm.addEventListener('submit', async (event) => {
        if (supabaseClient) {
            await handleSupabaseAuthSubmit(event);
        } else {
            handleLocalRegistrationSubmit(event);
        }
    });

    if (supabaseClient) {
        hydrateSessionFromSupabase();
    } else {
        hydrateSessionFromLocalStorage();
    }
}

async function handleSupabaseAuthSubmit(event) {
    event.preventDefault();
    const form = event.target;
    clearAuthMessage();

    const email = (form.email?.value || '').trim().toLowerCase();
    const password = form.password?.value || '';
    const fullName = (form.fullName?.value || '').trim();
    const termsCheckbox = document.getElementById('terms');

    if (!email || !password) {
        setAuthMessage('Ingresa tu correo y contrasena.', 'error');
        return;
    }

    if (authMode === 'signup' && !fullName) {
        setAuthMessage('Ingresa tu nombre completo.', 'error');
        return;
    }

    if (authMode === 'signup' && termsCheckbox && !termsCheckbox.checked) {
        setAuthMessage('Debes aceptar los terminos y condiciones.', 'error');
        return;
    }

    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    setAuthLoading(true);

    try {
        if (authMode === 'signup') {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    },
                    emailRedirectTo: window.location.href
                }
            });

            if (error) {
                throw error;
            }

            if (data.session?.user) {
                await handleSupabaseSessionChange(data.session);
                setAuthMessage('Registro completado correctamente.', 'success');
            } else {
                setAuthMessage('Hemos enviado un correo para confirmar tu cuenta.', 'info');
            }
        } else {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                throw error;
            }
            if (data.session) {
                await handleSupabaseSessionChange(data.session);
            }
        }

        form.reset();
        if (termsCheckbox) {
            termsCheckbox.checked = false;
        }
    } catch (error) {
        console.error('Error de autenticacion', error);
        const message = error?.message || 'No pudimos completar la operacion. Intenta nuevamente.';
        setAuthMessage(message, 'error');
    } finally {
        setAuthLoading(false);
    }
}

function handleLocalRegistrationSubmit(event) {
    event.preventDefault();
    const form = event.target;

    if (authMode === 'login') {
        setAuthMessage('El modo sin Supabase solo permite registro local.', 'info');
        toggleAuthMode('signup');
        return;
    }

    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const fullName = (form.fullName?.value || '').trim();
    const email = (form.email?.value || '').trim().toLowerCase();

    if (!fullName || !email) {
        setAuthMessage('Completa tu nombre y correo para continuar.', 'error');
        return;
    }

    const profile = {
        fullName,
        email,
        createdAt: new Date().toISOString()
    };

    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
        console.error('No fue posible guardar el perfil en el navegador.', error);
    }

    currentUserProfile = profile;
    completeAuthentication(profile);
    form.reset();
}

function lockAppForRegistration() {
    const overlay = document.getElementById('authOverlay');
    const nav = document.querySelector('.navbar');
    const mainApp = document.getElementById('app');
    const navUser = document.getElementById('navUser');
    const authForm = document.getElementById('authForm');
    const termsCheckbox = document.getElementById('terms');

    document.body.classList.remove('authenticated');

    if (nav) {
        nav.setAttribute('hidden', 'hidden');
    }

    if (navUser) {
        navUser.setAttribute('hidden', 'hidden');
        navUser.removeAttribute('title');
    }

    if (mainApp) {
        mainApp.setAttribute('hidden', 'hidden');
    }

    if (authForm) {
        authForm.reset();
    }

    if (termsCheckbox) {
        termsCheckbox.checked = false;
    }

    toggleAuthMode('signup');
    clearAuthMessage();
    closeUserMenu();

    if (overlay) {
        overlay.removeAttribute('hidden');
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';

        const nameInput = overlay.querySelector('#fullName');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 150);
        }
    }
}

function completeAuthentication(profile) {
    const overlay = document.getElementById('authOverlay');
    const nav = document.querySelector('.navbar');
    const mainApp = document.getElementById('app');
    const navUser = document.getElementById('navUser');
    const nameDisplay = document.getElementById('userNameDisplay');
    const menuName = document.getElementById('userMenuName');
    const menuEmail = document.getElementById('userMenuEmail');

    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        overlay.setAttribute('hidden', 'hidden');
    }

    if (nav) {
        nav.removeAttribute('hidden');
    }

    if (mainApp) {
        mainApp.removeAttribute('hidden');
    }

    document.body.classList.add('authenticated');

    const fullName = profile?.fullName || 'Usuario';
    const firstName = getFirstName(fullName);
    const email = profile?.email || '';

    if (navUser) {
        navUser.removeAttribute('hidden');
        navUser.setAttribute('title', email);
    }

    if (nameDisplay) {
        nameDisplay.textContent = firstName;
    }

    if (menuName) {
        menuName.textContent = fullName;
    }

    if (menuEmail) {
        menuEmail.textContent = email;
    }
}

function getFirstName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return 'Usuario';
    }

    const segments = fullName.trim()\.split(/\s+/);
    return segments.length ? segments[0] : 'Usuario';
}
document.addEventListener('DOMContentLoaded', function() {
    console.log('MetaAds AI Creator initializing...');
    
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        initializeAuthGate();
        initializeNavigation();
        initializeCampaignCreator();
        initializeDashboard();
        initializeBiblioteca();
        populateObjectives();
        populateInterests();
        populateCreativeOptions();
        showSection('home');
        console.log('Initialization complete');
    }, 100);
});

// Navigation Functions
function initializeNavigation() {
    console.log('Initializing navigation...');
    
    // Main CTA button - multiple selectors to ensure it works
    const createCampaignBtns = [
        document.getElementById('createCampaignBtn'),
        document.querySelector('.cta-button'),
        document.querySelector('[id="createCampaignBtn"]')
    ].filter(btn => btn !== null);
    
    createCampaignBtns.forEach(btn => {
        if (btn) {
            console.log('Found CTA button:', btn);
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('CTA button clicked!');
                showSection('campaign-creator');
                resetCampaignData();
            });
            
            // Add visual feedback
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        }
    });

    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    console.log('Found nav links:', navLinks.length);
    
    navLinks.forEach((link, index) => {
        console.log(`Setting up nav link ${index}:`, link.getAttribute('href'));
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            console.log('Nav link clicked, target section:', section);
            showSection(section);
        });
    });

    // Mobile toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            console.log('Mobile nav toggle clicked');
            navMenu.classList.toggle('active');
        });
    }

    // Brand click - go home
    const navBrand = document.querySelector('.nav-brand');
    if (navBrand) {
        navBrand.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Brand clicked');
            showSection('home');
        });
        navBrand.style.cursor = 'pointer';
    }

    // Back to home button
    const backToHome = document.getElementById('backToHome');
    if (backToHome) {
        backToHome.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Back to home clicked');
            showSection('home');
        });
    }

    // New campaign button in dashboard
    const newCampaignBtn = document.getElementById('newCampaignBtn');
    if (newCampaignBtn) {
        newCampaignBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('New campaign button clicked');
            showSection('campaign-creator');
            resetCampaignData();
        });
    }


    // User menu interactions
    const userMenuToggle = document.getElementById('userMenuToggle');
    const userMenu = document.getElementById('userMenu');
    const logoutButton = document.getElementById('logoutButton');

    if (userMenuToggle && userMenu && !userMenuToggle.dataset.bound) {
        userMenuToggle.dataset.bound = 'true';

        userMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isExpanded = userMenuToggle.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                closeUserMenu();
            } else {
                openUserMenu();
            }
        });

        if (!document.body.dataset.userMenuDismissBound) {
            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target) && !userMenuToggle.contains(e.target)) {
                    closeUserMenu();
                }
            });
            document.body.dataset.userMenuDismissBound = 'true';
        }
    }

    if (logoutButton && !logoutButton.dataset.bound) {
        logoutButton.dataset.bound = 'true';
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleLogout();
        });
    }

    console.log('Navigation initialization complete');
}

function showSection(sectionName) {
    console.log('Showing section:', sectionName);
    
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    const navMenu = document.querySelector('.nav-menu');

    // Hide all sections
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        currentSection = sectionName;
        console.log('Section displayed:', sectionName);
    } else {
        console.error('Section not found:', sectionName);
        return;
    }

    // Update nav links
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionName}`) {
            link.classList.add('active');
        }
    });

    // Close mobile menu
    if (navMenu) {
        navMenu.classList.remove('active');
    }

    // Initialize section-specific functionality
    if (sectionName === 'dashboard') {
        setTimeout(() => loadDashboardData(), 100);
    }

    if (sectionName === 'campaign-creator') {
        // Reset to step 1
        currentStep = 1;
        updateStepper();
        updateStepContent();
        updateNavigationButtons();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Campaign Creator Functions
function initializeCampaignCreator() {
    console.log('Initializing campaign creator...');
    
    const nextStepBtn = document.getElementById('nextStep');
    const prevStepBtn = document.getElementById('prevStep');
    const generateBtn = document.getElementById('generateCreatives');
    const launchBtn = document.getElementById('launchCampaign');

    // Step navigation
    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Next step clicked');
            nextStep();
        });
    }
    
    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Previous step clicked');
            prevStep();
        });
    }

    // Generate creatives
    if (generateBtn) {
        generateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Generate creatives clicked');
            generateCreatives();
        });
    }

    // Launch campaign
    if (launchBtn) {
        launchBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Launch campaign clicked');
            await launchCampaign(this);
        });
    }

    // Age sliders
    const ageMinSlider = document.getElementById('ageMin');
    const ageMaxSlider = document.getElementById('ageMax');
    if (ageMinSlider && ageMaxSlider) {
        ageMinSlider.addEventListener('input', updateAgeDisplay);
        ageMaxSlider.addEventListener('input', updateAgeDisplay);
    }

    // File upload
    const productImages = document.getElementById('productImages');
    const uploadArea = document.getElementById('uploadArea');
    
    if (productImages) {
        productImages.addEventListener('change', handleFileUpload);
    }
    
    if (uploadArea) {
        uploadArea.addEventListener('click', function(e) {
            e.preventDefault();
            productImages.click();
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#1877F2';
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });
    }

    console.log('Campaign creator initialization complete');
}

function populateObjectives() {
    console.log('Populating objectives...');
    const objectivesGrid = document.getElementById('objectivesGrid');
    if (!objectivesGrid) {
        console.log('Objectives grid not found');
        return;
    }

    objectivesGrid.innerHTML = appData.campaign_objectives.map(objective => `
        <div class="objective-card" data-objective="${objective.id}">
            <div class="objective-header">
                <span class="objective-icon">${objective.icon}</span>
                <h4>${objective.name}</h4>
            </div>
            <p>${objective.description}</p>
            <div class="objective-budget">Presupuesto recomendado: $${objective.recommended_budget}</div>
        </div>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.objective-card').forEach(card => {
        card.addEventListener('click', function() {
            console.log('Objective selected:', this.dataset.objective);
            selectObjective(this.dataset.objective);
        });
        
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.transform = 'translateY(0)';
            }
        });
    });

    console.log('Objectives populated successfully');
}

function selectObjective(objectiveId) {
    console.log('Selecting objective:', objectiveId);
    const objective = appData.campaign_objectives.find(obj => obj.id === objectiveId);
    if (!objective) return;

    campaignData.objective = objective;

    // Update UI
    document.querySelectorAll('.objective-card').forEach(card => {
        card.classList.remove('selected');
        card.style.transform = 'translateY(0)';
    });
    
    const selectedCard = document.querySelector(`[data-objective="${objectiveId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedCard.style.transform = 'translateY(-2px)';
    }

    // Show objective details
    const detailsDiv = document.getElementById('objectiveDetails');
    if (detailsDiv) {
        detailsDiv.innerHTML = `
            <div class="objective-detail-content">
                <h4>${objective.name} - ${objective.description}</h4>
                <p><strong>Ideal para:</strong> ${objective.ideal_for}</p>
                <p><strong>Subcategor�as:</strong> ${objective.subcategories.join(', ')}</p>
                <p><strong>Presupuesto recomendado:</strong> $${objective.recommended_budget} USD</p>
                <div class="success-message">
                    �Perfecto! Este objetivo te ayudar� a ${objective.description.toLowerCase()}
                </div>
            </div>
        `;
    }

    // Enable next button
    updateNextButton();
}

function populateInterests() {
    console.log('Populating interests...');
    const interestsContainer = document.getElementById('interestsContainer');
    if (!interestsContainer) {
        console.log('Interests container not found');
        return;
    }

    interestsContainer.innerHTML = appData.targeting_interests.map(category => `
        <div class="interest-category">
            <div class="category-title">${category.category}</div>
            <div class="interest-tags">
                ${category.interests.map(interest => `
                    <span class="interest-tag" data-interest="${interest}">${interest}</span>
                `).join('')}
            </div>
        </div>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.interest-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            console.log('Interest toggled:', this.dataset.interest);
            toggleInterest(this);
        });
    });

    console.log('Interests populated successfully');
}

function toggleInterest(tagElement) {
    const interest = tagElement.dataset.interest;
    
    if (tagElement.classList.contains('selected')) {
        tagElement.classList.remove('selected');
        campaignData.audience.interests = campaignData.audience.interests.filter(i => i !== interest);
    } else {
        tagElement.classList.add('selected');
        campaignData.audience.interests.push(interest);
    }
    
    console.log('Selected interests:', campaignData.audience.interests);
}

function populateCreativeOptions() {
    console.log('Populating creative options...');
    
    // Populate CTAs
    const ctaSelect = document.getElementById('ctaSelect');
    if (ctaSelect) {
        ctaSelect.innerHTML = appData.cta_options.map(cta => 
            `<option value="${cta}">${cta}</option>`
        ).join('');
    }

    // Populate styles
    const styleSelector = document.getElementById('styleSelector');
    if (styleSelector) {
        styleSelector.innerHTML = appData.creative_styles.map(style => `
            <div class="style-option" data-style="${style.id}">
                <div class="style-preview" style="background: ${style.preview_color}"></div>
                <div class="style-name">${style.name}</div>
                <div class="style-description">${style.description}</div>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.style-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.style-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                campaignData.creative.style = this.dataset.style;
                console.log('Style selected:', this.dataset.style);
            });
        });

        // Select default style
        const defaultStyle = document.querySelector('[data-style="modern"]');
        if (defaultStyle) {
            defaultStyle.classList.add('selected');
            campaignData.creative.style = 'modern';
        }
    }

    console.log('Creative options populated successfully');
}

function updateAgeDisplay() {
    const ageMin = parseInt(document.getElementById('ageMin').value);
    const ageMax = parseInt(document.getElementById('ageMax').value);
    
    // Ensure min is not greater than max
    if (ageMin >= ageMax) {
        document.getElementById('ageMax').value = ageMin + 1;
    }
    
    const finalAgeMin = ageMin;
    const finalAgeMax = parseInt(document.getElementById('ageMax').value);
    
    document.getElementById('ageMinDisplay').textContent = finalAgeMin;
    document.getElementById('ageMaxDisplay').textContent = finalAgeMax;
    
    campaignData.audience.ageMin = finalAgeMin;
    campaignData.audience.ageMax = finalAgeMax;
    
    console.log('Age range updated:', finalAgeMin, '-', finalAgeMax);
}

function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    console.log('Handling files:', files.length);
    const uploadedImagesContainer = document.getElementById('uploadedImages');
    if (!uploadedImagesContainer) {
        return;
    }

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (!imageFiles.length) {
        console.warn('No image files detected');
        return;
    }

    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const previewUrl = e.target.result;
            const imageRecord = createImageRecord(file, previewUrl);
            campaignData.creative.images.push(imageRecord);

            const initialStatus = supabaseClient && currentUserProfile ? 'pending' : 'ready';
            const initialLabel = initialStatus === 'pending' ? 'Preparando' : 'Lista';
            renderUploadedImage(imageRecord, initialStatus, initialLabel);

            if (supabaseClient && currentUserProfile) {
                try {
                    const publicUrl = await uploadImageToSupabase(file, imageRecord.id);
                    if (publicUrl) {
                        imageRecord.publicUrl = publicUrl;
                        updateUploadedImageStatus(imageRecord.id, 'ready', 'Guardada');
                    } else {
                        updateUploadedImageStatus(imageRecord.id, 'ready', 'Lista');
                    }
                } catch (error) {
                    console.error('Error uploading image to Supabase Storage', error);
                    updateUploadedImageStatus(imageRecord.id, 'error', 'Error');
                }
            }
        };
        reader.readAsDataURL(file);
    });
}

function createImageRecord(file, previewUrl) {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        publicUrl: null
    };
}

function renderUploadedImage(imageRecord, status = 'ready', label = 'Lista') {
    const uploadedImagesContainer = document.getElementById('uploadedImages');
    if (!uploadedImagesContainer) {
        return;
    }

    const imageDiv = document.createElement('div');
    imageDiv.className = `uploaded-image uploaded-image--${status}`;
    imageDiv.dataset.imageId = imageRecord.id;
    imageDiv.innerHTML = `
        <img src="${imageRecord.previewUrl}" alt="${imageRecord.name}">
        <button class="remove-image" type="button" aria-label="Eliminar imagen">&times;</button>
        <div class="uploaded-image__status">${label}</div>
    `;
    uploadedImagesContainer.appendChild(imageDiv);

    const removeBtn = imageDiv.querySelector('.remove-image');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeImage(imageRecord.id));
    }
}

function updateUploadedImageStatus(imageId, status, label) {
    const uploadedImagesContainer = document.getElementById('uploadedImages');
    if (!uploadedImagesContainer) {
        return;
    }

    const imageElement = uploadedImagesContainer.querySelector(`[data-image-id="${imageId}"]`);
    if (!imageElement) {
        return;
    }

    imageElement.classList.remove('uploaded-image--pending', 'uploaded-image--ready', 'uploaded-image--error');
    imageElement.classList.add(`uploaded-image--${status}`);

    const statusBadge = imageElement.querySelector('.uploaded-image__status');
    if (statusBadge && typeof label === 'string') {
        statusBadge.textContent = label;
    }
}

function removeImage(imageId) {
    console.log('Removing image:', imageId);
    campaignData.creative.images = campaignData.creative.images.filter(img => img.id !== imageId);

    const uploadedImagesContainer = document.getElementById('uploadedImages');
    if (!uploadedImagesContainer) {
        return;
    }

    const imageElement = uploadedImagesContainer.querySelector(`[data-image-id="${imageId}"]`);
    if (imageElement) {
        imageElement.remove();
    }
}

async function uploadImageToSupabase(file, imageId) {
    if (!supabaseClient || !currentUserProfile) {
        return null;
    }

    const bucket = 'campaign-assets';
    const extension = file.name.includes('.') ? file.name\.split('.').pop() : 'png';
    const sanitizedExtension = extension.replace(/[^a-zA-Z0-9]/g, '') || 'png';
    const filePath = `${currentUserProfile.id}/${Date.now()}-${imageId}.${sanitizedExtension}`;

    const { error } = await supabaseClient.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
    });

    if (error) {
        throw error;
    }

    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);
    return data?.publicUrl || null;\r\n}\r\n\r\nfunction getCreativeImageSource(index) {\r\n    const imageRecord = campaignData.creative.images[index];\r\n    if (!imageRecord) {\r\n        return null;\r\n    }\r\n    return imageRecord.publicUrl || imageRecord.previewUrl || null;\r\n}\r\n\r\nfunction generateCreatives() {
    console.log('Generating creatives...');
    const generateBtn = document.getElementById('generateCreatives');
    const generatedCreatives = document.getElementById('generatedCreatives');
    
    if (!generateBtn || !generatedCreatives) return;

    // Collect form data
    campaignData.creative.productName = document.getElementById('productName')?.value || 'Mi Producto';
    campaignData.creative.productPrice = document.getElementById('productPrice')?.value || '99';
    campaignData.creative.productDescription = document.getElementById('productDescription')?.value || 'Producto incre�ble';
    campaignData.creative.cta = document.getElementById('ctaSelect')?.value || 'Comprar ahora';
    campaignData.creative.tone = document.getElementById('toneSelect')?.value || 'professional';

    // Show loading state
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generando creativos...';
    generateBtn.disabled = true;

    // Simulate AI generation delay
    setTimeout(() => {
        // Generate mock creatives
        const mockCreatives = generateMockCreatives();
        campaignData.generatedCreatives = mockCreatives;
        
        // Display creatives
        generatedCreatives.innerHTML = mockCreatives.map((creative, index) => `
            <div class="creative-preview">
                <div class="creative-image">
                    ${creative.image ? `<img src="${creative.image}" alt="Creative ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;">` : `Creativo ${index + 1}`}
                </div>
                <div class="creative-content">
                    <div class="creative-title">${creative.title}</div>
                    <div class="creative-description">${creative.description}</div>
                    <div class="creative-cta">${creative.cta}</div>
                </div>
            </div>
        `).join('');
        
        generatedCreatives.classList.add('show');
        generatedCreatives.style.display = 'grid';
        
        // Reset button
        generateBtn.innerHTML = '<i class="fas fa-magic"></i> Regenerar Creativos';
        generateBtn.disabled = false;
        
        // Enable next step
        updateNextButton();
        
        console.log('Creatives generated successfully');
        
    }, 2000);
}

function generateMockCreatives() {
    const productName = campaignData.creative.productName || 'Tu Producto';
    const price = campaignData.creative.productPrice || '99';
    const tone = campaignData.creative.tone;
    const cta = campaignData.creative.cta;
    
    const toneVariations = {
        professional: {
            titles: [`${productName} - Calidad Premium`, `Soluci�n Profesional: ${productName}`, `${productName} para Profesionales`],
            descriptions: [`Descubre la excelencia de ${productName}. Dise�ado para quienes buscan calidad.`, `${productName} ofrece rendimiento superior y durabilidad excepcional.`, `La elecci�n inteligente para profesionales exigentes.`]
        },
        casual: {
            titles: [`�${productName} que te encantar�!`, `${productName} - Tu nuevo favorito`, `Conoce ${productName}`],
            descriptions: [`${productName} es perfecto para tu d�a a d�a. �Te va a encantar!`, `S�per f�cil de usar y con resultados incre�bles.`, `�Pru�balo y ver�s la diferencia!`]
        },
        urgent: {
            titles: [`�Oferta Limitada! ${productName}`, `Solo HOY: ${productName}`, `��ltima Oportunidad! ${productName}`],
            descriptions: [`�No te quedes sin ${productName}! Oferta v�lida por tiempo limitado.`, `Solo quedan pocas unidades. �Aprovecha ahora!`, `�Se agota r�pido! Consigue tu ${productName} hoy mismo.`]
        },
        friendly: {
            titles: [`�Hola! Te presentamos ${productName}`, `${productName} - Para ti`, `Tu amigo ${productName}`],
            descriptions: [`Hemos pensado en ti y creamos ${productName}. �Esperamos que te guste!`, `${productName} est� aqu� para hacer tu vida m�s f�cil.`, `Como a un amigo, te recomendamos ${productName}.`]
        },
        luxury: {
            titles: [`${productName} - Exclusivo`, `La elegancia de ${productName}`, `${productName} Premium`],
            descriptions: [`Experimenta la exclusividad de ${productName}. Solo para los m�s exigentes.`, `${productName}: donde el lujo se encuentra con la perfecci�n.`, `Una experiencia �nica con ${productName}.`]
        }
    };
    
    const variations = toneVariations[tone] || toneVariations.professional;
    
    return [
        {
            title: variations.titles[0],
            description: variations.descriptions[0],
            cta: cta,
            image: getCreativeImageSource(0) || null
        },
        {
            title: variations.titles[1],
            description: variations.descriptions[1],
            cta: cta,
            image: getCreativeImageSource(1) || null
        },
        {
            title: variations.titles[2] || `${productName} - Desde $${price}`,
            description: variations.descriptions[2] || `Obt�n ${productName} al mejor precio. Calidad garantizada.`,
            cta: cta,
            image: getCreativeImageSource(2) || null
        }
    ];
}

function nextStep() {
    console.log('Next step requested, current step:', currentStep);
    if (currentStep < 4) {
        // Validate current step
        if (validateStep(currentStep)) {
            currentStep++;
            updateStepper();
            updateStepContent();
            updateNavigationButtons();
            
            if (currentStep === 4) {
                generatePreview();
            }
            
            console.log('Advanced to step:', currentStep);
        }
    }
}

function prevStep() {
    console.log('Previous step requested, current step:', currentStep);
    if (currentStep > 1) {
        currentStep--;
        updateStepper();
        updateStepContent();
        updateNavigationButtons();
        console.log('Went back to step:', currentStep);
    }
}

function validateStep(step) {
    switch(step) {
        case 1:
            if (!campaignData.objective) {
                alert('Por favor selecciona un objetivo de campa�a');
                return false;
            }
            break;
        case 2:
            // Audience validation - basic checks
            if (campaignData.audience.interests.length === 0) {
                alert('Por favor selecciona al menos un inter�s para tu audiencia');
                return false;
            }
            // Update budget data from form
            const budgetType = document.getElementById('budgetType')?.value;
            const budgetAmount = document.getElementById('budgetAmount')?.value;
            if (budgetType) campaignData.audience.budgetType = budgetType;
            if (budgetAmount) campaignData.audience.budgetAmount = parseInt(budgetAmount) || 25;
            break;
        case 3:
            const productName = document.getElementById('productName')?.value?.trim();
            if (!productName) {
                alert('Por favor ingresa el nombre del producto');
                return false;
            }
            if (campaignData.generatedCreatives.length === 0) {
                alert('Por favor genera al menos un creativo con IA');
                return false;
            }
            break;
    }
    return true;
}

function updateStepper() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

function updateStepContent() {
    const panels = document.querySelectorAll('.step-panel');
    panels.forEach((panel, index) => {
        panel.classList.remove('active');
        panel.style.display = 'none';
        
        if (index + 1 === currentStep) {
            panel.classList.add('active');
            panel.style.display = 'block';
        }
    });
}

function updateNavigationButtons() {
    const nextBtn = document.getElementById('nextStep');
    const prevBtn = document.getElementById('prevStep');
    
    if (prevBtn) {
        prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
    }
    
    if (nextBtn) {
        if (currentStep === 4) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-flex';
            nextBtn.innerHTML = 'Siguiente <i class="fas fa-arrow-right"></i>';
        }
    }
}

function updateNextButton() {
    const nextBtn = document.getElementById('nextStep');
    if (nextBtn && validateStepSilent(currentStep)) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('disabled');
    }
}

function validateStepSilent(step) {
    switch(step) {
        case 1: return !!campaignData.objective;
        case 2: return campaignData.audience.interests.length > 0;
        case 3: {
            const productName = document.getElementById('productName')?.value?.trim();
            return productName && campaignData.generatedCreatives.length > 0;
        }
        default: return true;
    }
}

function generatePreview() {
    console.log('Generating preview...');
    updateCampaignSummary();
    updatePerformanceEstimates();
    updateOptimizationChecklist();
}

function updateCampaignSummary() {
    const summaryDiv = document.getElementById('campaignSummary');
    if (!summaryDiv) return;
    
    const objective = campaignData.objective;
    const audience = campaignData.audience;
    const creative = campaignData.creative;
    
    summaryDiv.innerHTML = `
        <div class="summary-item">
            <div class="summary-label">Objetivo</div>
            <div class="summary-value">${objective.name}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Audiencia</div>
            <div class="summary-value">${audience.ageMin}-${audience.ageMax} a�os</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Intereses</div>
            <div class="summary-value">${audience.interests.slice(0, 3).join(', ')}${audience.interests.length > 3 ? '...' : ''}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Presupuesto</div>
            <div class="summary-value">$${audience.budgetAmount} ${audience.budgetType === 'daily' ? 'diario' : 'total'}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Producto</div>
            <div class="summary-value">${creative.productName}</div>
        </div>
        <div class="summary-item">
            <div class="summary-label">Creativos</div>
            <div class="summary-value">${campaignData.generatedCreatives.length} variaciones</div>
        </div>
    `;
}

function updatePerformanceEstimates() {
    const budget = campaignData.audience.budgetAmount;
    const estimatedReach = Math.floor(budget * 150 + Math.random() * 1000);
    const estimatedCPM = (3.5 + Math.random() * 2).toFixed(2);
    const estimatedClicks = Math.floor(estimatedReach * 0.06);
    
    const reachEl = document.getElementById('estimatedReach');
    const cpmEl = document.getElementById('estimatedCPM');
    const clicksEl = document.getElementById('estimatedClicks');
    
    if (reachEl) reachEl.textContent = estimatedReach.toLocaleString();
    if (cpmEl) cpmEl.textContent = `$${estimatedCPM}`;
    if (clicksEl) clicksEl.textContent = estimatedClicks.toLocaleString();
}

function updateOptimizationChecklist() {
    const checklistDiv = document.getElementById('optimizationChecklist');
    if (!checklistDiv) return;
    
    const checks = [
        { text: 'Objetivo de campa�a seleccionado', status: 'good' },
        { text: 'Audiencia configurada correctamente', status: campaignData.audience.interests.length > 2 ? 'good' : 'warning' },
        { text: 'M�ltiples creativos generados', status: campaignData.generatedCreatives.length > 1 ? 'good' : 'warning' },
        { text: 'Presupuesto dentro del rango recomendado', status: 'good' },
        { text: 'Call-to-action optimizado', status: 'good' }
    ];
    
    checklistDiv.innerHTML = checks.map(check => `
        <div class="checklist-item">
            <div class="checklist-icon ${check.status}">
                <i class="fas fa-${check.status === 'good' ? 'check' : 'exclamation'}"></i>
            </div>
            <div class="checklist-text">${check.text}</div>
        </div>
    `).join('');
}

async function launchCampaign(triggerButton) {
    console.log('Launching campaign...');

    const button = triggerButton || document.getElementById('launchCampaign');
    const originalLabel = button ? button.innerHTML : '';

    if (button) {
        button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';
        button.disabled = true;
    }

    try {
        collectCampaignData();
        await saveCampaign();
        showModal('successModal');

        const createAnother = document.getElementById('createAnother');
        const goToDashboard = document.getElementById('goToDashboard');

        if (createAnother) {
            createAnother.onclick = function() {
                hideModal('successModal');
                resetCampaignData();
                currentStep = 1;
                updateStepper();
                updateStepContent();
                updateNavigationButtons();
            };
        }

        if (goToDashboard) {
            goToDashboard.onclick = function() {
                hideModal('successModal');
                showSection('dashboard');
            };
        }
    } catch (error) {
        console.error('No fue posible lanzar la campana', error);
        alert('No pudimos guardar la campana. Intenta nuevamente.');
    } finally {
        if (button) {
            button.innerHTML = originalLabel || '<i class="fas fa-rocket"></i> Lanzar Campana';
            button.disabled = false;
        }
    }
}

function collectCampaignData() {
    const budgetType = document.getElementById('budgetType')?.value;
    const budgetAmount = document.getElementById('budgetAmount')?.value;
    
    if (budgetType) campaignData.audience.budgetType = budgetType;
    if (budgetAmount) campaignData.audience.budgetAmount = parseInt(budgetAmount);
}

async function saveCampaign() {
    const objectiveId = campaignData.objective?.id || 'awareness';
    const baseCampaign = {
        name: campaignData.creative.productName ? `Campana ${campaignData.creative.productName}` : 'Campana MetaAds',
        objective: objectiveId,
        status: 'active',
        budget: Number(campaignData.audience.budgetAmount) || 0,
        impressions: Math.floor(Math.random() * 5000),
        clicks: Math.floor(Math.random() * 500),
        ctr: parseFloat((Math.random() * 5 + 3).toFixed(1)),
        roas: parseFloat((Math.random() * 3 + 2).toFixed(1)),
        created_at: new Date().toISOString(),
        details: {
            objective: campaignData.objective,
            audience: campaignData.audience,
            creative: {
                ...campaignData.creative,
                images: campaignData.creative.images.map(image => ({
                    id: image.id,
                    name: image.name,
                    url: image.publicUrl || image.previewUrl
                }))
            },
            generatedCreatives: campaignData.generatedCreatives
        }
    };

    if (supabaseClient && currentUserProfile) {
        try {
            const persisted = await saveCampaignToSupabase(baseCampaign);
            if (persisted) {
                addCampaignToStore(persisted);
                console.log('Campaign stored in Supabase:', persisted);
                return persisted;
            }
        } catch (error) {
            console.error('No se pudo guardar la campana en Supabase', error);
        }
    }

    const fallback = {
        id: Date.now(),
        ...baseCampaign,
        created_date: new Date().toISOString()\.split('T')[0]
    };

    addCampaignToStore(fallback);
    console.log('Campaign saved locally:', fallback);
    return fallback;
}

async function saveCampaignToSupabase(baseCampaign) {
    const payload = {
        user_id: currentUserProfile.id,
        name: baseCampaign.name,
        objective: baseCampaign.objective,
        status: baseCampaign.status,
        budget: baseCampaign.budget,
        impressions: baseCampaign.impressions,
        clicks: baseCampaign.clicks,
        ctr: baseCampaign.ctr,
        roas: baseCampaign.roas,
        created_at: baseCampaign.created_at,
        details: baseCampaign.details
    };

    const { data, error } = await supabaseClient
        .from('campaigns')
        .insert(payload)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return mapSupabaseCampaign(data);
}

function mapSupabaseCampaign(record) {
    if (!record) {
        return null;
    }

    return {
        id: record.id,
        name: record.name || 'Campana MetaAds',
        objective: record.objective || 'awareness',
        status: record.status || 'active',
        budget: Number(record.budget) || 0,
        impressions: Number(record.impressions) || 0,
        clicks: Number(record.clicks) || 0,
        ctr: typeof record.ctr === 'number' ? record.ctr : Number(record.ctr || 0),
        roas: typeof record.roas === 'number' ? record.roas : Number(record.roas || 0),
        created_date: record.created_at ? record.created_at\.split('T')[0] : new Date().toISOString()\.split('T')[0],
        details: record.details || null
    };
}

async function syncCampaignsFromSupabase() {
    if (!supabaseClient || !currentUserProfile) {
        setCampaignStore(Array.isArray(appData.sample_campaigns) ? [...appData.sample_campaigns] : []);
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('campaigns')
            .select('*')
            .eq('user_id', currentUserProfile.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        const mapped = (data || []).map(mapSupabaseCampaign).filter(Boolean);
        if (mapped.length) {
            setCampaignStore(mapped);
        } else {
            setCampaignStore([...appData.sample_campaigns]);
        }
    } catch (error) {
        console.error('No fue posible sincronizar las campanas desde Supabase', error);
        setCampaignStore([...appData.sample_campaigns]);
    }
}

function resetCampaignData() {
    console.log('Resetting campaign data...');
    
    campaignData = {
        objective: null,
        audience: {
            ageMin: 18,
            ageMax: 55,
            gender: ['all'],
            interests: [],
            budgetType: 'daily',
            budgetAmount: 25
        },
        creative: {
            productName: '',
            productPrice: '',
            productDescription: '',
            images: [],
            cta: 'Comprar ahora',
            tone: 'professional',
            style: 'modern'
        },
        generatedCreatives: []
    };
    
    // Reset form fields
    const forms = document.querySelectorAll('input, select, textarea');
    forms.forEach(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = field.id === 'genderAll';
        } else if (field.type === 'range') {
            if (field.id === 'ageMin') field.value = 18;
            if (field.id === 'ageMax') field.value = 55;
        } else {
            field.value = '';
        }
    });
    
    // Reset specific values
    const budgetAmount = document.getElementById('budgetAmount');
    if (budgetAmount) budgetAmount.value = '25';
    
    // Reset UI selections
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    
    const uploadedImages = document.getElementById('uploadedImages');
    if (uploadedImages) uploadedImages.innerHTML = '';
    
    const generatedCreatives = document.getElementById('generatedCreatives');
    if (generatedCreatives) {
        generatedCreatives.classList.remove('show');
        generatedCreatives.style.display = 'none';
    }
    
    // Reset age display
    updateAgeDisplay();
}

// Dashboard Functions
function initializeDashboard() {
    console.log('Initializing dashboard...');
    // Dashboard initialization is handled in navigation
}

function loadDashboardData() {
    console.log('Loading dashboard data...');
    loadCampaignsTable();
    loadPerformanceChart();
    updateDashboardStats();
}

function loadCampaignsTable() {
    const campaignsTable = document.getElementById('campaignsTable');
    if (!campaignsTable) return;

    const campaigns = getCampaignStore();

    if (!campaigns.length) {
        campaignsTable.innerHTML = '<div class="empty-state">Aun no tienes campanas guardadas.</div>';
        return;
    }

    const rows = campaigns.map(campaign => {
        const statusValue = campaign.status || 'active';
        const statusLabel = statusValue === 'active' ? 'Activa' : 'Pausada';
        const objectiveName = getObjectiveName(campaign.objective);
        const impressions = Number(campaign.impressions) || 0;
        const ctrValue = typeof campaign.ctr === 'number' ? campaign.ctr : Number(campaign.ctr || 0);
        const roasValue = typeof campaign.roas === 'number' ? campaign.roas : Number(campaign.roas || 0);
        const budgetValue = Number(campaign.budget || 0);
        const createdDate = campaign.created_date || (campaign.created_at ? campaign.created_at\.split('T')[0] : new Date().toISOString()\.split('T')[0]);

        return `
            <tr>
                <td>${campaign.name}</td>
                <td>${objectiveName}</td>
                <td><span class="status-badge ${statusValue}">${statusLabel}</span></td>
                <td>$${budgetValue.toLocaleString()}</td>
                <td>${impressions.toLocaleString()}</td>
                <td>${ctrValue.toFixed(1)}%</td>
                <td>${roasValue.toFixed(1)}x</td>
                <td>${formatDate(createdDate)}</td>
            </tr>
        `;
    }).join('');

    campaignsTable.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Campana</th>
                    <th>Objetivo</th>
                    <th>Estado</th>
                    <th>Presupuesto</th>
                    <th>Impresiones</th>
                    <th>CTR</th>
                    <th>ROAS</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

function getObjectiveName(objectiveId) {
    const objective = appData.campaign_objectives.find(obj => obj.id === objectiveId);
    return objective ? objective.name : objectiveId;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function loadPerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not available, skipping chart creation');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.dashboardChart) {
        window.dashboardChart.destroy();
    }
    
    window.dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mi�', 'Jue', 'Vie', 'S�b', 'Dom'],
            datasets: [
                {
                    label: 'Impresiones',
                    data: [3200, 4100, 3800, 5200, 4800, 3900, 4500],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Clics',
                    data: [180, 240, 220, 310, 280, 230, 270],
                    borderColor: '#FFC185',
                    backgroundColor: 'rgba(255, 193, 133, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateDashboardStats() {
    const campaigns = getCampaignStore();
    const totalImpressions = campaigns.reduce((sum, campaign) => sum + (Number(campaign.impressions) || 0), 0);
    const totalClicks = campaigns.reduce((sum, campaign) => sum + (Number(campaign.clicks) || 0), 0);
    const totalSpend = campaigns.reduce((sum, campaign) => sum + (Number(campaign.budget) || 0), 0);
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

    const totalCampaignsEl = document.getElementById('totalCampaigns');
    const totalSpendEl = document.getElementById('totalSpend');
    const totalImpressionsEl = document.getElementById('totalImpressions');
    const avgCTREl = document.getElementById('avgCTR');

    if (totalCampaignsEl) totalCampaignsEl.textContent = campaigns.filter(c => (c.status || 'active') === 'active').length;
    if (totalSpendEl) totalSpendEl.textContent = `${totalSpend.toLocaleString()}`;
    if (totalImpressionsEl) {
        totalImpressionsEl.textContent = totalImpressions >= 1000 ? `${(totalImpressions / 1000).toFixed(1)}K` : totalImpressions.toLocaleString();
    }
    if (avgCTREl) avgCTREl.textContent = `${avgCTR}%`;
}

// Biblioteca Functions
function initializeBiblioteca() {
    console.log('Initializing biblioteca...');
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            console.log('Tab clicked:', targetTab);
            
            // Update tab buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
            }
        });
    });
    
    console.log('Biblioteca initialization complete');
}

// Modal Functions
function showModal(modalId) {
    console.log('Showing modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

function hideModal(modalId) {
    console.log('Hiding modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Close modals when clicking backdrop
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-backdrop')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }
});

// Global functions for template buttons
window.showSection = showSection;
window.removeImage = removeImage;

console.log('MetaAds AI Creator loaded successfully');











