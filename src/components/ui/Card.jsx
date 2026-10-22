import React, { useId } from 'react';

const childrenPropType = () => null;

const BASE_CLASSES =
  'rounded-xl border border-border bg-surface shadow-sm';

const HEADER_CLASSES = 'flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6';
const CONTENT_CLASSES = 'p-5 sm:p-6';
const ACTIONS_CLASSES =
  'flex flex-wrap items-center justify-end gap-3 border-t border-border bg-surface-muted px-5 py-4 sm:px-6';

function CardHeader({
  actions,
  children,
  className = '',
  heading,
  headingId,
  headingLevel = 2,
  subtitle,
}) {
  const Heading = `h${Math.min(6, Math.max(1, Number(headingLevel) || 2))}`;
  const visibleHeading = heading || children;

  return (
    <header className={`${HEADER_CLASSES} ${className}`.trim()}>
      <div className="min-w-0">
        {visibleHeading ? (
          <Heading
            className="text-lg font-semibold text-foreground sm:text-xl"
            id={headingId}
          >
            {visibleHeading}
          </Heading>
        ) : null}
        {subtitle ? (
          <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

CardHeader.displayName = 'Card.Header';

CardHeader.propTypes = {
  actions: childrenPropType,
  children: childrenPropType,
  className: () => null,
  heading: childrenPropType,
  headingId: () => null,
  headingLevel: () => null,
  subtitle: childrenPropType,
};

function CardContent({ children, className = '' }) {
  return <div className={`${CONTENT_CLASSES} ${className}`.trim()}>{children}</div>;
}

CardContent.displayName = 'Card.Content';

CardContent.propTypes = {
  children: childrenPropType,
  className: () => null,
};

function CardActions({ children, className = '' }) {
  return (
    <footer className={`${ACTIONS_CLASSES} ${className}`.trim()}>
      {children}
    </footer>
  );
}

CardActions.displayName = 'Card.Actions';

CardActions.propTypes = {
  children: childrenPropType,
  className: () => null,
};

function Card({
  actions,
  as: Component = 'section',
  children,
  className = '',
  contentClassName = '',
  footer,
  footerClassName = '',
  header,
  headerClassName = '',
  heading,
  headingId,
  headingLevel = 2,
  id,
  subtitle,
  ...props
}) {
  const generatedHeadingId = useId();
  const resolvedHeading = heading || header;
  const resolvedHeadingId =
    headingId || (resolvedHeading ? `card-heading-${generatedHeadingId}` : undefined);
  const hasHeader = Boolean(resolvedHeading || subtitle || actions);
  const hasFooter = Boolean(footer);

  return (
    <Component
      {...props}
      aria-labelledby={
        props['aria-labelledby'] || resolvedHeadingId || undefined
      }
      className={`${BASE_CLASSES} ${className}`.trim()}
      id={id}
    >
      {hasHeader ? (
        <CardHeader
          actions={actions}
          className={headerClassName}
          heading={resolvedHeading}
          headingId={resolvedHeadingId}
          headingLevel={headingLevel}
          subtitle={subtitle}
        />
      ) : null}

      {children !== undefined && children !== null ? (
        <CardContent className={contentClassName}>{children}</CardContent>
      ) : null}

      {hasFooter ? (
        <CardActions className={footerClassName}>{footer}</CardActions>
      ) : null}
    </Component>
  );
}

Card.displayName = 'Card';

Card.propTypes = {
  actions: childrenPropType,
  as: () => null,
  children: childrenPropType,
  className: () => null,
  contentClassName: () => null,
  footer: childrenPropType,
  footerClassName: () => null,
  header: childrenPropType,
  headerClassName: () => null,
  heading: childrenPropType,
  headingId: () => null,
  headingLevel: () => null,
  id: () => null,
  subtitle: childrenPropType,
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Actions = CardActions;

export { Card, CardActions, CardContent, CardHeader };

export default Card;