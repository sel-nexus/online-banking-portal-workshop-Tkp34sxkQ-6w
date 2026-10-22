import React, { useState } from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alert from './feedback/Alert';
import Dialog from './accessibility/Dialog';
import LiveRegion from './accessibility/LiveRegion';
import TextInput from './ui/TextInput';
import Button from './ui/Button';

describe('Accessibility components', () => {
  it('moves keyboard focus to an interactive button and exposes visible focus styles', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <button type="button">Before</button>
        <Button>Continue</Button>
      </div>,
    );

    const continueButton = screen.getByRole('button', {
      name: 'Continue',
    });

    await user.tab();

    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();

    await user.tab();

    expect(continueButton).toHaveFocus();
    expect(continueButton.className).toContain('focus-visible:ring');
    expect(continueButton).toHaveAttribute('type', 'button');
  });

  it('closes a dialog with Escape and restores focus to its trigger', async () => {
    const user = userEvent.setup();

    function DialogExample() {
      const [isOpen, setIsOpen] = useState(false);
      const triggerRef = React.useRef(null);

      return (
        <>
          <button
            onClick={() => setIsOpen(true)}
            ref={triggerRef}
            type="button"
          >
            Open confirmation
          </button>

          <Dialog
            onClose={() => setIsOpen(false)}
            open={isOpen}
            returnFocusRef={triggerRef}
            title="Confirmation"
          >
            <p>Review this simulated action before continuing.</p>
          </Dialog>
        </>
      );
    }

    render(<DialogExample />);

    const trigger = screen.getByRole('button', {
      name: 'Open confirmation',
    });

    await user.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Confirmation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Confirmation' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('traps keyboard focus within an open dialog', async () => {
    const user = userEvent.setup();

    render(
      <Dialog
        onClose={() => {}}
        open
        title="Keyboard dialog"
      >
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </Dialog>,
    );

    const closeButton = screen.getByRole('button', {
      name: 'Close dialog',
    });
    const firstAction = screen.getByRole('button', {
      name: 'First action',
    });
    const lastAction = screen.getByRole('button', {
      name: 'Last action',
    });

    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(firstAction).toHaveFocus();

    await user.tab();
    expect(lastAction).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(lastAction).toHaveFocus();
  });

  it('renders polite live announcements with accessible status semantics', () => {
    render(
      <LiveRegion message="Your account balance has been updated." />,
    );

    const liveRegion = screen.getByRole('status');

    expect(liveRegion).toHaveTextContent(
      'Your account balance has been updated.',
    );
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion.className).toContain('sr-only');
  });

  it('renders assertive live announcements as alerts', () => {
    render(
      <LiveRegion
        message="Your session has expired."
        politeness="assertive"
      />,
    );

    const liveRegion = screen.getByRole('alert');

    expect(liveRegion).toHaveTextContent('Your session has expired.');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders alert messages with the requested role and dismisses them', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <Alert
        dismissible
        message="Your simulated transfer is complete."
        onDismiss={onDismiss}
        role="status"
        title="Transfer complete"
        variant="success"
      />,
    );

    const alert = screen.getByRole('status');

    expect(alert).toHaveTextContent('Transfer complete');
    expect(alert).toHaveTextContent('Your simulated transfer is complete.');
    expect(screen.getByRole('button', { name: 'Dismiss alert' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss alert' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('associates text-input errors with the invalid control', () => {
    render(
      <TextInput
        error="Enter your password."
        id="password"
        label="Password"
        type="password"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Password' });
    const error = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'password-error');
    expect(input).toHaveAttribute('aria-errormessage', 'password-error');
    expect(error).toHaveAttribute('id', 'password-error');
    expect(error).toHaveTextContent('Enter your password.');
  });

  it('does not expose an error association when no validation error exists', () => {
    render(
      <TextInput
        id="account-name"
        label="Account name"
        value="Everyday Checking"
        readOnly
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Account name' });

    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).not.toHaveAttribute('aria-errormessage');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});