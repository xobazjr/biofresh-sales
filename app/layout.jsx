import '../src/styles/global.css'
import '../src/styles/app.css'

export const metadata = {
  title: 'Biofresh Sales Workspace',
  description: 'Internal sales workspace for Focus Company',
}

export default function RootLayout({ children }) {
  return <html lang="th"><body>{children}</body></html>
}
