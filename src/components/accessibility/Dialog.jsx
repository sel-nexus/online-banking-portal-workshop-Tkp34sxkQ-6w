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

const OVERLAY_CLASSES =
  'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6';

const DIALOG_CLASSES =
  'relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-xl';

const HEADER_CLASSES =
  'flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6';

const CONTENT_CLASSES = 'px-5 py-5 sm:px-6 sm:py-6';

/**
 * Renders an accessible modal dialog with focus management and keyboard
 * interaction support.
 *
 * @param {object} props Component properties.
 * @param {boolean} props.open Whether the dialog is open.
 * @param {boolean} props.isOpen Alias for open.
 * @param {Function} props.onClose Callback invoked when the dialog requests closing.
 * @param {React.ReactNode} props.children Dialog content.
 * @param {React.ReactNode} props.title Dialog heading.
 * @param {React.ReactNode} props.description Supporting dialog description.
 * @param {string} props.label Accessible dialog label.
 * @param {string} props.labelledBy ID of the element labelling the dialog.
 * @param {string} props.describedBy ID or IDs describing the dialog.
 * @param {object} props.initialFocusRef Ref for the element receiving initial focus.
 * @param {object} props.returnFocusRef Ref for the element receiving focus on close.
 * @param {boolean} props.closeOnEscape Whether Escape closes the dialog.
 * @param {boolean} props.closeOnOverlayClick Whether clicking the overlay closes the dialog.
 * @param {boolean} props.showCloseButton Whether to render the close button.
 * @param {string} props.closeLabel Accessible close-button label.
 * @param {string} props.className Additional dialog classes.
 * @param {string} props.overlayClassName Additional overlay classes.
 * @returns {JSX.Element|null} Accessible dialog overlay.
 */
function Dialog({
  children,
  className = '',
  closeLabel = 'Close dialog',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  describedBy,
  description,
  initialFocusRef,
  isOpen,
  label = 'Dialog',
  labelledBy,
  onClose,
  open = false,
  overlayClassName = '',
  returnFocusRef,
  showCloseButton = true,
  title,
  ...props
}) {
  const dialogRef = useRef(null);
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const isDialogOpen = isOpen ?? open;
  const titleId = title ? labelledBy || `dialog-title-${generatedTitleId}` : labelledBy;
  const descriptionId = description
    ? describedBy || `dialog-description-${generatedDescriptionId}`
    : describedBy;

  useFocusReturn({
    isOpen: isDialogOpen,
    triggerRef: returnFocusRef,
    restoreOnClose: true,
  });

  useEffect(() => {
    if (!isDialogOpen || !dialogRef.current) {
      return undefined;
    }

    const dialogElement = dialogRef.current;
    const preferredFocusElement = initialFocusRef?.current || null;

    if (preferredFocusElement) {
      focusElement(preferredFocusElement);
    } else {
      focusInitialElement(dialogElement);

      if (document.activeElement === document.body) {
        focusElement(dialogElement);
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        trapFocus(event, dialogElement);
      }
    };

    dialogElement.addEventListener('keydown', handleKeyDown);

    return () => {
      dialogElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [initialFocusRef, isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen || !closeOnEscape) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        onClose?.(event);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeOnEscape, isDialogOpen, onClose]);

  if (!isDialogOpen || typeof document === 'undefined' || !document.body) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (
      closeOnOverlayClick &&
      event.target === event.currentTarget
    ) {
      onClose?.(event);
    }
  };

  const dialogContent = (
    <div
      aria-label={!titleId ? label : undefined}
      aria-labelledby={titleId || undefined}
      aria-modal="true"
      aria-describedby={descriptionId || undefined}
      className={`${DIALOG_CLASSES} ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
      ref={dialogRef}
      role="dialog"
      tabIndex="-1"
      {...props}
    >
      {title || showCloseButton ? (
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
              onClick={onClose}
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
      aria-label="Dialog overlay"
      className={`${OVERLAY_CLASSES} ${overlayClassName}`.trim()}
      onClick={handleOverlayClick}
      role="presentation"
    >
      {dialogContent}
    </div>,
    document.body,
  );
}

Dialog.displayName = 'Dialog';

Dialog.propTypes = {
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
  open: () => null,
  overlayClassName: () => null,
  returnFocusRef: () => null,
  showCloseButton: () => null,
  title: childrenPropType,
};

export { Dialog };

export default Dialog;