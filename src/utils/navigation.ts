const isInternalPath = (path: string) => path.startsWith('/');

export const normalizeAppLink = (rawLink?: string) => {
  const raw = String(rawLink || '').trim();
  if (!raw) return '/notifications';

  let link = raw;
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.origin !== window.location.origin) return '/notifications';
    link = `${parsed.pathname}${parsed.search}`;
  } catch {
    return '/notifications';
  }

  if (!isInternalPath(link)) return '/notifications';

  const [pathname, query = ''] = link.split('?');
  const suffix = query ? `?${query}` : '';

  const listingMatch = pathname.match(/^\/(?:listings|listing)\/([^/]+)$/);
  if (listingMatch) return `/item/${listingMatch[1]}`;

  const itemMatch = pathname.match(/^\/item\/([^/]+)$/);
  if (itemMatch) return `/item/${itemMatch[1]}`;

  const dealMatch = pathname.match(/^\/deals\/([^/]+)$/);
  if (dealMatch) return `/deals?deal=${encodeURIComponent(dealMatch[1])}`;

  const messageMatch = pathname.match(/^\/messages\/([^/]+)$/);
  if (messageMatch) return `/messages/${messageMatch[1]}`;

  if (pathname.startsWith('/admin/listing-reports')) return `/admin${suffix}`;
  if (pathname.startsWith('/admin/message-reports')) return `/admin${suffix}`;
  if (pathname.startsWith('/admin/listings/')) return '/admin';

  return link;
};
