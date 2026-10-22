import React, {
  useEffect,
  useId,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import useFocusReturn from '../../hooks/useFocusReturn';
import {
  focusElement,
  focusInitialElement,
  trapFocus,
} from '../../utils/focusUtils';

const childrenPropType = () => null;

const OVERLAY_BASE_CLASSES =
  'fixed inset-0 z-50 flex overflow-y-auto bg-black/50';

const PANEL_BASE_CLASSES =
  'relative flex max-h-screen w-full flex-col border-border bg-surface shadow-xl';

const HEADER_CLASSES =
  'flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6';

const CONTENT_CLASSES = 'min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6';

const SIDE_DEFINITIONS = Object.freeze({
  bottom: Object.freeze({
    overlay: 'items-end justify-center',
    panel: 'max-h-[90vh] rounded-t-xl border-t',
  }),
  left: Object.freeze({
    overlay: 'items-stretch justify-start',
    panel: 'h-full max-w-md rounded-r-xl border-r',
  }),
  right: Object.freeze({
    overlay: 'items-stretch justify-end',
    panel: 'h-full max-w-md rounded-l-xl border-l',
  }),
  top: Object.freeze({
    overlay: 'items-start justify-center',
    panel: 'max-h-[90vh] rounded-b-xl border-b',
  }),
});

function normalizeSide(value) {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase();

  return SIDE_DEFINITIONS[normalizedValue] ? normalizedValue : 'right';
}

/**
 * Renders an accessible side panel with focus management and keyboard
 * interaction support.
 *
 * @param {object} props Component properties.
 * @param {boolean} props.open Whether the drawer is open.
 * @param {boolean} props.isOpen Alias for open.
 * @param {Function} props.onClose Callback invoked when the drawer requests closing.
 * @param {Function} props.onRequestClose Alias for onClose.
 * @param {React.ReactNode} props.children Drawer content.
 * @param {React.ReactNode} props.title Drawer heading.
 * @param {React.ReactNode} props.description Supporting drawer description.
 * @param {string} props.label Accessible drawer label.
 * @param {string} props.labelledBy ID of the element labelling the drawer.
 * @param {string} props.describedBy ID or IDs describing the drawer.
 * @param {object} props.initialFocusRef Ref for the element receiving initial focus.
 * @param {object} props.returnFocusRef Ref for the element receiving focus on close.
 * @param {'left'|'right'|'top'|'bottom'} props.side Drawer placement.
 * @param {'left'|'right'|'top'|'bottom'} props.position Alias for side.
 * @param {'left'|'right'|'top'|'bottom'} props.placement Alias for side.
 * @param {boolean} props.closeOnEscape Whether Escape closes the drawer.
 * @param {boolean} props.closeOnOverlayClick Whether clicking the overlay closes the drawer.
 * @param {boolean} props.showCloseButton Whether to render the close button.
 * @param {string} props.closeLabel Accessible close-button label.
 * @param {string} props.className Additional drawer classes.
 * @param {string} props.overlayClassName Additional overlay classes.
 * @param {string} props.panelClassName Additional drawer panel classes.
 * @returns {JSX.Element|null} Accessible drawer overlay.
 */
function Drawer({
  children,
  className = '',
  closeLabel = 'Close drawer',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  describedBy,
  description,
  initialFocusRef,
  isOpen,
  label = 'Drawer',
  labelledBy,
  onClose,
  onRequestClose,
  open = false,
  overlayClassName = '',
  panelClassName = '',
  placement,
  position,
  returnFocusRef,
  showCloseButton = true,
  side = 'right',
  title,
  ...props
}) {
  const drawerRef = useRef(null);
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const isDrawerOpen = isOpen ?? open;
  const resolvedOnClose = onClose || onRequestClose;
  const resolvedSide = normalizeSide(placement || position || side);
  const sideDefinition = SIDE_DEFINITIONS[resolvedSide];
  const titleId = title
    ? labelledBy || `drawer-title-${generatedTitleId}`
    : labelledBy;
  const descriptionId = description
    ? describedBy || `drawer-description-${generatedDescriptionId}`
    : describedBy;

  useFocusReturn({
    isOpen: isDrawerOpen,
    triggerRef: returnFocusRef,
    restoreOnClose: true,
  });

  useEffect(() => {
    if (!isDrawerOpen || !drawerRef.current) {
      return undefined;
    }

    const drawerElement = drawerRef.current;
    const preferredFocusElement = initialFocusRef?.current || null;

    if (preferredFocusElement) {
      focusElement(preferredFocusElement);
    } else {
      focusInitialElement(drawerElement);

      if (document.activeElement === document.body) {
        focusElement(drawerElement);
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        trapFocus(event, drawerElement);
      }
    };

    drawerElement.addEventListener('keydown', handleKeyDown);

    return () => {
      drawerElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [initialFocusRef, isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen || !closeOnEscape) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        resolvedOnClose?.(event);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeOnEscape, isDrawerOpen, resolvedOnClose]);

  if (!isDrawerOpen || typeof document === 'undefined' || !document.body) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (
      closeOnOverlayClick &&
      event.target === event.currentTarget
    ) {
      resolvedOnClose?.(event);
    }
  };

  const drawerContent = (
    <div
      aria-label={!titleId ? label : undefined}
      aria-describedby={descriptionId || undefined}
      aria-labelledby={titleId || undefined}
      aria-modal="true"
      className={`${PANEL_BASE_CLASSES} ${sideDefinition.panel} ${className} ${panelClassName}`.trim()}
      onClick={(event) => event.stopPropagation()}
      ref={drawerRef}
      role="dialog"
      tabIndex="-1"
      {...props}
    >
      {title || description || showCloseButton ? (
        <header className={HEADER_CLASSES}>
          <div className="min-w-0">
            {title ? (
              <h2
                className="text-lg font-semibold text-foreground sm:text-xl"
                id={titleId}
              >
                {title}
              </h2>
            ) : null}

            {description ? (
              <p
                className={`${title ? 'mt-1' : ''} text-sm text-foreground-muted`.trim()}
                id={descriptionId}
              >
                {description}
              </p>
            ) : null}
          </div>

          {showCloseButton ? (
            <button
              aria-label={closeLabel}
              className="shrink-0 rounded-md p-2 text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              onClick={resolvedOnClose}
              type="button"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            </button>
          ) : null}
        </header>
      ) : null}

      {children !== undefined && children !== null ? (
        <div className={CONTENT_CLASSES}>{children}</div>
      ) : null}
    </div>
  );

  return createPortal(
    <div
      aria-label="Drawer overlay"
      className={`${OVERLAY_BASE_CLASSES} ${sideDefinition.overlay} ${overlayClassName}`.trim()}
      onClick={handleOverlayClick}
      role="presentation"
    >
      {drawerContent}
    </div>,
    document.body,
  );
}

Drawer.displayName = 'Drawer';

Drawer.propTypes = {
  children: childrenPropType,
  className: () => null,
  closeLabel: () => null,
  closeOnEscape: () => null,
  closeOnOverlayClick: () => null,
  describedBy: () => null,
  description: childrenPropType,
  initialFocusRef: () => null,
  isOpen: () => null,
  label: () => null,
  labelledBy: () => null,
  onClose: () => null,
  onRequestClose: () => null,
  open: () => null,
  overlayClassName: () => null,
  panelClassName: () => null,
  placement: () => null,
  position: () => null,
  returnFocusRef: () => null,
  showCloseButton: () => null,
  side: () => null,
  title: childrenPropType,
};

export { SIDE_DEFINITIONS, normalizeSide };

export default Drawer;