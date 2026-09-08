import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService } from '../services';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
    title: 'Artiva | Reviewed Local Artisan Profiles in Life Camp Abuja',
    description: 'Connect with identity-reviewed local artisan profiles in Life Camp and coordinate protected job payments.'
  },
  find_artisans: {
    title: 'Find Approved Artisan Profiles in Abuja | Artiva',
    description: 'Browse identity-reviewed plumbers, electricians, carpenters, and technicians available for hire in Abuja.'
  },
  how_it_works: {
    title: 'How Artiva Works | Artiva',
    description: 'Learn how Artiva connects clients and approved artisans and tracks job-specific payments.'
  },
  become_artisan: {
    title: 'Become an Artisan — Grow Your Trade Business | Artiva',
    description: 'Join Artiva as a skilled artisan and receive direct local job opportunities with protected payments.'
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
    description: 'Create an Artiva client account or apply as an artisan to manage local service jobs.'
  },
  help_center: {
    title: 'Help Center & FAQs | Artiva Support',
    description: 'Find answers about hiring artisans, posting jobs, job payments, and identity review on Artiva.'
  },
  safety: {
    title: 'Safety & Security Safeguards | Artiva',
    description: 'Learn about identity evidence review, in-app messaging, and job-payment safeguards.'
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
    description: 'Review ranked, approved artisan profiles matched to your job request.'
  },
  checkout: {
    title: 'Job Payment Checkout | Artiva',
    description: 'Initialize the selected job payment through Paystack.'
  },
  chat_screen: {
    title: 'Job Chat & Messaging | Artiva',
    description: 'Communicate directly with the approved artisan assigned to your job.'
  },
  live_tracking: {
    title: 'Artisan Arrival Status | Artiva',
    description: 'See whether your artisan is awaiting departure, on the way, or has arrived.'
  },
  not_found: {
    title: 'Page Not Found (404) | Artiva',
    description: 'The requested page could not be found. Return to Artiva home.'
  }
};

export function AppProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState(() => pathScreens[window.location.pathname] || 'home');
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [userRole, setUserRole] = useState('client');
  const [activeJob, setActiveJob] = useState(null);
  const [activeArtisan, setActiveArtisan] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    ApiService.init();
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setUserRole('client');
        setAuthReady(true);
        return;
      }
      try {
        const user = await ApiService.getMe();
        setCurrentUser(user);
        setUserRole(user.role);
      } catch {
        setCurrentUser(null);
        setUserRole('client');
      } finally {
        setAuthReady(true);
      }
    });
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

  const logout = async () => {
    setCurrentUser(null);
    setUserRole('client');
    setActiveJob(null);
    setActiveArtisan(null);
    setActiveMatchId(null);
    setCurrentScreen('onboarding');
    try {
      await ApiService.logout();
    } catch {
      // Local state is still cleared when Firebase sign-out is unavailable.
    }
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
    authReady,
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
