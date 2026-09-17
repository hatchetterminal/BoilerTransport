import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from '@/pages/PageNotFound';
import Home from '@/pages/Home';
import Layout from '@/Layout';
import { APP_TAB_IDS } from '@/lib/tabs';
import { useEffect } from 'react';
import { AboutPage, PrivacyPolicyPage, SupportPage } from '@/pages/LegalPages';
import AppearanceSync from '@/components/common/AppearanceSync';

const ApplicationRoutes = () => {
  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/about" element={<AboutPage />} />
      {['/', '/Home', ...APP_TAB_IDS.map((tab) => `/${tab}`)].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const legacyParams = [
      'access_token',
      'app_id',
      'app_base_url',
      'clear_access_token',
      'from_url',
      'functions_version',
    ];
    const hadLegacyParams = legacyParams.some((name) => url.searchParams.has(name));
    legacyParams.forEach((name) => url.searchParams.delete(name));
    if (hadLegacyParams) {
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <AppearanceSync />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ApplicationRoutes />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
