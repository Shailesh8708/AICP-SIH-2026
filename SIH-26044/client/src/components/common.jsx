import React from 'react'
import clsx from 'clsx'
import { Loader } from 'lucide-react'

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    nav: 'bg-[#6655ee] hover:bg-[#5443dc] text-white shadow-[0_10px_24px_rgba(102,85,238,.24)]',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={clsx(
        'aicp-button font-medium rounded-lg transition-colors duration-200',
        `aicp-button-${variant} aicp-button-${size}`,
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader className="loader w-4 h-4" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export const Input = ({
  label,
  error,
  type = 'text',
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        className={clsx(
          'aicp-input px-4 py-2 border border-gray-300 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={clsx(
        'aicp-card bg-white border border-gray-200 rounded-lg p-6 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const Modal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="mb-6">{children}</div>
        <div className="flex gap-2 justify-end">
          {actions}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}

export const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <span
      className={clsx(
        'px-3 py-1 rounded-full text-sm font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div
      className={clsx(
        'border-4 border-gray-200 border-t-blue-600 rounded-full',
        'animate-spin',
        sizes[size]
      )}
    />
  )
}

export const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  }

  return (
    <div className={clsx('p-4 border rounded-lg flex justify-between items-start', types[type])}>
      <p>{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-4 text-lg font-bold">
          ×
        </button>
      )}
    </div>
  )
}

export { CountUp } from './common/CountUp'
export { CompanyLogo } from './common/CompanyLogo'

