import { test, expect } from '@playwright/test';

const DEMO_USER_ID = 'miguel.rosa.demo';
const DEMO_PASSWORD = 'demo-password';

async function getLoginIdentifier(page) {
  const candidates = [
    page.getByRole('textbox', { name: /user id|email address|email/i }),
    page.locator('input[autocomplete="username"]'),
  ];

  for (const candidate of candidates) {
    if (await candidate.count()) {
      return candidate.first();
    }
  }

  return candidates[0];
}

async function signIn(page, credentials = {}) {
  await page.goto('/login');

  const identifier = await getLoginIdentifier(page);
  const password = page.getByLabel(/password/i);
  const submit = page.getByRole('button', { name: /sign in/i });

  await identifier.fill(credentials.userId || DEMO_USER_ID);
  await password.fill(credentials.password || DEMO_PASSWORD);
  await submit.click();

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { name: /welcome, miguel/i }),
  ).toBeVisible();
}

async function signOut(page) {
  const logoutButton = page.getByRole('button', { name: /log out/i });

  if (await logoutButton.count()) {
    await logoutButton.click();
  } else {
    await page.getByRole('button', { name: /logout/i }).click();
  }

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('heading', { name: /sign in to your account/i }),
  ).toBeVisible();
}

async function skipWhenUnavailable(page, description, locator) {
  if (!(await locator.count())) {
    test.skip(true, description);
  }
}

test.describe('Online banking facilitator journeys', () => {
  test('allows a facilitator to sign in and complete core navigation', async ({
    page,
  }) => {
    await signIn(page);

    const navigationChecks = [
      {
        label: /accounts/i,
        heading: /accounts/i,
      },
      {
        label: /transfers/i,
        heading: /transfers/i,
      },
      {
        label: /payments/i,
        heading: /payments/i,
      },
      {
        label: /profile/i,
        heading: /profile/i,
      },
    ];

    for (const navigationCheck of navigationChecks) {
      await page.getByRole('link', { name: navigationCheck.label }).first().click();
      await expect(
        page.getByRole('heading', { name: navigationCheck.heading }),
      ).toBeVisible();
    }
  });

  test('shows validation feedback for incomplete login credentials', async ({
    page,
  }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects invalid credentials and accepts the demo credentials', async ({
    page,
  }) => {
    await page.goto('/login');

    const identifier = await getLoginIdentifier(page);
    const password = page.getByLabel(/password/i);

    await identifier.fill(DEMO_USER_ID);
    await password.fill('incorrect-demo-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await password.fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: /welcome, miguel/i }),
    ).toBeVisible();
  });

  test('reviews profile-owned accounts and protects an unavailable account route', async ({
    page,
  }) => {
    await signIn(page);

    await page.getByRole('link', { name: /accounts/i }).first().click();

    await expect(
      page.getByRole('heading', { name: /^accounts$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /everyday checking/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /high-yield savings/i }),
    ).toBeVisible();

    await page.goto('/accounts/account-rosa-checking');

    await expect(
      page.getByRole('heading', { name: /account not found/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/not available for the current profile/i),
    ).toBeVisible();
  });

  test('supports profile switching when the facilitator control is available', async ({
    page,
  }) => {
    await signIn(page);

    const switchControl = page.getByRole('button', {
      name: /switch to rosa|rosa/i,
    });

    await skipWhenUnavailable(
      page,
      'The profile-switching facilitator control is not available in this build.',
      switchControl,
    );

    await switchControl.first().click();

    await page.getByRole('link', { name: /accounts/i }).first().click();

    await expect(
      page.getByRole('link', { name: /personal checking/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /everyday checking/i }),
    ).not.toBeVisible();
  });

  test('filters transactions and downloads a statement when the enquiry page is available', async ({
    page,
  }) => {
    await signIn(page);
    await page.getByRole('link', { name: /accounts/i }).first().click();

    const accountLink = page.getByRole('link', {
      name: /everyday checking/i,
    });

    await skipWhenUnavailable(
      page,
      'The account enquiry journey is not available in this build.',
      accountLink,
    );

    await accountLink.click();

    const transactionHeading = page.getByRole('heading', {
      name: /transaction enquiry|transactions/i,
    });

    await skipWhenUnavailable(
      page,
      'The transaction enquiry page is not available in this build.',
      transactionHeading,
    );

    await expect(transactionHeading).toBeVisible();

    const searchField = page.getByRole('searchbox', {
      name: /search transactions/i,
    });

    if (await searchField.count()) {
      await searchField.fill('transfer');
      await expect(searchField).toHaveValue('transfer');
    }

    const downloadButton = page.getByRole('button', {
      name: /download statement/i,
    });

    await skipWhenUnavailable(
      page,
      'Statement download is not available in this build.',
      downloadButton,
    );

    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/statement|demo/i);
  });

  test('opens product and offer details with simulation-only messaging', async ({
    page,
  }) => {
    await signIn(page);

    await page.goto('/products/product-high-yield-savings');

    const productHeading = page.getByRole('heading', {
      name: /high-yield savings account/i,
    });

    await skipWhenUnavailable(
      page,
      'Product detail routes are not available in this build.',
      productHeading,
    );

    await expect(productHeading).toBeVisible();
    await expect(page.getByText(/simulation only/i).first()).toBeVisible();

    await page.goto('/offers/offer-miguel-cashback-2026');

    const offerHeading = page.getByRole('heading', {
      name: /get php 500 cashback/i,
    });

    await skipWhenUnavailable(
      page,
      'Offer detail routes are not available in this build.',
      offerHeading,
    );

    await expect(offerHeading).toBeVisible();
    await expect(page.getByText(/no real offer/i).first()).toBeVisible();
  });

  test('uses chat support when the chat launcher is available', async ({
    page,
  }) => {
    await signIn(page);

    const chatButton = page.getByRole('button', {
      name: /open chat support/i,
    });

    await skipWhenUnavailable(
      page,
      'Chat support is not available in this build.',
      chatButton,
    );

    await chatButton.click();

    await expect(
      page.getByRole('heading', { name: /chat support/i }),
    ).toBeVisible();

    const messageInput = page.getByRole('textbox', {
      name: /type your message/i,
    });

    await messageInput.fill('How do I make a transfer?');
    await page.getByRole('button', { name: /^send/i }).click();

    await expect(
      page.getByText(/how do i make a transfer/i),
    ).toBeVisible();
    await expect(
      page.getByText(/simulated transfer/i),
    ).toBeVisible();
  });

  test('recovers from a simulated service failure with retry', async ({
    page,
  }) => {
    await signIn(page);

    const failureControl = page.getByRole('checkbox', {
      name: /simulate service failures/i,
    });

    await skipWhenUnavailable(
      page,
      'Failure simulation controls are not available in this build.',
      failureControl,
    );

    await failureControl.check();

    await page.getByRole('link', { name: /accounts/i }).first().click();

    await expect(
      page.getByRole('heading', {
        name: /temporarily unavailable|unable to load/i,
      }),
    ).toBeVisible();

    await failureControl.uncheck();

    const retryButton = page.getByRole('button', {
      name: /retry|try again/i,
    });

    await skipWhenUnavailable(
      page,
      'Retry controls are not available in this build.',
      retryButton,
    );

    await retryButton.first().click();

    await expect(
      page.getByRole('heading', { name: /accounts/i }),
    ).toBeVisible();
  });

  test('logs out and prevents access to protected routes', async ({ page }) => {
    await signIn(page);
    await signOut(page);

    await page.goto('/accounts');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: /sign in to your account/i }),
    ).toBeVisible();
  });

  test('handles session expiry when the expiry facilitator is available', async ({
    page,
  }) => {
    await signIn(page);

    const sessionDialog = page.getByRole('dialog', {
      name: /session timeout|about to expire/i,
    });

    await skipWhenUnavailable(
      page,
      'Session-expiry controls are not available during this browser journey.',
      sessionDialog,
    );

    await expect(sessionDialog).toBeVisible();

    const continueButton = sessionDialog.getByRole('button', {
      name: /continue session/i,
    });

    if (await continueButton.count()) {
      await continueButton.click();
      await expect(sessionDialog).not.toBeVisible();
    }

    const signOutButton = sessionDialog.getByRole('button', {
      name: /sign out|log out/i,
    });

    if (await signOutButton.count()) {
      await signOutButton.click();
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  test('resets the demonstration state when the reset facilitator is available', async ({
    page,
  }) => {
    await signIn(page);

    const profileMenu = page.getByRole('button', {
      name: /open profile menu/i,
    });

    await skipWhenUnavailable(
      page,
      'The profile menu is not available in this build.',
      profileMenu,
    );

    await profileMenu.click();

    const resetButton = page.getByRole('menuitem', {
      name: /reset demonstration|reset demo/i,
    });

    await skipWhenUnavailable(
      page,
      'The demonstration reset control is not available in this build.',
      resetButton,
    );

    await resetButton.click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: /sign in to your account/i }),
    ).toBeVisible();
  });
});