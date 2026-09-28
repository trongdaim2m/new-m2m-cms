/** Delete media on server only after content save (skip ids still in use). */
export async function flushPendingMediaDeletes(
  pendingIds: Iterable<string>,
  savedHtmlParts: string[],
  stillUsedIds: Iterable<string> = []
) {
  const html = savedHtmlParts.join('\n');
  const keep = new Set([...stillUsedIds].filter(Boolean));
  const ids = [...new Set([...pendingIds].filter(Boolean))];
  await Promise.all(
    ids.map(async (id) => {
      if (keep.has(id)) return;
      if (html.includes(`data-media-id="${id}"`)) return;
      await fetch(`/api/cms/media/${id}`, { method: 'DELETE' }).catch(() => null);
    })
  );
}
