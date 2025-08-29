import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Image Editor - Edit Your Images Online',
  description: 'Upload and edit your images with cropping, arrows, and more',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}