import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { Layout, type View } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { TodayView } from './components/TodayView';
import { WeekView } from './components/WeekView';
import { CalendarView } from './components/CalendarView';
import { InsightsView } from './components/InsightsView';
import { AllEntriesView } from './components/AllEntriesView';
import { CategoriesPage } from './components/CategoriesPage';
import { SummariesPage } from './components/SummariesPage';
import { SummaryModal } from './components/SummaryModal';
import { GoalsPage } from './components/GoalsPage';
import { GoalCompletionModal } from './components/GoalCompletionModal';
import { SettingsPanel } from './components/SettingsPanel';
import { useState } from 'react';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('today');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex bg-background min-h-screen font-sans text-text-primary antialiased selection:bg-gray-200">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <Layout>
        {currentView === 'today' && <TodayView />}
        {currentView === 'week' && <WeekView />}
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'insights' && <InsightsView />}
        {currentView === 'all' && <AllEntriesView />}
        {currentView === 'categories' && <CategoriesPage />}
        {currentView === 'summaries' && <SummariesPage />}
        {currentView === 'goals' && <GoalsPage />}
      </Layout>
      <SummaryModal />
      <GoalCompletionModal />
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}
