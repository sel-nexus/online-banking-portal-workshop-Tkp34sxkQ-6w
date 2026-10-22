const DEFAULT_FILENAME = 'statement-demo';
const DEFAULT_EXTENSION = 'txt';
const DEFAULT_TEXT_TYPE = 'text/plain;charset=utf-8';
const DEFAULT_JSON_TYPE = 'application/json;charset=utf-8';

function getBrowserGlobal(name) {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  return globalThis[name];
}

function getDocument(documentOverride) {
  const documentObject = documentOverride || getBrowserGlobal('document');

  if (
    !documentObject ||
    typeof documentObject.createElement !== 'function'
  ) {
    throw new Error('File downloads are only available in a browser.');
  }

  return documentObject;
}

function getUrlApi() {
  const urlApi = getBrowserGlobal('URL');

  if (
    !urlApi ||
    typeof urlApi.createObjectURL !== 'function' ||
    typeof urlApi.revokeObjectURL !== 'function'
  ) {
    throw new Error('Object URL downloads are not supported by this browser.');
  }

  return urlApi;
}

function normalizeExtension(extension) {
  const normalizedExtension = String(extension ?? DEFAULT_EXTENSION)
    .trim()
    .replace(/^\.+/, '')
    .replace(/[^a-zA-Z0-9]+/g, '');

  return normalizedExtension || DEFAULT_EXTENSION;
}

function sanitizeFilenamePart(value, fallback = DEFAULT_FILENAME) {
  const normalizedValue = String(value ?? '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .replace(/^-+|-+$/g, '');

  return normalizedValue || fallback;
}

function normalizeFilename(filename, fallback = `${DEFAULT_FILENAME}.${DEFAULT_EXTENSION}`) {
  const normalizedFilename = String(filename ?? '').trim();

  if (!normalizedFilename) {
    return fallback;
  }

  const extensionIndex = normalizedFilename.lastIndexOf('.');
  const hasExtension =
    extensionIndex > 0 && extensionIndex < normalizedFilename.length - 1;
  const name = hasExtension
    ? normalizedFilename.slice(0, extensionIndex)
    : normalizedFilename;
  const extension = hasExtension
    ? normalizeExtension(normalizedFilename.slice(extensionIndex + 1))
    : '';

  const safeName = sanitizeFilenamePart(name, DEFAULT_FILENAME);

  return extension ? `${safeName}.${extension}` : safeName;
}

/**
 * Creates a safe filename for a synthetic demonstration download.
 *
 * @param {object|string} options Filename options or a filename prefix.
 * @param {string} options.name Filename prefix.
 * @param {string} options.identifier Optional account or statement identifier.
 * @param {string} options.extension Filename extension.
 * @returns {string} Safe demo filename.
 */
export function createDemoFilename(options = {}) {
  if (typeof options === 'string') {
    return normalizeFilename(options);
  }

  const name = sanitizeFilenamePart(options.name, DEFAULT_FILENAME);
  const identifier = options.identifier
    ? `-${sanitizeFilenamePart(options.identifier, '')}`
    : '';
  const extension = normalizeExtension(options.extension);

  return `${name}${identifier}-demo.${extension}`;
}

/**
 * Creates the default synthetic statement filename.
 *
 * @param {string} accountIdentifier Optional account identifier.
 * @param {string} extension File extension.
 * @returns {string} Synthetic statement filename.
 */
export function createDemoStatementFilename(
  accountIdentifier = '',
  extension = DEFAULT_EXTENSION,
) {
  return createDemoFilename({
    name: 'statement',
    identifier: accountIdentifier,
    extension,
  });
}

/**
 * Creates a browser object URL for a Blob.
 *
 * @param {Blob} blob Blob to expose through an object URL.
 * @returns {string} Object URL.
 */
export function createObjectUrl(blob) {
  const BlobConstructor = getBrowserGlobal('Blob');

  if (
    !BlobConstructor ||
    typeof BlobConstructor !== 'function' ||
    !(blob instanceof BlobConstructor)
  ) {
    throw new TypeError('A Blob is required to create a download URL.');
  }

  return getUrlApi().createObjectURL(blob);
}

/**
 * Revokes a browser object URL.
 *
 * @param {string} objectUrl Object URL to revoke.
 * @returns {void}
 */
export function revokeObjectUrl(objectUrl) {
  if (typeof objectUrl !== 'string' || !objectUrl) {
    return;
  }

  getUrlApi().revokeObjectURL(objectUrl);
}

/**
 * Downloads a Blob using a temporary anchor and cleans up its object URL.
 *
 * @param {Blob} blob Blob to download.
 * @param {object} options Download options.
 * @param {string} options.filename Download filename.
 * @param {Document} options.document Document implementation for testing.
 * @returns {string} The filename used for the download.
 */
export function downloadBlob(blob, options = {}) {
  const documentObject = getDocument(options.document);
  const filename = normalizeFilename(options.filename);
  const objectUrl = createObjectUrl(blob);
  const anchor = documentObject.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.setAttribute('aria-hidden', 'true');
  anchor.style.display = 'none';

  if (documentObject.body && typeof documentObject.body.appendChild === 'function') {
    documentObject.body.appendChild(anchor);
  }

  try {
    if (typeof anchor.click !== 'function') {
      throw new Error('This browser cannot start a file download.');
    }

    anchor.click();
  } finally {
    if (typeof anchor.remove === 'function') {
      anchor.remove();
    } else if (
      anchor.parentNode &&
      typeof anchor.parentNode.removeChild === 'function'
    ) {
      anchor.parentNode.removeChild(anchor);
    }

    revokeObjectUrl(objectUrl);
  }

  return filename;
}

/**
 * Downloads text content as a local synthetic file.
 *
 * @param {string} content Text content to download.
 * @param {object} options Download options.
 * @returns {string} The filename used for the download.
 */
export function downloadText(content, options = {}) {
  const BlobConstructor = getBrowserGlobal('Blob');

  if (!BlobConstructor || typeof BlobConstructor !== 'function') {
    throw new Error('Text downloads are only available in a browser.');
  }

  const blob = new BlobConstructor([String(content ?? '')], {
    type: options.type || DEFAULT_TEXT_TYPE,
  });

  return downloadBlob(blob, options);
}

/**
 * Downloads JSON content as a local synthetic file.
 *
 * @param {*} value Value to serialize and download.
 * @param {object} options Download options.
 * @returns {string} The filename used for the download.
 */
export function downloadJson(value, options = {}) {
  let serializedValue;

  try {
    serializedValue = JSON.stringify(value, null, 2);
  } catch (error) {
    throw new TypeError(
      `The supplied value could not be serialized: ${error.message}`,
    );
  }

  return downloadText(serializedValue, {
    ...options,
    type: options.type || DEFAULT_JSON_TYPE,
    filename: options.filename || createDemoFilename({
      name: 'statement',
      extension: 'json',
    }),
  });
}

export const sanitizeFilename = sanitizeFilenamePart;
export const getDemoFilename = createDemoFilename;
export const getDemoStatementFilename = createDemoStatementFilename;
export const createDownloadUrl = createObjectUrl;
export const revokeDownloadUrl = revokeObjectUrl;
export const downloadFile = downloadBlob;
export const downloadStatement = downloadBlob;

const downloadUtils = Object.freeze({
  createDemoFilename,
  createDemoStatementFilename,
  sanitizeFilename: sanitizeFilenamePart,
  createObjectUrl,
  createDownloadUrl: createObjectUrl,
  revokeObjectUrl,
  revokeDownloadUrl: revokeObjectUrl,
  downloadBlob,
  downloadFile: downloadBlob,
  downloadText,
  downloadJson,
  downloadStatement: downloadBlob,
});

export default downloadUtils;