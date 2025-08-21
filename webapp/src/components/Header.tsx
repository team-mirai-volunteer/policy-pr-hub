'use client'

import React from 'react'
import Link from 'next/link'
import AuthButton from './AuthButton'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">
          政策PR Hub
        </Link>
        <AuthButton />
      </div>
    </header>
  )
}
