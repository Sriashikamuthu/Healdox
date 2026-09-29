import { useState, useEffect } from 'react';
import ResetPassword from "./components/ResetPassword";
import { Heart, SquarePen as PenSquare, User, LogOut, Plus, FileText, Activity, Stethoscope, Users, Building2, Shield, MessageCircle, Bell, Menu, X, Calendar, Baby, Video, CreditCard, ShoppingCart } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from "./components/AuthModal";
import ForgotPassword from "./components/ForgotPassword";
import  Feed  from './components/Feed';
import { CreateJourneyModal } from './components/CreateJourneyModal';
import CreateReviewModal from "./components/CreateReviewModal";
import { PhysicianDashboard } from './components/PhysicianDashboard';
import { PhysicianList } from './components/PhysicianList';
import { PatientCounsellingSessions } from './components/PatientCounsellingSessions';
import { PatientProfile } from './components/PatientProfile';
import { SymptomDiscussions } from './components/SymptomDiscussions';
import { PhysicianServices } from './components/PhysicianServices';
import { ProvideMedicalSuggestion } from './components/ProvideMedicalSuggestion';
import { MedicalSuggestions } from './components/MedicalSuggestions';
import { PhysicianProfile } from './components/PhysicianProfile';
import { AdminDashboard } from './components/AdminDashboard';
import { PharmaCompanyProfile } from './components/PharmaCompanyProfile';
import { PatientDataAccessManagement } from './components/PatientDataAccessManagement';
import { VerificationPending } from './components/VerificationPending';
import { PatientMedicalRecordRequests } from './components/PatientMedicalRecordRequests';
import { ProviderMedicalRecords } from './components/ProviderMedicalRecords';
import { ConnectionsManager } from './components/ConnectionsManager';
import Messenger from './components/Messenger';
import { FreeConsultationsMarket } from './components/FreeConsultationsMarket';
import { PhysicianFreeConsultations } from './components/PhysicianFreeConsultations';
import { PatientAppointments } from './components/PatientAppointments';
import { DependentChildrenManager } from './components/DependentChildrenManager';
import { ConsultationVideoShare } from './components/ConsultationVideoShare';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { SubscriptionManagement } from './components/SubscriptionManagement';
import { MedicalRecordsMarketplace } from './components/MedicalRecordsMarketplace';
import { CorporateMarketplaceBrowser } from './components/CorporateMarketplaceBrowser';

function AppContent() {
  const { user, signOut, loading } = useAuth();

  // Temporary fix while migrating from Supabase
  const profile = user;
  
  console.log("PROFILE:", profile);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [createJourneyOpen, setCreateJourneyOpen] = useState(false);
  const [createReviewOpen, setCreateReviewOpen] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [currentView, setCurrentView] = useState<'feed' | 'physicians' | 'dashboard' | 'profile' | 'symptoms' | 'services' | 'suggestions' | 'provide-suggestion' | 'physician-profile' | 'admin' | 'pharma-profile' | 'data-access' | 'medical-records' | 'provider-records' | 'connections' | 'messenger' | 'free-consultations' | 'provider-free-consultations' | 'appointments' | 'children' | 'videos' | 'subscription-plans' | 'subscription-management' | 'marketplace' | 'reset-password' | 'forgot-password'>('feed');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/reset-password')) setCurrentView('reset-password');
    else if (path === '/physician-services') setCurrentView('services');
    else if (path === '/medical-suggestions') setCurrentView('suggestions');
    else if (path === '/provide-suggestion') setCurrentView('provide-suggestion');
    else if (path === '/physician-profile') setCurrentView('physician-profile');
    else if (path === '/profile') setCurrentView('profile');
    else if (path === '/physicians') setCurrentView('physicians');
    else if (path === '/dashboard') setCurrentView('dashboard');
    else if (path === '/symptoms') setCurrentView('symptoms');
    else if (path === '/admin') setCurrentView('admin');
    else if (path === '/pharma-profile') setCurrentView('pharma-profile');
    else if (path === '/data-access') setCurrentView('data-access');
    else if (path === '/medical-records') setCurrentView('medical-records');
    else if (path === '/provider-records') setCurrentView('provider-records');
    else if (path === '/connections') setCurrentView('connections');
    else if (path === '/messenger') setCurrentView('messenger');
    else if (path === '/free-consultations') setCurrentView('free-consultations');
    else if (path === '/provider-free-consultations') setCurrentView('provider-free-consultations');
    else if (path === '/appointments') setCurrentView('appointments');
    else if (path === '/children' || path === '/dependents') setCurrentView('children');
    else if (path === '/videos') setCurrentView('videos');
    else if (path === '/subscription-plans') setCurrentView('subscription-plans');
    else if (path === '/subscription' || path === '/subscription-management') setCurrentView('subscription-management');
    else if (path === '/marketplace') setCurrentView('marketplace');
    else if (path === '/forgot-password') setCurrentView('forgot-password');
    else setCurrentView('feed');
  }, []);

  useEffect(() => {

  if (!user?.id) return;

  const fetchNotifications = async () => {

    try {

      const res = await fetch(
        `http://localhost:5000/notifications/${user.id}`
      );

      const data = await res.json();

      setNotifications(data);

      const unread = data.filter(
        (n: any) => !n.is_read
      ).length;

      setUnreadCount(unread);

    } catch (error) {

      console.error(
        "Fetch notifications error:",
        error
      );

    }

  };

  // fetchNotifications();

}, [user]);

  const handleRefreshFeed = () => {
    setFeedKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // if (user && profile && !profile.is_verified && ['physician', 'hospital', 'pharma_company'].includes(profile.role)) {
  //   return <VerificationPending profile={profile} />;
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <img
                src="/WhatsApp Image 2025-10-15 at 9.52.46 AM.jpeg"
                alt="Healdox Logo"
                className="h-12 w-auto object-contain"
              />
              <h1 className="text-2xl font-bold text-gray-900">Healdox</h1>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  </button>

                  {notificationsOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setNotificationsOpen(false)}
                      />
                      <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-12 left-2 sm:left-auto sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          <button
                            onClick={() => setNotificationsOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                          <div className="divide-y divide-gray-100">

                            {notifications.length === 0 ? (

                              <div className="p-4 text-center text-gray-500">
                                No notifications
                              </div>

                            ) : (

                              notifications.map((n: any) => (

                                <div
                                  key={n.id}
                                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                    !n.is_read ? "bg-blue-50" : ""
                                  }`}
                                >

                                  <div className="flex items-start gap-3">

                                    {/* Notification Dot */}

                                    <div
                                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                        !n.is_read
                                          ? "bg-blue-500"
                                          : "bg-gray-300"
                                      }`}
                                    />

                                    {/* Notification Content */}

                                    <div className="flex-1 min-w-0">

                                      <p className="text-sm text-gray-900 font-medium">
                                        {n.title}
                                      </p>

                                      <p className="text-sm text-gray-600 mt-1">
                                        {n.message}
                                      </p>

                                      <p className="text-xs text-gray-400 mt-1">
                                        {new Date(n.created_at)
                                          .toLocaleString()}
                                      </p>

                                    </div>

                                  </div>

                                </div>

                              ))

                            )}

                          </div>
                        </div>
                        <div className="p-3 border-t border-gray-200 bg-gray-50">
                          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View all notifications
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-gray-500">@{user?.username}</p>

                  {JSON.parse(
                    localStorage.getItem(
                      `subscription_${user?.email}`
                    ) || '{}'
                  )?.active && (
                    <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">

                      {
                        JSON.parse(
                          localStorage.getItem(
                            `subscription_${user?.email}`
                          ) || '{}'
                        )?.plan
                      } Plan

                    </div>
                  )}

                </div>
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/default.png"; // fallback image
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    {user?.username?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <p className="text-xl font-bold text-gray-900 hidden md:block">
                  Health is the Ultimate Wealth
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('signup');
                      setAuthModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {user && (
        <>
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <aside className={`fixed left-0 top-[83px] h-[calc(100vh-73px)] w-64 bg-white border-r border-gray-200 overflow-y-auto z-50 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}>
            <div className="lg:hidden p-4 border-b border-gray-200">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setCurrentView('feed');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                currentView === 'feed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Feed
            </button>
            <button
              onClick={() => {
                setCurrentView('connections');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                currentView === 'connections'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Connections
            </button>
            <button
              onClick={() => {
                setCurrentView('messenger');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                currentView === 'messenger'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Messages
            </button>

            {user && (!profile?.role || profile?.role === 'patient') && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('symptoms');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'symptoms'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Symptom Discussions
                </button>
                <button
                  onClick={() => {
                    setCurrentView('physicians');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'physicians'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  Find Physicians
                </button>
                <button
                  onClick={() => {
                    setCurrentView('free-consultations');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'free-consultations'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  Free Consultations
                </button>
                <button
                  onClick={() => {
                    setCurrentView('appointments');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'appointments'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Appointments
                </button>
                <button
                  onClick={() => {
                    setCurrentView('children');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'children'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Baby className="w-4 h-4" />
                  My Dependents
                </button>
                <button
                  onClick={() => {
                    setCurrentView('videos');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'videos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Consultation Videos
                </button>
                <button
                  onClick={() => {
                    setCurrentView('medical-records');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'medical-records'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Medical Records
                </button>
                <button
                  onClick={() => {
                    setCurrentView('data-access');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'data-access'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Data Access
                </button>
                <button
                  onClick={() => {
                    setCurrentView('profile');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'profile'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setCurrentView('marketplace');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'marketplace'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Records Marketplace
                </button>
                <button
                  onClick={() => {
                    setCurrentView('subscription-management');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'subscription-management'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  My Subscription
                </button>

                <div className="pt-4 space-y-1 border-t border-gray-200 mt-4">
                  <button
                    onClick={() => {
                      setCreateJourneyOpen(true);
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Share Journey
                  </button>
                  <button
                    onClick={() => {
                      setCreateReviewOpen(true);
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <PenSquare className="w-4 h-4" />
                    Review Provider
                  </button>
                </div>
              </>
            )}

            {(profile?.role === 'physician' || profile?.role === 'nurse') && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setCurrentView('provider-records');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'provider-records'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Medical Records
                </button>
                <button
                  onClick={() => {
                    setCurrentView('provider-free-consultations');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'provider-free-consultations'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  My Offers
                </button>
                <button
                  onClick={() => {
                    setCurrentView('physician-profile');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'physician-profile'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setCurrentView('subscription-management');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'subscription-management'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  My Subscription
                </button>
              </>
            )}

            {profile?.role === 'pharma_company' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('marketplace');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'marketplace'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Browse Marketplace
                </button>
                <button
                  onClick={() => {
                    setCurrentView('provider-records');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'provider-records'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  My Purchases
                </button>
                <button
                  onClick={() => {
                    setCurrentView('pharma-profile');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'pharma-profile'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  My Company
                </button>
                <button
                  onClick={() => {
                    setCurrentView('subscription-management');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === 'subscription-management'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  My Subscription
                </button>
              </>
            )}

            {profile?.role === 'admin' && (
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </button>
            )}
          </nav>
        </aside>
        </>
      )}

      <main className={user ? "lg:ml-64 px-4 py-4" : "max-w-7xl mx-auto px-4 py-8"}>
        {currentView === 'reset-password' ? (
          <ResetPassword />
        ) : currentView === 'forgot-password' ? (
          <ForgotPassword />
        ) : !user ? (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="text-left order-2 lg:order-1">
              <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg p-6 mb-6 shadow-lg">
                <h2 className="text-3xl font-bold mb-2">Hello Health Winners!</h2>
                <p className="text-teal-50">Welcome to your health journey community</p>
              </div>
              <Heart className="w-12 h-12 text-blue-600 mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Your Voice Matters in Healthcare
              </h2>
              <p className="text-base text-gray-700 mb-2 leading-relaxed">
                Don't let fear or hesitation hold you back. Your healthcare journey and experiences are valuable beyond measure.
              </p>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                By sharing your story, you're not just documenting your experience—you're becoming a beacon of hope and guidance for millions worldwide.
                Your courage to speak up about your healthcare journey can help others make informed decisions, find better care, and feel less alone in their struggles.
              </p>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-base font-bold text-blue-900 mb-2">Share Without Fear</h3>
                <p className="text-blue-800 text-xs leading-relaxed">
                  Your experiences with doctors, hospitals, treatments, and healthcare providers help create a global community of awareness and support.
                  Whether your journey was challenging or successful, your story matters. Together, we build a world where healthcare information flows freely,
                  helping everyone make better decisions for their health and wellbeing.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 mt-4">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Share Your Journey</h3>
                      <p className="text-gray-600 text-sm">
                        Document your healthcare experiences openly and honestly.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Connect with Professionals</h3>
                      <p className="text-gray-600 text-sm">
                        Get guidance from certified physicians, nurses, and medical professionals.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Help the Community</h3>
                      <p className="text-gray-600 text-sm">
                        Your experiences help people worldwide make informed healthcare decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-gray-700 italic">
                  "Every healthcare journey shared is a light in the darkness for someone searching for answers. Be brave. Be bold. Share your story."
                </p>
              </div>
            </div>

            <div className="flex items-start justify-center order-1 lg:order-2">
              <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Get Started</h3>

                  <button
                    onClick={() => {
                      setAuthModalMode('signup');
                      setAuthModalOpen(true);
                    }}
                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-lg font-semibold shadow-lg hover:shadow-xl mb-4">
                    Start Sharing Your Journey Today
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="w-full px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold">
                    Sign In
                  </button>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center mb-3">Join as a healthcare professional?</p>
                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                      Medical professionals can sign up to share advice and connect with patients seeking guidance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 mb-12">
            {/* <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Start with our free tier or unlock premium features for your healthcare journey
              </p>
            </div> */}
            <SubscriptionPlans />
          </div>
          </>
        ) : currentView === 'messenger' ? (
          <Messenger />
        ) : currentView === 'free-consultations' ? (
          <FreeConsultationsMarket />
        ) : currentView === 'provider-free-consultations' ? (
          <PhysicianFreeConsultations />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT MAIN CONTENT */}
          <div className="lg:col-span-3">
            {currentView === 'feed' ? (
              <Feed key={feedKey} />
            ) : currentView === 'symptoms' ? (
              <SymptomDiscussions />
            ) : currentView === 'physicians' ? (
              <PhysicianList />
            ) : currentView === 'dashboard' ? (
              <PhysicianDashboard />
            ) : currentView === 'profile' ? (
              <PatientProfile />
            ) : currentView === 'services' ? (
              <PhysicianServices />
            ) : currentView === 'suggestions' ? (
              <MedicalSuggestions />
            ) : currentView === 'provide-suggestion' ? (
              <ProvideMedicalSuggestion />
            ) : currentView === 'physician-profile' ? (
              <PhysicianProfile />
            ) : currentView === 'admin' ? (
              <AdminDashboard />
            ) : currentView === 'pharma-profile' ? (
              <PharmaCompanyProfile />
            ) : currentView === 'data-access' ? (
              <PatientDataAccessManagement />
            ) : currentView === 'medical-records' ? (
              <PatientMedicalRecordRequests />
            ) : currentView === 'provider-records' ? (
              <ProviderMedicalRecords />
            ) : currentView === 'connections' ? (
              <ConnectionsManager />
            ) : currentView === 'appointments' ? (
              <PatientAppointments />
            ) : currentView === 'children' ? (
              <DependentChildrenManager />
            ) : currentView === 'videos' ? (
              <ConsultationVideoShare />
            ) : currentView === 'subscription-plans' ? (
              <SubscriptionPlans />
            ) : currentView === 'subscription-management' ? (
              <SubscriptionManagement />
            ) : currentView === 'marketplace' ? (
              profile?.role === 'pharma_company'
                ? <CorporateMarketplaceBrowser />
                : <MedicalRecordsMarketplace />
            ) : (
              <Feed key={feedKey} />
            )}
          </div>

          {/* CHATBOT (VELA) */}
          <div className="lg:col-span-2 space-y-6 self-start">
            <Messenger />
          </div>

          {/* COUNSELLING SESSIONS */}
          <div className="lg:col-span-1 space-y-6 self-start">
            <PatientCounsellingSessions />
          </div>
        </div>
        )}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <CreateJourneyModal
        isOpen={createJourneyOpen}
        onClose={() => setCreateJourneyOpen(false)}
        onSuccess={handleRefreshFeed}
      />

      <CreateReviewModal
        isOpen={createReviewOpen}
        onClose={() => setCreateReviewOpen(false)}
        onSuccess={handleRefreshFeed}
      />
    </div>
  );
}
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;