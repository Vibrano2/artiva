import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService } from '../services';
import { auth } from '../config/firebase';

const AppContext = createContext();

const screenPaths = {
  home: '/',
  find_artisans: '/find-artisans',
  how_it_works: '/how-it-works',
  become_artisan: '/become-an-artisan',
  jobs_board: '/jobs',
  about_us: '/about',
  login: '/login',
  signup: '/signup',
  help_center: '/help-center',
  safety: '/safety-security',
  terms: '/terms',
  privacy: '/privacy',
};

const pathScreens = Object.fromEntries(
  Object.entries(screenPaths).map(([screen, path]) => [path, screen])
);

const screenMetadata = {
  home: {
    title: 'Artiva — Verified Local Artisans | Life Camp Abuja',
    description: 'Connect with verified, NIN-checked local artisans in Life Camp. Fast, protected escrow jobs.'
  },
  find_artisans: {
    title: 'Find Verified Artisans in Abuja | Artiva',
    description: 'Browse background-checked plumbers, electricians, carpenters, and technicians available for hire in Abuja.'
  },
  how_it_works: {
    title: 'How It Works — Escrow & Verification | Artiva',
    description: 'Learn how Artiva connects clients and artisans with secure pay-per-job escrow protection and NIN verification.'
  },
  become_artisan: {
    title: 'Become an Artisan — Grow Your Trade Business | Artiva',
    description: 'Join Artiva as a skilled artisan. Receive direct local jobs with guaranteed on-time escrow payouts.'
  },
  jobs_board: {
    title: 'Jobs & Requests | Artiva',
    description: 'Explore active repair and maintenance job requests from homeowners in your area.'
  },
  about_us: {
    title: 'About Us — 25 Years Contracting Experience | Artiva',
    description: 'Discover how Artiva was founded to bring trust, safety, and escrow reliability to home-repair services across Nigeria.'
  },
  login: {
    title: 'Log In | Artiva',
    description: 'Sign in to your Artiva account with your phone number and secure verification code.'
  },
  signup: {
    title: 'Sign Up | Artiva',
    description: 'Create an Artiva client or artisan account to get started with verified local home services.'
  },
  help_center: {
    title: 'Help Center & FAQs | Artiva Support',
    description: 'Find quick answers about hiring artisans, posting jobs, escrow payments, and identity verification on Artiva.'
  },
  safety: {
    title: 'Safety & Security Safeguards | Artiva',
    description: 'Learn about our NIN verification checks, in-app messaging safeguards, and escrow payment protections.'
  },
  terms: {
    title: 'Terms of Service | Artiva',
    description: 'Read the Artiva Terms of Service for clients and artisans using our marketplace.'
  },
  privacy: {
    title: 'Privacy Policy | Artiva',
    description: 'Read how Artiva protects your personal information, NDPR compliance, and data privacy.'
  },
  client_dash: {
    title: 'Client Dashboard | Artiva',
    description: 'Manage your active jobs, explore artisans, and view matches on your client dashboard.'
  },
  artisan_dash: {
    title: 'Artisan Dashboard | Artiva',
    description: 'Manage incoming job leads, earnings, reputation score, and availability.'
  },
  post_job: {
    title: 'Post a Job Request | Artiva',
    description: 'Post your repair or maintenance job in 60 seconds to get matched with top-rated nearby artisans.'
  },
  match_list: {
    title: 'Matched Artisans | Artiva',
    description: 'Review ranked, verified artisans matched to your job request.'
  },
  checkout: {
    title: 'Escrow Checkout | Artiva',
    description: 'Fund your job safely with Paystack escrow protection.'
  },
  chat_screen: {
    title: 'Job Chat & Messaging | Artiva',
    description: 'Communicate directly with your assigned verified artisan.'
  },
  live_tracking: {
    title: 'Live Artisan Tracking | Artiva',
    description: 'Track your artisan en route to your location in real time.'
  },
  not_found: {
    title: 'Page Not Found (404) | Artiva',
    description: 'The requested page could not be found. Return to Artiva home.'
  }
};

export function AppProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState(() => pathScreens[window.location.pathname] || 'home');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('client');
  const [activeJob, setActiveJob] = useState(null);
  const [activeArtisan, setActiveArtisan] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    ApiService.init();
    try {
      const storedUser = localStorage.getItem('artiva_current_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        setUserRole(parsed.role || 'client');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const meta = screenMetadata[currentScreen] || screenMetadata.home;
    document.title = meta.title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', meta.description);
  }, [currentScreen]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentScreen(pathScreens[window.location.pathname] || 'home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3500);
  };

  const navigateTo = (screen, params = {}) => {
    if (params.job) setActiveJob(params.job);
    if (params.artisan) setActiveArtisan(params.artisan);
    if (params.matchId) setActiveMatchId(params.matchId);
    setCurrentScreen(screen);
    const path = screenPaths[screen];
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logout = () => {
    localStorage.removeItem('artiva_current_user');
    setCurrentUser(null);
    setUserRole('client');
    setActiveJob(null);
    setActiveArtisan(null);
    setActiveMatchId(null);
    setCurrentScreen('onboarding');
    auth.signOut().catch(console.error);
    showToast('Logged out successfully', 'info');
  };

  useEffect(() => {
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      localStorage.setItem('artiva_last_activity', Date.now().toString());
      if (currentUser) {
        inactivityTimer = setTimeout(() => {
          logout();
          showToast('Session expired due to inactivity', 'warning');
        }, 30 * 60 * 1000); // 30 minutes
      }
    };

    if (currentUser) {
      const lastActivity = localStorage.getItem('artiva_last_activity');
      if (lastActivity && Date.now() - parseInt(lastActivity, 10) > 30 * 60 * 1000) {
        logout();
        showToast('Session expired', 'warning');
        return;
      }
      
      resetTimer();
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      const handleActivity = () => resetTimer();
      events.forEach(event => document.addEventListener(event, handleActivity, { passive: true }));
      
      return () => {
        clearTimeout(inactivityTimer);
        events.forEach(event => document.removeEventListener(event, handleActivity));
      };
    }
  }, [currentUser]);

  const value = {
    currentScreen,
    setCurrentScreen,
    navigateTo,
    currentUser,
    setCurrentUser,
    userRole,
    setUserRole,
    activeJob,
    setActiveJob,
    activeArtisan,
    setActiveArtisan,
    activeMatchId,
    setActiveMatchId,
    isOffline,
    setIsOffline,
    toast,
    showToast,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
