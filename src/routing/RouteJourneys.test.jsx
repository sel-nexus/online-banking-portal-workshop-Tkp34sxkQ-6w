import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  BrowserRouter,
  useLocation,
} from 'react-router-dom';
import App from '../App';
import { AppProviders } from '../contexts/AppProviders';
import { useCustomerProfile } from '../contexts/CustomerProfileContext';
import { AppRoutes } from './AppRoutes';
import DemoStore, {
  clearResetMarker,
} from '../store/DemoStore';

function setRoute(pathname) {
  window.history.replaceState({}, '', pathname);
}

async function signIn(user) {
  await user.type(
    screen.getByRole('textbox', { name: 'User ID' }),
    'miguel',
  );
  await user.type(
    screen.getByLabelText('Password'),
    'demo-only',
  );
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  await waitFor(() => {
    expect(
      screen.getByRole('heading', { name: 'Magandang umaga, Miguel' }),
    ).toBeInTheDocument();
  });
  expect(window.location.pathname).toBe('/home');
}

function ProfileSwitchControl() {
  const { switchProfile } = useCustomerProfile();
  const location = useLocation();

  return (
    <div>
      <button
        onClick={() => switchProfile('profile-rosa-santos')}
        type="button"
      >
        Switch to Rosa
      </button>
      <output aria-label="Current route">{location.pathname}</output>
    </div>
  );
}

function renderRouteJourney() {
  return render(
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
        <ProfileSwitchControl />
      </BrowserRouter>
    </AppProviders>,
  );
}

describe('Route journeys', () => {
  beforeEach(() => {
    DemoStore.reset();
    clearResetMarker();
    setRoute('/');
  });

  afterEach(() => {
    cleanup();
    DemoStore.reset();
    clearResetMarker();
  });

  it('redirects unauthenticated users from a protected route to sign in', () => {
    setRoute('/accounts');

    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Sign in to your account' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('offers Sign in and Register options on the login page', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Sign in to your account' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Sign in' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Register' }),
    ).toBeInTheDocument();
  });

  it('signs in and navigates through authenticated PRD routes', async () => {
    const user = userEvent.setup();

    render(<App />);

    await signIn(user);

    await user.click(screen.getAllByRole('link', { name: 'Accounts' })[0]);

    expect(
      await screen.findByRole('heading', { name: 'Accounts' }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: 'Products' })[0]);

    expect(
      await screen.findByRole('heading', { name: 'Banking products' }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: 'Promotions and Offers' })[0]);

    expect(
      await screen.findByRole('heading', { name: 'Promotions and offers' }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('link', { name: 'Help and Support' })[0]);

    expect(
      await screen.findByRole('heading', { name: 'How can we help today?' }),
    ).toBeInTheDocument();
  });

  it('switches profiles and limits account routes to the active profile', async () => {
    const user = userEvent.setup();

    renderRouteJourney();

    await signIn(user);

    await user.click(
      screen.getByRole('button', { name: 'Switch to Rosa' }),
    );
    await user.click(screen.getAllByRole('link', { name: 'Accounts' })[0]);

    expect(
      await screen.findByRole('heading', { name: 'Accounts' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Salary account' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Payroll account' }),
    ).not.toBeInTheDocument();
  });

  it('rejects a foreign account route for the active profile', async () => {
    const user = userEvent.setup();

    render(<App />);

    await signIn(user);

    setRoute('/accounts/account-rosa-checking');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(
      await screen.findByRole('heading', { name: 'Account not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This account is not available for the current profile.',
      ),
    ).toBeInTheDocument();
  });

  it('logs out and redirects the user back to sign in', async () => {
    const user = userEvent.setup();

    render(<App />);

    await signIn(user);
    await user.click(
      screen.getByRole('button', { name: /Open profile menu/i }),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(
      await screen.findByRole('heading', { name: 'Sign in to your account' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('resets the demo state and invalidates the protected route', async () => {
    const user = userEvent.setup();

    render(<App />);

    await signIn(user);
    DemoStore.reset();

    expect(
      await screen.findByRole('heading', { name: 'Sign in to your account' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('renders the route fallback for an unknown public path', () => {
    setRoute('/not-a-real-route');

    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Return to dashboard' }),
    ).toBeInTheDocument();
  });
});
