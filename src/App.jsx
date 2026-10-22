import React from 'react';
import {
  BrowserRouter,
} from 'react-router-dom';
import { AppProviders } from './contexts/AppProviders';
import { AppRoutes } from './routing/AppRoutes';

const childrenPropType = () => null;

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    void error;
    void errorInfo;
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main
          aria-labelledby="application-error-title"
          className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12"
        >
          <section
            className="w-full max-w-2xl rounded-xl border border-danger-200 bg-surface p-6 text-center shadow-sm sm:p-8"
            role="alert"
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-xl font-bold text-danger-700"
            >
              !
            </div>

            <h1
              className="text-2xl font-semibold text-foreground"
              id="application-error-title"
            >
              We could not display this page
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm text-foreground-muted">
              Something unexpected happened in this demonstration portal.
              Please try again.
            </p>

            <button
              className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              onClick={this.handleRetry}
              type="button"
            >
              Try again
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

AppErrorBoundary.displayName = 'AppErrorBoundary';

AppErrorBoundary.propTypes = {
  children: childrenPropType,
};

function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProviders>
    </AppErrorBoundary>
  );
}

App.displayName = 'App';

export { AppErrorBoundary };

export default App;