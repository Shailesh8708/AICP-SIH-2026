import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './ProtectedRoute'
import { ROUTES } from '../utils/constants'

// Pages
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { WorkspacePage } from '../pages/WorkspacePage'
import { ResumeBuilder } from '../pages/student/ResumeBuilder'
import { OpportunitiesPage } from '../pages/opportunities/OpportunitiesPage'
import { RoleOperations } from '../components/RoleOperations'
import { CareerAgent } from '../pages/student/CareerAgent'
import { HealthWellnessShowcase } from '../pages/HealthWellnessShowcase'

export const AppRouter = () => {
  return (
    <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/opportunities" element={<ProtectedRoute><OpportunitiesPage /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/learning" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/collaborations" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/assessments" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/internships" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
        <Route path={ROUTES.CAREER_AGENT} element={<ProtectedRoute><CareerAgent /></ProtectedRoute>} />
        <Route path="/manage-opportunities" element={<ProtectedRoute><RoleOperations role="industry" view="postings" /></ProtectedRoute>} />
        <Route path="/applicants" element={<ProtectedRoute><RoleOperations role="industry" view="applicants" /></ProtectedRoute>} />
        <Route path="/academic-opportunities" element={<ProtectedRoute><RoleOperations role="academician" view="collaborations" /></ProtectedRoute>} />
        <Route path="/diet-plan" element={<HealthWellnessShowcase />} />
        <Route path="/calorie-calculator" element={<HealthWellnessShowcase />} />
        <Route path="/workout-plan" element={<HealthWellnessShowcase />} />
        <Route path="/health-checker" element={<HealthWellnessShowcase />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
