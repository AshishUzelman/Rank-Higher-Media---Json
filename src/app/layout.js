import './styles/globals.css'

export const metadata = {
  title: 'Rank Higher Media',
  description: 'Data-Driven SEM for Measurable Growth',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900">
        {children}
      </body>
    </html>
  )
}
