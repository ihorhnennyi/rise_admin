import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from '@admin/pages/DashboardPage'
import { LoginPage } from '@admin/pages/LoginPage'
import { RequireAuth } from '@admin/routes/RequireAuth'
import { AppLayout } from '@admin/components/AppLayout'
import { NewsListPage } from '@admin/pages/news/NewsListPage'
import { NewsCreatePage } from '@admin/pages/news/NewsCreatePage'
import { NewsEditPage } from '@admin/pages/news/NewsEditPage'
import { AboutPage } from '@admin/pages/AboutPage'
import { ReportsPage } from '@admin/pages/ReportsPage'
import { SupportPage } from '@admin/pages/SupportPage'
import { TermsPage } from '@admin/pages/TermsPage'
import { CookiesPage } from '@admin/pages/CookiesPage'
import { PrivacyPage } from '@admin/pages/PrivacyPage'
import { HelpPage } from '@admin/pages/HelpPage'
import { ProjectsListPage } from '@admin/pages/projects/ProjectsListPage'
import { ProjectsCreatePage } from '@admin/pages/projects/ProjectsCreatePage'
import { ProjectsEditPage } from '@admin/pages/projects/ProjectsEditPage'
import { DirectionsListPage } from '@admin/pages/directions/DirectionsListPage'
import { DirectionsCreatePage } from '@admin/pages/directions/DirectionsCreatePage'
import { DirectionsEditPage } from '@admin/pages/directions/DirectionsEditPage'
import { PartnersPage } from '@admin/pages/PartnersPage'
import { MenuPage } from '@admin/pages/MenuPage'
import { FooterPage } from '@admin/pages/FooterPage'
import { UsersPage } from '@admin/pages/users/UsersPage'
import { MarketingScriptsPage } from '@admin/pages/MarketingScriptsPage'
import { AnalyticsOverviewPage } from '@admin/pages/AnalyticsOverviewPage'
import { RequireSuperadmin } from '@admin/routes/RequireSuperadmin'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route
          index
          element={
            <RequireSuperadmin>
              <DashboardPage />
            </RequireSuperadmin>
          }
        />
        <Route
          path="users"
          element={
            <RequireSuperadmin>
              <UsersPage />
            </RequireSuperadmin>
          }
        />
        <Route
          path="menu"
          element={
            <RequireSuperadmin>
              <MenuPage />
            </RequireSuperadmin>
          }
        />
        <Route
          path="footer"
          element={
            <RequireSuperadmin>
              <FooterPage />
            </RequireSuperadmin>
          }
        />
        <Route
          path="marketing-scripts"
          element={
            <RequireSuperadmin>
              <MarketingScriptsPage />
            </RequireSuperadmin>
          }
        />
        <Route
          path="analytics"
          element={
            <RequireSuperadmin>
              <AnalyticsOverviewPage />
            </RequireSuperadmin>
          }
        />
        <Route path="news" element={<NewsListPage />} />
        <Route path="news/new" element={<NewsCreatePage />} />
        <Route path="news/:id" element={<NewsEditPage />} />
        <Route path="projects" element={<ProjectsListPage />} />
        <Route path="projects/new" element={<ProjectsCreatePage />} />
        <Route path="projects/:id" element={<ProjectsEditPage />} />
        <Route path="directions" element={<DirectionsListPage />} />
        <Route path="directions/new" element={<DirectionsCreatePage />} />
        <Route path="directions/:id" element={<DirectionsEditPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="partners" element={<PartnersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="support"
          element={
            <RequireSuperadmin>
              <SupportPage />
            </RequireSuperadmin>
          }
        />
        <Route path="terms" element={<TermsPage />} />
        <Route path="cookies" element={<CookiesPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
