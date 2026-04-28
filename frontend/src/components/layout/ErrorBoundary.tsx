import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI ErrorBoundary caught:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md space-y-4 rounded-lg border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-6 text-destructive" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Terjadi kesalahan</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Aplikasi mengalami masalah tak terduga. Silakan muat ulang halaman. Jika
                terus terjadi, hubungi admin sistem.
              </p>
              {this.state.error && (
                <pre className="mt-3 max-h-32 overflow-auto rounded bg-muted p-2 text-left text-xs">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <Button onClick={this.handleReload} className="w-full">
              <RotateCw className="mr-2 size-4" />
              Muat ulang halaman
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
