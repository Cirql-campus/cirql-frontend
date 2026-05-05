const isInternalPath = (path: string) => path.startsWith('/');

export const normalizeAppLink = (rawLink?: string) => {
  const link = String(rawLink || '').trim();
  if (!link || !isInternalPath(link)) return '/notifications';

  const [pathname, query = ''] = link.split('?');
  const suffix = query ? `?${query}` : '';

  const listingMatch = pathname.match(/^\/listings\/([^/]+)$/);
  if (listingMatch) return `/item/${listingMatch[1]}`;

  const dealMatch = pathname.match(/^\/deals\/([^/]+)$/);
  if (dealMatch) return `/deals?deal=${encodeURIComponent(dealMatch[1])}`;

  if (pathname.startsWith('/admin/listing-reports')) return `/admin${suffix}`;
  if (pathname.startsWith('/admin/message-reports')) return `/admin${suffix}`;
  if (pathname.startsWith('/admin/listings/')) return '/admin';

  return link;
};
