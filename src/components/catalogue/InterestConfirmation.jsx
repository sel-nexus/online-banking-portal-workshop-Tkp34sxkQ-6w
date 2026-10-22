import React, { useRef } from 'react';
import Dialog from '../accessibility/Dialog';
import Button from '../ui/Button';

const childrenPropType = () => null;

function getItemIdentifier(item) {
  return item?.id || item?.productId || item?.offerId || null;
}

function getItemName(item) {
  return item?.name || item?.title || 'this item';
}

function getItemType(item, type) {
  if (type) {
    return String(type).trim().toLowerCase();
  }

  if (item?.offerId || item?.offer || item?.title) {
    return 'offer';
  }

  return 'product';
}

/**
 * Renders a confirmation dialog for simulated interest in a product or offer.
 *
 * The dialog clearly communicates that the action is for demonstration only
 * and that no application, offer redemption, or account change is submitted.
 *
 * @param {object} props Component properties.
 * @param {boolean} props.open Whether the dialog is open.
 * @param {boolean} props.isOpen Alias for open.
 * @param {Function} props.onClose Callback invoked when the dialog closes.
 * @param {Function} props.onCancel Alias for onClose.
 * @param {Function} props.onConfirm Callback invoked to confirm interest.
 * @param {Function} props.onConfirmInterest Alias for onConfirm.
 * @param {Function} props.onInterest Alias for onConfirm.
 * @param {object} props.product Product associated with the confirmation.
 * @param {object} props.offer Offer associated with the confirmation.
 * @param {object} props.item Product or offer associated with the confirmation.
 * @param {string} props.name Optional item-name override.
 * @param {string} props.type Optional item-type override.
 * @param {boolean} props.loading Whether confirmation is processing.
 * @param {boolean} props.disabled Whether confirmation is disabled.
 * @param {string} props.confirmLabel Confirmation-button label.
 * @param {string} props.cancelLabel Cancel-button label.
 * @param {string} props.className Additional dialog classes.
 * @returns {JSX.Element|null} Interest-confirmation dialog.
 */
function InterestConfirmation({
  cancelLabel = 'Cancel',
  className = '',
  confirmLabel = 'Confirm interest',
  disabled = false,
  isOpen,
  item,
  loading = false,
  name,
  offer,
  onCancel,
  onClose,
  onConfirm,
  onConfirmInterest,
  onInterest,
  open = false,
  product,
  type,
  ...props
}) {
  const cancelButtonRef = useRef(null);
  const resolvedItem = item || product || offer || {};
  const resolvedName = name || getItemName(resolvedItem);
  const resolvedType = getItemType(resolvedItem, type);
  const resolvedOnClose = onClose || onCancel;
  const resolvedOnConfirm =
    onConfirm || onConfirmInterest || onInterest;
  const isDialogOpen = isOpen ?? open;
  const itemIdentifier = getItemIdentifier(resolvedItem);

  const handleConfirm = (event) => {
    resolvedOnConfirm?.(resolvedItem, {
      event,
      id: itemIdentifier,
      type: resolvedType,
      simulated: true,
    });
  };

  return (
    <Dialog
      {...props}
      className={className}
      initialFocusRef={cancelButtonRef}
      label="Express interest"
      onClose={resolvedOnClose}
      open={isDialogOpen}
      title="Express your interest"
    >
      <div className="space-y-5">
        <p className="text-sm text-foreground">
          Would you like to express your interest in{' '}
          <strong>{resolvedName}</strong>?
        </p>

        <div className="rounded-lg border border-border bg-surface-muted p-4 text-sm text-foreground-muted">
          <p className="font-semibold text-foreground">Product Information &amp; Follow-up</p>
          <p className="mt-1">
            By submitting, our BPI relationship team will record your inquiry for {resolvedName} and follow up with eligibility details and personalized documentation.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            onClick={resolvedOnClose}
            ref={cancelButtonRef}
            type="button"
            variant="secondary"
          >
            {cancelLabel}
          </Button>
          <Button
            disabled={disabled || !resolvedOnConfirm}
            loading={loading}
            loadingText="Confirming..."
            onClick={handleConfirm}
            type="button"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

InterestConfirmation.displayName = 'InterestConfirmation';

InterestConfirmation.propTypes = {
  cancelLabel: () => null,
  className: () => null,
  confirmLabel: () => null,
  disabled: () => null,
  isOpen: () => null,
  item: () => null,
  loading: () => null,
  name: () => null,
  offer: () => null,
  onCancel: () => null,
  onClose: () => null,
  onConfirm: () => null,
  onConfirmInterest: () => null,
  onInterest: () => null,
  open: () => null,
  product: () => null,
  type: () => null,
};

export {
  getItemIdentifier,
  getItemName,
  getItemType,
};

export default InterestConfirmation;