import React, { useId, useState } from 'react';

const childrenPropType = () => null;

function normalizeDescribedBy(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(' ');
  }

  return value ? String(value) : '';
}

/**
 * Renders a labeled accessible text input with optional supporting text,
 * inline validation, and password visibility controls.
 *
 * @param {object} props Component properties.
 * @param {string} props.label Input label.
 * @param {string} props.id Input identifier.
 * @param {string} props.error Inline validation message.
 * @param {React.ReactNode} props.hint Supporting text displayed below the input.
 * @param {React.ReactNode} props.description Additional descriptive text.
 * @param {boolean} props.required Whether the input is required.
 * @param {boolean} props.disabled Whether the input is disabled.
 * @param {boolean} props.showPasswordToggle Whether password visibility can be toggled.
 * @param {object|Function} props.inputRef Ref assigned to the input element.
 * @returns {JSX.Element} Text input control.
 */
function TextInput({
  label,
  id,
  error,
  hint,
  description,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  type = 'text',
  showPasswordToggle = true,
  inputRef,
  describedBy,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || `text-input-${generatedId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  const shouldShowPasswordToggle = isPassword && showPasswordToggle;
  const inputType = shouldShowPasswordToggle && isPasswordVisible ? 'text' : type;
  const hintId = hint ? `${inputId}-hint` : null;
  const descriptionId = description ? `${inputId}-description` : null;
  const errorId = error ? `${inputId}-error` : null;
  const describedByIds = normalizeDescribedBy([
    describedBy,
    descriptionId,
    hintId,
    errorId,
  ]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((visible) => !visible);
  };

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <label
        className="block text-sm font-medium text-foreground"
        htmlFor={inputId}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-danger-700">
            *
          </span>
        ) : null}
      </label>

      {description ? (
        <p className="text-sm text-foreground-muted" id={descriptionId}>
          {description}
        </p>
      ) : null}

      <div className="relative">
        <input
          {...props}
          aria-describedby={describedByIds || undefined}
          aria-errormessage={errorId || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-required={required || undefined}
          className={`w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-foreground shadow-sm transition-colors placeholder:text-foreground-subtle focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-background-muted disabled:opacity-60 ${
            shouldShowPasswordToggle ? 'pr-20' : ''
          } ${inputClassName}`.trim()}
          disabled={disabled}
          id={inputId}
          ref={inputRef}
          required={required}
          role={isPassword ? 'textbox' : props.role}
          type={inputType}
        />

        {shouldShowPasswordToggle ? (
          <button
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            onClick={togglePasswordVisibility}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            {isPasswordVisible ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>

      {hint ? (
        <p className="text-sm text-foreground-muted" id={hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-danger-700" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

TextInput.displayName = 'TextInput';

TextInput.propTypes = {
  label: () => null,
  id: () => null,
  error: () => null,
  hint: childrenPropType,
  description: childrenPropType,
  required: () => null,
  disabled: () => null,
  className: () => null,
  inputClassName: () => null,
  type: () => null,
  showPasswordToggle: () => null,
  inputRef: () => null,
  describedBy: () => null,
  onChange: () => null,
  onBlur: () => null,
  onFocus: () => null,
  value: () => null,
  defaultValue: () => null,
  placeholder: () => null,
  name: () => null,
  autoComplete: () => null,
};

export default TextInput;