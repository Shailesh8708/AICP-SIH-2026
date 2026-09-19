import React from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../components/common'
import { ROUTES } from '../utils/constants'

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to={ROUTES.HOME}>
          <Button variant="primary" size="lg" className="w-full">
            Go Back Home
          </Button>
        </Link>
      </Card>
    </div>
  )
}
