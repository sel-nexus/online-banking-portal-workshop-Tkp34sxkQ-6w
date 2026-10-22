import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccess } from '../contexts/AccessContext';
import { useToast } from '../contexts/AppProviders';
import { useDemoDispatch, useDemoState, useDemoStore } from '../store/DemoStoreContext';
import MockAuthService from '../services/MockAuthService';
import {
  APP_NAME,
  ROUTES,
} from '../config/constants';
import {
  AUTH_MESSAGES,
  FILIPINO_LABELS,
  SIMULATION_MESSAGES,
  VALIDATION_MESSAGES,
} from '../config/messages';
import { SUPPORT } from '../fixtures/support';
import {
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
} from '../utils/safeStorage';
import Alert from '../components/feedback/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const REMEMBERED_USER_ID_KEY = 'online-banking-portal:v1:remembered-user-id';

const LOGIN_TRANSLATIONS = Object.freeze({
  English: Object.freeze({
    eyebrow: 'Secure Online Banking.',
    subtitle: 'Welcome back. Access your accounts securely.',
    greetingPreview: 'Good morning',
    userIdLabel: 'User ID',
    passwordLabel: 'Password',
    rememberLabel: 'Remember User ID',
    signInButton: 'Sign in',
    forgotUserId: 'Forgot User ID',
    forgotPassword: 'Forgot Password',
    contactUs: 'Contact Us',
    securityGuidance: 'Security guidance',
    signInTab: 'Sign in',
    registerTab: 'Register',
    registerTitle: 'Register for BPI Online',
    registerSubtitle: 'Enroll your BPI account or card to access online banking.',
    registerButton: 'Complete Registration',
    alreadyRegistered: 'Already have an online banking account?',
    notRegistered: "Don't have an online banking account yet?",
    registerNow: 'Register now',
    signInNow: 'Sign in now',
  }),
  Filipino: Object.freeze({
    eyebrow: 'Secure Online Banking.',
    subtitle: 'Maligayang pagbabalik. Buksan nang ligtas ang iyong mga account.',
    greetingPreview: 'Magandang umaga',
    userIdLabel: 'User ID',
    passwordLabel: 'Password',
    rememberLabel: 'Tandaan ang User ID',
    signInButton: 'Sign in',
    forgotUserId: 'Nakalimutan ang User ID',
    forgotPassword: 'Nakalimutan ang Password',
    contactUs: 'Makipag-ugnayan sa Amin',
    securityGuidance: 'Gabay sa Seguridad',
    signInTab: 'Sign in',
    registerTab: 'Magrehistro',
    registerTitle: 'Magrehistro sa BPI Online',
    registerSubtitle: 'Irehistro ang iyong account o card para sa online banking.',
    registerButton: 'Kumpirmahin ang Pagpaparehistro',
    alreadyRegistered: 'May account ka na ba?',
    notRegistered: 'Wala ka pa bang online banking account?',
    registerNow: 'Magrehistro ngayon',
    signInNow: 'Mag-sign in ngayon',
  }),
});

function normalizeText(value) {
  return String(value ?? '').trim();
}

function validateLoginFields(userId, password) {
  const errors = {};

  if (!normalizeText(userId)) {
    errors.userId = VALIDATION_MESSAGES.usernameRequired;
  }

  if (!password) {
    errors.password = VALIDATION_MESSAGES.passwordRequired;
  }

  return errors;
}

function getDestination() {
  return ROUTES.HOME;
}

/**
 * Renders the BPI Red Style online-banking sign-in page per PRD Section 4.
 *
 * @param {object} props Component properties.
 * @param {Function} props.onLogin Callback invoked after a successful sign-in.
 * @param {Function} props.onSuccess Alias for onLogin.
 * @param {string} props.className Additional page classes.
 * @returns {JSX.Element} Mock login page.
 */
function LoginPage({
  className = '',
  onLogin,
  onSuccess,
}) {
  const access = useAccess();
  const state = useDemoState();
  const dispatch = useDemoDispatch();
  const { reset: resetDemoStore } = useDemoStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const initialRememberedUserId =
    state?.session?.rememberedUserId ||
    safeGetItem(REMEMBERED_USER_ID_KEY, '') ||
    '';

  const [userId, setUserId] = useState(
    typeof initialRememberedUserId === 'string' ? initialRememberedUserId : '',
  );
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(Boolean(initialRememberedUserId));
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('English');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isLockedState, setIsLockedState] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [infoPanel, setInfoPanel] = useState(null); // 'security' | 'contact' | null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'register'
  const [regAccountType, setRegAccountType] = useState('deposit');
  const [regAccountNumber, setRegAccountNumber] = useState('');
  const [regDateOfBirth, setRegDateOfBirth] = useState('');
  const [regUserId, setRegUserId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAgreeTerms, setRegAgreeTerms] = useState(false);
  const [regErrors, setRegErrors] = useState({});
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const storedId = safeGetItem(REMEMBERED_USER_ID_KEY, '');
    if (storedId && typeof storedId === 'string' && !userId) {
      setUserId(storedId);
      setRememberId(true);
    }
  }, []);

  const labels = LOGIN_TRANSLATIONS[language] || LOGIN_TRANSLATIONS.English;

  const handleRegisterSubmit = (event) => {
    event.preventDefault();
    const newErrors = {};

    const cleanAccount = regAccountNumber.trim().replace(/[\s-]/g, '');
    if (!cleanAccount) {
      newErrors.accountNumber = 'Account or card number is required.';
    } else if (cleanAccount.length < 8) {
      newErrors.accountNumber = 'Enter a valid 10-digit account or 16-digit card number.';
    }

    if (!regDateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required.';
    }

    if (!regUserId.trim()) {
      newErrors.userId = 'Preferred User ID is required.';
    } else if (regUserId.trim().length < 3) {
      newErrors.userId = 'User ID must be at least 3 characters.';
    }

    if (!regPassword) {
      newErrors.password = 'Password is required.';
    } else if (regPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!regConfirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (regPassword !== regConfirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!regAgreeTerms) {
      newErrors.terms = 'You must agree to the Terms and Conditions and Privacy Policy.';
    }

    setRegErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsRegistering(true);
    try {
      MockAuthService.registerCustomer({
        userId: regUserId.trim(),
        password: regPassword,
        accountNumber: regAccountNumber.trim(),
        accountType: regAccountType === 'card' ? 'Credit card' : 'Deposit account',
        dateOfBirth: regDateOfBirth,
      });

      const message = `Registration successful! Your BPI Online account for User ID "${regUserId.trim()}" has been registered. Please sign in below.`;
      setUserId(regUserId.trim());
      setPassword('');
      setAuthMode('signin');
      setSuccessMessage(message);
      showToast('Registration successful! Please sign in with your User ID and password.', {
        variant: 'success',
      });
      setRegAccountNumber('');
      setRegDateOfBirth('');
      setRegUserId('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegAgreeTerms(false);
      setRegErrors({});
    } catch (err) {
      setSubmitError(err?.message || 'Registration could not be completed.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateLoginFields(userId, password);

    setErrors(validationErrors);
    setSubmitError('');
    setRecoveryMessage('');
    setSuccessMessage('');

    if (Object.keys(validationErrors).length) {
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedId = normalizeText(userId);
      const session = await access.login({
        identifier: normalizedId,
        password,
        rememberMe: rememberId,
      });

      if (rememberId) {
        safeSetItem(REMEMBERED_USER_ID_KEY, normalizedId);
      } else {
        safeRemoveItem(REMEMBERED_USER_ID_KEY);
      }

      if (session?.profile) {
        dispatch({
          type: 'profile/loadSuccess',
          payload: {
            profile: {
              ...session.profile,
              preferredLanguage: language,
            },
            profileId: session.profileId,
          },
        });
      }

      const message = AUTH_MESSAGES.signInSuccess;
      const destination = getDestination();

      setIsLockedState(false);
      setSuccessMessage(message);
      showToast(message, { variant: 'success' });
      onLogin?.(session);
      onSuccess?.(session);
      navigate(destination, { replace: true });
    } catch (error) {
      const locked = error?.code === 'ACCOUNT_LOCKED' || error?.isLocked === true;
      setIsLockedState(locked);
      setSubmitError(
        locked
          ? error?.message ||
              'Simulated account lock after three wrong passwords. Select Reset to clear it.'
          : 'The User ID or password you entered is not valid. Please check your credentials and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecovery = async (type = 'password') => {
    const normalizedUserId = normalizeText(userId);

    setSubmitError('');
    setRecoveryMessage('');
    setInfoPanel(null);

    setIsRecovering(true);

    try {
      const result = await MockAuthService.requestRecovery(
        normalizedUserId || type,
      );

      setRecoveryMessage(
        result?.message ||
          'If this were production, recovery instructions would be sent. Nothing was sent.',
      );
    } catch {
      setRecoveryMessage(
        'If this were production, recovery instructions would be sent. Nothing was sent.',
      );
    } finally {
      setIsRecovering(false);
    }
  };

  const handleResetLockAndDemo = () => {
    MockAuthService.resetAllLockouts?.();
    MockAuthService.resetLockout(userId || 'miguel');
    MockAuthService.resetLockout('rosa');
    MockAuthService.resetLockout('miguel.rosa.demo');
    MockAuthService.resetLockout('rosa.santos.demo');
    safeRemoveItem(REMEMBERED_USER_ID_KEY);
    resetDemoStore?.();
    setErrors({});
    setSubmitError('');
    setIsLockedState(false);
    setRecoveryMessage('');
    setSuccessMessage('');
    setPassword('');
    showToast('Demonstration state and simulated lockouts have been reset.', {
      variant: 'info',
    });
  };

  const fillDemoCredentials = (demoUser, demoPassword) => {
    setUserId(demoUser);
    setPassword(demoPassword);
    setErrors({});
    setSubmitError('');
  };

  return (
    <main
      className={`flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12 ${className}`.trim()}
    >
      <div className="w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section
            aria-labelledby="login-title"
            className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
          >
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-xs font-bold tracking-tight text-white"
                  >
                    BPI
                  </span>
                  <p className="text-sm font-bold uppercase tracking-wide text-primary">
                    {APP_NAME}
                  </p>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-primary">
                  {labels.eyebrow}
                </p>
                <h1
                  className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl"
                  id="login-title"
                >
                  {authMode === 'signin'
                    ? AUTH_MESSAGES.signInTitle
                    : labels.registerTitle}
                </h1>
                <p className="mt-1 text-sm text-foreground-muted">
                  {authMode === 'signin' ? labels.subtitle : labels.registerSubtitle}
                </p>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wide text-foreground-muted"
                  htmlFor="login-language-select"
                >
                  Language
                </label>
                <select
                  aria-label="Language"
                  className="mt-1 rounded-md border border-border-strong bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  id="login-language-select"
                  onChange={(event) => setLanguage(event.target.value)}
                  value={language}
                >
                  <option value="English">English (Default)</option>
                  <option value="Filipino">Filipino</option>
                </select>
                <p className="mt-1 text-xs text-foreground-muted">
                  Greeting: {labels.greetingPreview}
                </p>
              </div>
            </div>

            {/* Sign in / Register tab toggle */}
            <div
              aria-label="Authentication mode"
              className="mb-6 flex border-b border-border"
              role="tablist"
            >
              <button
                aria-controls="panel-signin"
                aria-selected={authMode === 'signin'}
                className={`flex-1 border-b-2 pb-3 text-center text-sm font-semibold transition-colors ${
                  authMode === 'signin'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
                id="tab-signin"
                onClick={() => {
                  setAuthMode('signin');
                  setErrors({});
                  setSubmitError('');
                }}
                role="tab"
                type="button"
              >
                {labels.signInTab}
              </button>
              <button
                aria-controls="panel-register"
                aria-selected={authMode === 'register'}
                className={`flex-1 border-b-2 pb-3 text-center text-sm font-semibold transition-colors ${
                  authMode === 'register'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                }`}
                id="tab-register"
                onClick={() => {
                  setAuthMode('register');
                  setErrors({});
                  setSubmitError('');
                }}
                role="tab"
                type="button"
              >
                {labels.registerTab}
              </button>
            </div>

            <div
              aria-label="Trust cues"
              className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-muted px-4 py-2.5 text-xs font-semibold text-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="text-accent-mint">●</span>
                Secure banking
              </span>
              <span aria-hidden="true" className="text-border-strong">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="text-accent-mint">●</span>
                Encrypted session
              </span>
              <span aria-hidden="true" className="text-border-strong">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="text-accent-mint">●</span>
                Privacy protected
              </span>
            </div>

            {submitError ? (
              <div className="mb-6 space-y-3">
                <Alert
                  message={submitError}
                  role="alert"
                  title={isLockedState ? 'Simulated account lock' : 'Sign-in unsuccessful'}
                  variant="error"
                />
                {isLockedState ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm">
                    <span className="text-foreground-muted">
                      Three wrong passwords triggered a simulated lock.
                    </span>
                    <button
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={handleResetLockAndDemo}
                      type="button"
                    >
                      Reset
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {successMessage ? (
              <Alert
                className="mb-6"
                message={successMessage}
                role="status"
                title="Account Status"
                variant="success"
              />
            ) : null}

            {recoveryMessage ? (
              <Alert
                className="mb-6"
                message={recoveryMessage}
                role="status"
                title="Account Recovery"
                variant="info"
              />
            ) : null}

            {infoPanel === 'security' ? (
              <Alert
                className="mb-6"
                description="This build is a workshop simulation running entirely in your browser with synthetic data. Never enter real banking credentials, card numbers, or passwords."
                role="status"
                title="Security guidance — Workshop simulation"
                variant="info"
              />
            ) : null}

            {infoPanel === 'contact' ? (
              <Alert
                className="mb-6"
                description={`Call us: ${SUPPORT.channels[0]?.phone} (sample only) • Email enquiry: ${SUPPORT.channels[2]?.email} (not a working mailbox) • Lost or stolen card: ${SUPPORT.lostCard?.phone} (demonstration only) • Hours: ${SUPPORT.hours?.description}.`}
                role="status"
                title="Contact Us (Demonstration channels)"
                variant="info"
              />
            ) : null}

            {authMode === 'signin' ? (
              <form
                aria-labelledby="tab-signin"
                className="space-y-5"
                id="panel-signin"
                noValidate
                onSubmit={handleSubmit}
                role="tabpanel"
              >
                <div>
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="login-user-id"
                  >
                    {labels.userIdLabel}
                  </label>
                  <input
                    aria-describedby={
                      errors.userId ? 'login-user-id-error' : undefined
                    }
                    aria-invalid={errors.userId ? 'true' : undefined}
                    autoComplete="username"
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-foreground shadow-sm placeholder:text-foreground-subtle focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="login-user-id"
                    onChange={(event) => {
                      setUserId(event.target.value);
                      setErrors((currentErrors) => ({
                        ...currentErrors,
                        userId: '',
                      }));
                    }}
                    placeholder="Enter demo user ID"
                    type="text"
                    value={userId}
                  />
                  {errors.userId ? (
                    <p
                      className="mt-1 text-sm text-danger-700"
                      id="login-user-id-error"
                      role="alert"
                    >
                      {errors.userId}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="login-password"
                  >
                    {labels.passwordLabel}
                  </label>
                  <div className="relative mt-1">
                    <input
                      aria-describedby={
                        errors.password ? 'login-password-error' : undefined
                      }
                      aria-invalid={errors.password ? 'true' : undefined}
                      autoComplete="current-password"
                      className="w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 pr-20 text-foreground shadow-sm placeholder:text-foreground-subtle focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                      id="login-password"
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrors((currentErrors) => ({
                          ...currentErrors,
                          password: '',
                        }));
                      }}
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                    />
                    <button
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-sm font-semibold text-primary hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      onClick={() => setShowPassword((visible) => !visible)}
                      onMouseDown={(event) => event.preventDefault()}
                      type="button"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password ? (
                    <p
                      className="mt-1 text-sm text-danger-700"
                      id="login-password-error"
                      role="alert"
                    >
                      {errors.password}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-foreground-muted">
                    <input
                      checked={rememberId}
                      className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary-500"
                      onChange={(event) => setRememberId(event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      {labels.rememberLabel}
                      <span className="sr-only">
                        {' '}
                        ({FILIPINO_LABELS.account})
                      </span>
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="text-sm font-semibold text-primary hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      disabled={isRecovering}
                      onClick={() => handleRecovery('userId')}
                      type="button"
                    >
                      {labels.forgotUserId}
                    </button>
                    <span aria-hidden="true" className="text-border-strong">|</span>
                    <button
                      className="text-sm font-semibold text-primary hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      disabled={isRecovering}
                      onClick={() => handleRecovery('password')}
                      type="button"
                    >
                      {isRecovering ? 'Loading...' : labels.forgotPassword}
                    </button>
                  </div>
                </div>

                <Button
                  disabled={isSubmitting}
                  fullWidth
                  loading={isSubmitting}
                  loadingText={AUTH_MESSAGES.signingIn}
                  type="submit"
                >
                  {labels.signInButton}
                </Button>

                <div className="pt-2 text-center text-sm text-foreground-muted">
                  {labels.notRegistered}{' '}
                  <button
                    className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() => {
                      setAuthMode('register');
                      setErrors({});
                      setSubmitError('');
                    }}
                    type="button"
                  >
                    {labels.registerNow}
                  </button>
                </div>
              </form>
            ) : (
              <form
                aria-labelledby="tab-register"
                className="space-y-4"
                id="panel-register"
                noValidate
                onSubmit={handleRegisterSubmit}
                role="tabpanel"
              >
                <div>
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="reg-account-type"
                  >
                    Account Type
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="reg-account-type"
                    onChange={(e) => setRegAccountType(e.target.value)}
                    value={regAccountType}
                  >
                    <option value="deposit">Deposit Account (Savings or Checking)</option>
                    <option value="card">Credit Card or Debit Card</option>
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="reg-account-number"
                  >
                    {regAccountType === 'deposit'
                      ? 'Deposit Account Number (10 digits)'
                      : 'Card Number (16 digits)'}
                  </label>
                  <input
                    aria-describedby={regErrors.accountNumber ? 'reg-account-error' : undefined}
                    aria-invalid={regErrors.accountNumber ? 'true' : undefined}
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-foreground shadow-sm placeholder:text-foreground-subtle focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="reg-account-number"
                    onChange={(e) => {
                      setRegAccountNumber(e.target.value);
                      setRegErrors((prev) => ({ ...prev, accountNumber: '' }));
                    }}
                    placeholder={
                      regAccountType === 'deposit'
                        ? 'e.g. 0012-3456-78'
                        : 'e.g. 4510 1234 5678 9010'
                    }
                    type="text"
                    value={regAccountNumber}
                  />
                  {regErrors.accountNumber ? (
                    <p className="mt-1 text-sm text-danger-700" id="reg-account-error" role="alert">
                      {regErrors.accountNumber}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="reg-dob"
                  >
                    Date of Birth
                  </label>
                  <input
                    aria-describedby={regErrors.dateOfBirth ? 'reg-dob-error' : undefined}
                    aria-invalid={regErrors.dateOfBirth ? 'true' : undefined}
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-foreground shadow-sm focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="reg-dob"
                    onChange={(e) => {
                      setRegDateOfBirth(e.target.value);
                      setRegErrors((prev) => ({ ...prev, dateOfBirth: '' }));
                    }}
                    type="date"
                    value={regDateOfBirth}
                  />
                  {regErrors.dateOfBirth ? (
                    <p className="mt-1 text-sm text-danger-700" id="reg-dob-error" role="alert">
                      {regErrors.dateOfBirth}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-foreground"
                    htmlFor="reg-user-id"
                  >
                    Desired User ID
                  </label>
                  <input
                    aria-describedby={regErrors.userId ? 'reg-user-id-error' : undefined}
                    aria-invalid={regErrors.userId ? 'true' : undefined}
                    autoComplete="username"
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-foreground shadow-sm placeholder:text-foreground-subtle focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                    id="reg-user-id"
                    onChange={(e) => {
                      setRegUserId(e.target.value);
                      setRegErrors((prev) => ({ ...prev, userId: '' }));
                    }}
                    placeholder="Create your BPI User ID"
                    type="text"
                    value={regUserId}
                  />
                  {regErrors.userId ? (
                    <p className="mt-1 text-sm text-danger-700" id="reg-user-id-error" role="alert">
                      {regErrors.userId}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      className="block text-sm font-medium text-foreground"
                      htmlFor="reg-password"
                    >
                      Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        aria-describedby={regErrors.password ? 'reg-password-error' : undefined}
                        aria-invalid={regErrors.password ? 'true' : undefined}
                        autoComplete="new-password"
                        className="w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 pr-16 text-foreground shadow-sm focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                        id="reg-password"
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          setRegErrors((prev) => ({ ...prev, password: '' }));
                        }}
                        placeholder="At least 6 chars"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                      />
                      <button
                        className="absolute inset-y-0 right-1.5 my-auto h-7 px-1.5 text-xs font-semibold text-primary"
                        onClick={() => setShowRegPassword((v) => !v)}
                        type="button"
                      >
                        {showRegPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {regErrors.password ? (
                      <p className="mt-1 text-xs text-danger-700" id="reg-password-error" role="alert">
                        {regErrors.password}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-foreground"
                      htmlFor="reg-confirm-password"
                    >
                      Confirm Password
                    </label>
                    <input
                      aria-describedby={
                        regErrors.confirmPassword ? 'reg-confirm-password-error' : undefined
                      }
                      aria-invalid={regErrors.confirmPassword ? 'true' : undefined}
                      autoComplete="new-password"
                      className="mt-1 w-full rounded-md border border-border-strong bg-surface-muted px-3 py-2 text-foreground shadow-sm focus:border-primary-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                      id="reg-confirm-password"
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        setRegErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="Re-enter password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                    />
                    {regErrors.confirmPassword ? (
                      <p
                        className="mt-1 text-xs text-danger-700"
                        id="reg-confirm-password-error"
                        role="alert"
                      >
                        {regErrors.confirmPassword}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="flex items-start gap-2.5 text-xs text-foreground-muted">
                    <input
                      checked={regAgreeTerms}
                      className="mt-0.5 h-4 w-4 rounded border-border-strong text-primary focus:ring-primary-500"
                      onChange={(e) => {
                        setRegAgreeTerms(e.target.checked);
                        setRegErrors((prev) => ({ ...prev, terms: '' }));
                      }}
                      type="checkbox"
                    />
                    <span>
                      I agree to the BPI Online Banking Terms and Conditions and
                      Privacy Policy.
                    </span>
                  </label>
                  {regErrors.terms ? (
                    <p className="mt-1 text-xs text-danger-700" role="alert">
                      {regErrors.terms}
                    </p>
                  ) : null}
                </div>

                <Button
                  disabled={isRegistering}
                  fullWidth
                  loading={isRegistering}
                  loadingText="Registering..."
                  type="submit"
                >
                  {labels.registerButton}
                </Button>

                <div className="pt-2 text-center text-sm text-foreground-muted">
                  {labels.alreadyRegistered}{' '}
                  <button
                    className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrors({});
                      setSubmitError('');
                    }}
                    type="button"
                  >
                    {labels.signInNow}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() =>
                    setInfoPanel((current) =>
                      current === 'contact' ? null : 'contact',
                    )
                  }
                  type="button"
                >
                  {labels.contactUs}
                </button>
                <button
                  className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() =>
                    setInfoPanel((current) =>
                      current === 'security' ? null : 'security',
                    )
                  }
                  type="button"
                >
                  {labels.securityGuidance}
                </button>
              </div>

              <button
                className="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={handleResetLockAndDemo}
                type="button"
              >
                Reset demonstration
              </button>
            </div>
          </section>

          <aside className="space-y-6">
            <Card
              heading="Workshop demo credentials"
              subtitle="Select a workshop customer below or enter the credentials directly"
            >
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border border-border bg-surface-muted p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">
                        Miguel (Primary workshop customer)
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        Everyday banking, Peso savings, Credit card &amp; Home loan
                      </p>
                    </div>
                    <button
                      className="shrink-0 rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-primary-50 hover:text-primary"
                      onClick={() => fillDemoCredentials('miguel', 'demo-only')}
                      type="button"
                    >
                      Use Miguel
                    </button>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-2.5 text-xs">
                    <div>
                      <dt className="text-foreground-muted">User ID</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-foreground">
                        miguel
                      </dd>
                    </div>
                    <div>
                      <dt className="text-foreground-muted">Password</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-foreground">
                        demo-only
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border border-border bg-surface-muted p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">
                        Rosa (Second workshop customer)
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        Salary account &amp; Home loan (facilitator profile switch)
                      </p>
                    </div>
                    <button
                      className="shrink-0 rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-primary-50 hover:text-primary"
                      onClick={() => fillDemoCredentials('rosa', 'demo-only')}
                      type="button"
                    >
                      Use Rosa
                    </button>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-2.5 text-xs">
                    <div>
                      <dt className="text-foreground-muted">User ID</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-foreground">
                        rosa
                      </dd>
                    </div>
                    <div>
                      <dt className="text-foreground-muted">Password</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-foreground">
                        demo-only
                      </dd>
                    </div>
                  </dl>
                </div>

                <p className="border-t border-border pt-3 text-xs text-foreground-subtle">
                  Use the workshop credentials above for quick access to pre-configured demo profiles, or switch to the Register tab to create and test a new user account.
                </p>
              </div>
            </Card>

            <Card heading="Security guidance">
              <ul className="space-y-2.5 text-sm text-foreground-muted">
                <li className="flex gap-2">
                  <span aria-hidden="true" className="font-bold text-accent-mint">
                    ✓
                  </span>
                  <span>This build is a static front-end workshop simulation.</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true" className="font-bold text-accent-mint">
                    ✓
                  </span>
                  <span>Remember User ID stores only the User ID in local storage, never the password.</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true" className="font-bold text-accent-mint">
                    ✓
                  </span>
                  <span>Three wrong passwords for the same User ID trigger a simulated lock. Reset clears it.</span>
                </li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

LoginPage.displayName = 'LoginPage';

LoginPage.propTypes = {
  className: () => null,
  onLogin: () => null,
  onSuccess: () => null,
};

export {
  getDestination,
  normalizeText,
  validateLoginFields,
};

export default LoginPage;
