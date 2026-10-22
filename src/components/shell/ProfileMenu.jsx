import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { DEMO_LABELS } from '../../config/constants';
import { SIMULATION_MESSAGES } from '../../config/messages';
import { PROFILES } from '../../fixtures/profiles';
import { useAccess } from '../../contexts/AccessContext';
import { useCustomerProfile } from '../../contexts/CustomerProfileContext';
import { useDemoDispatch } from '../../store/DemoStoreContext';

const DEFAULT_LANGUAGES = Object.freeze([
  Object.freeze({
    value: 'English',
    label: 'English',
  }),
  Object.freeze({
    value: 'Filipino',
    label: 'Filipino',
  }),
]);

function getDisplayName(profile) {
  return (
    profile?.fullName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    profile?.name ||
    'Demo user'
  );
}

function getInitials(profile) {
  const firstName = String(profile?.firstName || '').trim();
  const lastName = String(profile?.lastName || '').trim();

  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  return (
    String(profile?.fullName || profile?.name || 'User')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'U'
  );
}

function normalizeLanguages(languages) {
  if (!Array.isArray(languages) || languages.length === 0) {
    return DEFAULT_LANGUAGES;
  }

  return languages
    .map((language) => {
      if (typeof language === 'string') {
        return {
          value: language,
          label: language,
        };
      }

      return {
        value: language?.value || language?.code || language?.label || '',
        label: language?.label || language?.name || language?.value || '',
      };
    })
    .filter((language) => language.value && language.label);
}

/**
 * Renders profile actions and demonstration controls.
 *
 * @param {object} props Component properties.
 * @param {object} props.profile Profile to display.
 * @param {object[]} props.profiles Profiles available for switching.
 * @param {string[]} props.languages Available language choices.
 * @param {string} props.language Selected language.
 * @param {boolean} props.open Whether the menu is open.
 * @param {Function} props.onOpenChange Callback invoked when menu visibility changes.
 * @param {Function} props.onLanguageChange Callback invoked when the language changes.
 * @param {Function} props.onProfileChange Callback invoked after switching profiles.
 * @param {Function} props.onLogout Callback invoked after logout.
 * @param {Function} props.onReset Callback invoked after resetting the demo.
 * @param {Function} props.onFailureSimulationChange Callback invoked when failure simulation changes.
 * @param {string} props.className Additional menu classes.
 * @returns {JSX.Element} Profile menu.
 */
function ProfileMenu({
  className = '',
  failureSimulation = false,
  language,
  languages = DEFAULT_LANGUAGES,
  onFailureSimulationChange,
  onLanguageChange,
  onLogout,
  onOpenChange,
  onProfileChange,
  onReset,
  onResetDemo,
  onToggleFailureSimulation,
  open: controlledOpen,
  profile: providedProfile,
  profiles = PROFILES,
}) {
  const access = useAccess();
  const customerProfile = useCustomerProfile();
  const dispatch = useDemoDispatch();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    language || customerProfile.profile?.preferredLanguage || 'English',
  );
  const [internalFailureSimulation, setInternalFailureSimulation] =
    useState(failureSimulation);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const profile =
    providedProfile || access.profile || customerProfile.profile || null;
  const displayName = getDisplayName(profile);
  const initials = getInitials(profile);
  const normalizedLanguages = normalizeLanguages(languages);
  const resolvedFailureSimulation =
    onFailureSimulationChange || onToggleFailureSimulation
      ? failureSimulation
      : internalFailureSimulation;

  useEffect(() => {
    if (language !== undefined) {
      setSelectedLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    if (failureSimulation !== undefined) {
      setInternalFailureSimulation(failureSimulation);
    }
  }, [failureSimulation]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setInternalOpen(false);
        onOpenChange?.(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setInternalOpen(false);
        onOpenChange?.(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  const setMenuOpen = (nextOpen) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;

    setSelectedLanguage(nextLanguage);
    onLanguageChange?.(nextLanguage);
  };

  const handleProfileChange = (event) => {
    const nextProfileId = event.target.value;
    const nextProfile =
      profiles.find(
        (candidate) =>
          String(candidate?.id || candidate?.profileId || '') ===
          String(nextProfileId),
      ) || null;

    if (!nextProfile) {
      return;
    }

    customerProfile.switchProfile(nextProfile);
    onProfileChange?.(nextProfile);
  };

  const handleFailureSimulationChange = (event) => {
    const enabled = event.target.checked;

    setInternalFailureSimulation(enabled);
    onFailureSimulationChange?.(enabled);
    onToggleFailureSimulation?.(enabled);
    dispatch({
      type: 'facilitator/setFailureSimulation',
      payload: {
        enabled,
      },
    });
  };

  const handleReset = () => {
    const resetHandler = onReset || onResetDemo;

    if (resetHandler) {
      resetHandler();
    } else {
      customerProfile.resetDemo();
    }

    setMenuOpen(false);
  };

  const handleLogout = () => {
    access.logout();
    onLogout?.();
    navigate(ROUTES.LOGIN, { replace: true });
    setMenuOpen(false);
  };

  return (
    <div className={`relative ${className}`.trim()} ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Open profile menu for ${displayName}`}
        className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        onClick={() => setMenuOpen(!isOpen)}
        type="button"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
        >
          {initials}
        </span>
        <span className="hidden max-w-40 text-left sm:block">
          <span className="block truncate text-sm font-semibold text-foreground">
            {displayName}
          </span>
          <span className="block text-xs text-foreground-muted">
            Personal Banking
          </span>
        </span>
        <span aria-hidden="true" className="text-xs text-foreground-muted">
          ▾
        </span>
      </button>

      {isOpen ? (
        <div
          aria-label="Profile menu"
          className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-4 shadow-xl"
          role="menu"
        >
          <div className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-sm text-foreground-muted">
                  {customerProfile.maskedUserId || 'Masked user ID unavailable'}
                </p>
                <p className="mt-1 text-xs text-accent-mint font-medium">
                  Active • Verified Customer
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 py-4">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-foreground"
                htmlFor="profile-menu-language"
              >
                Language
              </label>
              <select
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                id="profile-menu-language"
                onChange={handleLanguageChange}
                value={selectedLanguage}
              >
                {normalizedLanguages.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {profiles.length > 1 ? (
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-foreground"
                  htmlFor="profile-menu-profile"
                >
                  Facilitator profile
                </label>
                <select
                  className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  id="profile-menu-profile"
                  onChange={handleProfileChange}
                  value={profile?.id || profile?.profileId || ''}
                >
                  {profiles.map((candidate) => (
                    <option
                      key={candidate.id || candidate.profileId}
                      value={candidate.id || candidate.profileId}
                    >
                      {getDisplayName(candidate)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <label className="flex items-start gap-3 text-sm text-foreground">
              <input
                checked={resolvedFailureSimulation}
                className="mt-0.5 h-4 w-4 rounded border-border-strong text-primary focus:ring-primary-500"
                onChange={handleFailureSimulationChange}
                type="checkbox"
              />
              <span>
                <span className="block font-medium">
                  Simulate service failures
                </span>
                <span className="mt-1 block text-xs text-foreground-muted">
                  Enable failure states for testing and demonstrations.
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-1 border-t border-border pt-3">
            <button
              className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={() => {
                navigate(ROUTES.PROFILE);
                setMenuOpen(false);
              }}
              role="menuitem"
              type="button"
            >
              View profile
            </button>
            <button
              className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-foreground-muted hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={handleReset}
              role="menuitem"
              type="button"
            >
              Reset demonstration
            </button>
            <button
              className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-danger-700 hover:bg-danger-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
              onClick={handleLogout}
              role="menuitem"
              type="button"
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

ProfileMenu.displayName = 'ProfileMenu';

ProfileMenu.propTypes = {
  className: () => null,
  failureSimulation: () => null,
  language: () => null,
  languages: () => null,
  onFailureSimulationChange: () => null,
  onLanguageChange: () => null,
  onLogout: () => null,
  onOpenChange: () => null,
  onProfileChange: () => null,
  onReset: () => null,
  onResetDemo: () => null,
  onToggleFailureSimulation: () => null,
  open: () => null,
  profile: () => null,
  profiles: () => null,
};

export { getDisplayName, getInitials };

export default ProfileMenu;