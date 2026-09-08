import React from 'react';
import { useApp } from './context/AppContext';
import { Toast } from './components';
import {
  HomeScreen,
  FindArtisansPage,
  HowItWorksPage,
  BecomeArtisanPage,
  AboutUsPage,
  HelpCenterPage,
  SafetyPage,
  LegalPage,
  NotFoundPage,
  OnboardingScreen,
  AuthScreen,
  LoginPage,
  SignUpPage,
  ClientDashboardScreen,
  PostJobScreen,
  MatchListScreen,
  PaystackCheckoutModal,
  JobCompletionRatingModal,
  LiveTrackingScreen,
  ChatScreen,
  ArtisanSignupScreen,
  VerificationPendingScreen,
  ArtisanDashboardScreen,
  AdminQueueScreen,
  AdminDashboardScreen,
  AdminProformaQueueScreen,
  ClientArtisanProfileScreen,
  ArtisanProformaScreen,
} from './screens';

const PROTECTED_SCREENS = new Set([
  'client_dash',
  'artisan_dash',
  'post_job',
  'match_list',
  'checkout',
  'complete_rating',
  'artisan_pending',
  'artisan_proforma',
  'admin_queue',
  'admin_dash',
  'admin_proforma',
  'chat_screen',
  'live_tracking',
]);

export function AppContent() {
  const { currentScreen, userRole, currentUser, activeJob, activeArtisan, authReady } = useApp();

  const renderScreen = () => {
    if (!authReady) {
      return <div className="min-h-screen bg-[#F4F8F8] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#16858F] border-t-transparent rounded-full animate-spin" /></div>;
    }
    if (PROTECTED_SCREENS.has(currentScreen) && !currentUser) {
      return <LoginPage />;
    }
    if (currentScreen.startsWith('admin_') && currentUser?.role !== 'admin') {
      return currentUser?.role === 'artisan' ? <ArtisanDashboardScreen /> : <LoginPage />;
    }
    if (currentScreen.startsWith('artisan_') && !['artisan', 'admin'].includes(currentUser?.role)) {
      return currentUser ? <ClientDashboardScreen /> : <LoginPage />;
    }
    if (['client_dash', 'post_job', 'match_list', 'checkout', 'complete_rating'].includes(currentScreen)
      && !['client', 'admin'].includes(currentUser?.role)) {
      return currentUser ? <ArtisanDashboardScreen /> : <LoginPage />;
    }

    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'find_artisans':
        return <FindArtisansPage />;
      case 'how_it_works':
        return <HowItWorksPage />;
      case 'become_artisan':
        return <BecomeArtisanPage />;
      case 'about_us':
        return <AboutUsPage />;
      case 'help_center':
        return <HelpCenterPage />;
      case 'safety':
        return <SafetyPage />;
      case 'terms':
        return <LegalPage type="terms" />;
      case 'privacy':
        return <LegalPage type="privacy" />;
      case 'jobs_board':
        return currentUser ? (userRole === 'artisan' ? <ArtisanDashboardScreen /> : <ClientDashboardScreen />) : <FindArtisansPage />;

      case 'onboarding':
        return <OnboardingScreen />;
      case 'auth':
        return <AuthScreen role={userRole} />;
      case 'login':
        return <LoginPage />;
      case 'signup':
        return <SignUpPage />;

      case 'client_dash':
        return <ClientDashboardScreen />;
      case 'post_job':
        return <PostJobScreen />;
      case 'match_list':
        return <MatchListScreen />;
      case 'checkout':
        return <PaystackCheckoutModal />;
      case 'complete_rating':
        return <JobCompletionRatingModal />;
      case 'live_tracking':
        return <LiveTrackingScreen />;
      case 'chat_screen':
        return <ChatScreen job={activeJob} artisan={activeArtisan} />;
      case 'client_artisan_profile':
        return <ClientArtisanProfileScreen artisan={activeArtisan} job={activeJob} />;

      case 'artisan_signup':
        return <ArtisanSignupScreen />;
      case 'artisan_pending':
        return <VerificationPendingScreen />;
      case 'artisan_dash':
        return <ArtisanDashboardScreen />;
      case 'artisan_proforma':
        return <ArtisanProformaScreen job={activeJob} />;

      case 'admin_queue':
        return <AdminQueueScreen />;
      case 'admin_dash':
        return <AdminDashboardScreen />;
      case 'admin_proforma':
        return <AdminProformaQueueScreen />;

      case 'not_found':
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased">
      {renderScreen()}
      <Toast />
    </div>
  );
}
