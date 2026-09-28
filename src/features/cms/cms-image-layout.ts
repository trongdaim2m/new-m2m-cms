import type { Editor } from '@tiptap/react';
import type { Node as PmNode, Schema } from '@tiptap/pm/model';
import type { Transaction } from '@tiptap/pm/state';

export type DropEdge = 'left' | 'right' | 'top' | 'bottom';

export type ImageHit = {
  imagePos: number;
  rowPos: number | null;
  edge: DropEdge;
  rect: DOMRect;
  mediaId?: string;
  src?: string;
};

export const MAX_IMAGES_PER_ROW = 6;

export function getDropEdge(rect: DOMRect, clientX: number, clientY: number): DropEdge {
  const relX = (clientX - rect.left) / Math.max(rect.width, 1);
  const relY = (clientY - rect.top) / Math.max(rect.height, 1);
  const distLeft = relX;
  const distRight = 1 - relX;
  const distTop = relY;
  const distBottom = 1 - relY;
  const min = Math.min(distLeft, distRight, distTop, distBottom);
  if (min === distTop) return 'top';
  if (min === distBottom) return 'bottom';
  if (min === distLeft) return 'left';
  return 'right';
}

export function isHorizontalEdge(edge: DropEdge) {
  return edge === 'left' || edge === 'right';
}

function clampPos(docSize: number, pos: number) {
  return Math.max(0, Math.min(pos, docSize));
}

function resolveImagePos(editor: Editor, roughPos: number): number | null {
  const doc = editor.state.doc;
  const direct = doc.nodeAt(roughPos);
  if (direct?.type.name === 'image') return roughPos;

  try {
    const $pos = doc.resolve(Math.min(roughPos + 1, doc.content.size));
    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type.name === 'image') {
        return $pos.before(d);
      }
    }
    if ($pos.parent.type.name === 'imageRow') {
      let childPos = $pos.before($pos.depth) + 1;
      for (let i = 0; i < $pos.parent.childCount; i++) {
        const child = $pos.parent.child(i);
        if (roughPos >= childPos && roughPos < childPos + child.nodeSize) {
          return childPos;
        }
        childPos += child.nodeSize;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function imageIdentityKey(attrs: { mediaId?: unknown; src?: unknown }) {
  const mid = String(attrs.mediaId || '');
  if (mid) return `id:${mid}`;
  const src = String(attrs.src || '');
  if (src) return `src:${src}`;
  return '';
}

/** Find image node position by mediaId (preferred) or src. */
export function findImagePosByIdentity(
  editor: Editor,
  identity: { mediaId?: string; src?: string; fromPos?: number }
): number | null {
  if (typeof identity.fromPos === 'number') {
    const n = editor.state.doc.nodeAt(identity.fromPos);
    if (n?.type.name === 'image') {
      const mid = String(n.attrs.mediaId || '');
      if (identity.mediaId && mid && mid === identity.mediaId) return identity.fromPos;
      if (identity.src && n.attrs.src === identity.src) return identity.fromPos;
      if (!identity.mediaId && !identity.src) return identity.fromPos;
    }
  }

  let found: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (found != null) return false;
    if (node.type.name !== 'image') return;
    const mid = String(node.attrs.mediaId || '');
    if (identity.mediaId && mid && mid === identity.mediaId) {
      found = pos;
      return false;
    }
    if (!identity.mediaId && identity.src && node.attrs.src === identity.src) {
      found = pos;
      return false;
    }
  });
  return found;
}

function findImagePosInDoc(
  doc: PmNode,
  identity: { mediaId?: string; src?: string }
): number | null {
  let found: number | null = null;
  doc.descendants((node, pos) => {
    if (found != null) return false;
    if (node.type.name !== 'image') return;
    const mid = String(node.attrs.mediaId || '');
    if (identity.mediaId && mid && mid === identity.mediaId) {
      found = pos;
      return false;
    }
    if (!identity.mediaId && identity.src && node.attrs.src === identity.src) {
      found = pos;
      return false;
    }
  });
  return found;
}

function rowPosForImage(doc: PmNode, imagePos: number): number | null {
  try {
    const $inside = doc.resolve(imagePos + 1);
    return $inside.parent.type.name === 'imageRow' ? $inside.before($inside.depth) : null;
  } catch {
    return null;
  }
}

/**
 * After a delete, mapped positions can land inside a gap.
 * Re-resolve the drop target by mediaId/src when possible.
 */
function remapHitAfterDelete(
  tr: Transaction,
  hit: ImageHit,
  mapping: Transaction['mapping']
): ImageHit | null {
  const edge = hit.edge;
  const rect = hit.rect;

  if (hit.mediaId || hit.src) {
    const imagePos = findImagePosInDoc(tr.doc, {
      mediaId: hit.mediaId,
      src: hit.src
    });
    if (imagePos != null) {
      return {
        imagePos,
        rowPos: rowPosForImage(tr.doc, imagePos),
        edge,
        rect,
        mediaId: hit.mediaId,
        src: hit.src
      };
    }
  }

  const mappedImagePos = mapping.map(hit.imagePos);
  const node = tr.doc.nodeAt(mappedImagePos);
  if (node?.type.name === 'image') {
    return {
      imagePos: mappedImagePos,
      rowPos: rowPosForImage(tr.doc, mappedImagePos),
      edge,
      rect,
      mediaId: hit.mediaId,
      src: hit.src
    };
  }

  // Fallback: mapped row, drop at row edge
  if (hit.rowPos != null) {
    const mappedRow = mapping.map(hit.rowPos);
    const rowNode = tr.doc.nodeAt(mappedRow);
    if (rowNode?.type.name === 'imageRow' && rowNode.childCount > 0) {
      const imagePos = mappedRow + 1;
      return {
        imagePos,
        rowPos: mappedRow,
        edge,
        rect,
        mediaId: hit.mediaId,
        src: hit.src
      };
    }
  }

  return null;
}

export function findImageHit(editor: Editor, clientX: number, clientY: number): ImageHit | null {
  const el = document.elementFromPoint(clientX, clientY);
  const imageDom = (el as HTMLElement | null)?.closest?.(
    '.cms-image-node, .cms-resizable-image'
  ) as HTMLElement | null;
  if (!imageDom) return null;

  let roughPos: number;
  try {
    roughPos = editor.view.posAtDOM(imageDom, 0);
  } catch {
    return null;
  }

  const imagePos = resolveImagePos(editor, roughPos);
  if (imagePos == null) return null;

  const node = editor.state.doc.nodeAt(imagePos);
  if (!node || node.type.name !== 'image') return null;

  const rowPos = rowPosForImage(editor.state.doc, imagePos);
  const rect = imageDom.getBoundingClientRect();
  return {
    imagePos,
    rowPos,
    edge: getDropEdge(rect, clientX, clientY),
    rect,
    mediaId: String(node.attrs.mediaId || '') || undefined,
    src: String(node.attrs.src || '') || undefined
  };
}

export type ImageAttrs = {
  src: string;
  alt?: string;
  mediaId?: string;
  width?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
};

export function makeImageNode(editor: Editor, attrs: ImageAttrs): PmNode {
  if (!attrs.src || typeof attrs.src !== 'string') {
    throw new Error('makeImageNode requires attrs.src');
  }
  return editor.schema.nodes.image.create({
    src: attrs.src,
    alt: attrs.alt || '',
    mediaId: attrs.mediaId || '',
    width: attrs.width ?? 100,
    paddingTop: attrs.paddingTop ?? 0,
    paddingRight: attrs.paddingRight ?? 0,
    paddingBottom: attrs.paddingBottom ?? 0,
    paddingLeft: attrs.paddingLeft ?? 0
  });
}

export function makeImageRow(schema: Schema, images: PmNode[]): PmNode {
  return schema.nodes.imageRow.create(null, images);
}

export function forceEqualShare(images: PmNode[]): PmNode[] {
  return images.map((img) => img.type.create({ ...img.attrs, width: 100 }, img.content, img.marks));
}

function deleteImageFromTr(
  tr: Transaction,
  fromPos: number
): { tr: Transaction; deleted: PmNode } | null {
  const node = tr.doc.nodeAt(fromPos);
  if (!node || node.type.name !== 'image') return null;

  const $pos = tr.doc.resolve(fromPos + 1);
  const inRow = $pos.parent.type.name === 'imageRow';
  const rowPos = inRow ? $pos.before($pos.depth) : null;
  const rowNode = rowPos != null ? tr.doc.nodeAt(rowPos) : null;

  if (inRow && rowNode && rowNode.childCount <= 1 && rowPos != null) {
    return { tr: tr.delete(rowPos, rowPos + rowNode.nodeSize), deleted: node };
  }
  return { tr: tr.delete(fromPos, fromPos + node.nodeSize), deleted: node };
}

function placeImagesOnTr(
  tr: Transaction,
  schema: Schema,
  images: PmNode[],
  opts: { hit: ImageHit | null; fallbackPos: number }
): Transaction | null {
  if (!images.length) return null;
  const { hit, fallbackPos } = opts;

  if (!hit) {
    const row = makeImageRow(schema, images);
    const pos = clampPos(tr.doc.content.size, fallbackPos);
    return tr.insert(pos, row);
  }

  const { imagePos, rowPos, edge } = hit;

  if (isHorizontalEdge(edge)) {
    if (rowPos != null) {
      const rowNode = tr.doc.nodeAt(rowPos);
      if (!rowNode || rowNode.type.name !== 'imageRow') return null;

      if (rowNode.childCount + images.length > MAX_IMAGES_PER_ROW) {
        return tr.insert(rowPos + rowNode.nodeSize, makeImageRow(schema, images));
      }

      const existing: PmNode[] = [];
      let childPos = rowPos + 1;
      let insertIndex = rowNode.childCount;
      let matched = false;
      for (let i = 0; i < rowNode.childCount; i++) {
        const child = rowNode.child(i);
        const samePos = childPos === imagePos;
        const sameId =
          Boolean(hit.mediaId || hit.src) &&
          imageIdentityKey(child.attrs) ===
            imageIdentityKey({ mediaId: hit.mediaId, src: hit.src });
        if (samePos || sameId) {
          insertIndex = edge === 'left' ? i : i + 1;
          matched = true;
        }
        existing.push(child);
        childPos += child.nodeSize;
      }
      if (!matched) insertIndex = rowNode.childCount;

      const merged = forceEqualShare([
        ...existing.slice(0, insertIndex),
        ...images,
        ...existing.slice(insertIndex)
      ]);
      return tr.replaceWith(rowPos, rowPos + rowNode.nodeSize, makeImageRow(schema, merged));
    }

    const existing = tr.doc.nodeAt(imagePos);
    if (!existing || existing.type.name !== 'image') return null;
    const ordered = forceEqualShare(
      edge === 'left' ? [...images, existing] : [existing, ...images]
    );
    if (ordered.length > MAX_IMAGES_PER_ROW) return null;
    return tr.replaceWith(imagePos, imagePos + existing.nodeSize, makeImageRow(schema, ordered));
  }

  const anchorPos = rowPos != null ? rowPos : imagePos;
  const anchorNode = tr.doc.nodeAt(anchorPos);
  if (!anchorNode) return null;
  const insertAt = edge === 'top' ? anchorPos : anchorPos + anchorNode.nodeSize;
  return tr.insert(insertAt, makeImageRow(schema, images));
}

export function placeImages(
  editor: Editor,
  images: PmNode[],
  opts: { hit: ImageHit | null; fallbackPos: number }
) {
  if (!images.length) return false;
  let tr = editor.state.tr;
  const next = placeImagesOnTr(tr, editor.schema, images, opts);
  if (!next) return false;
  editor.view.dispatch(next.scrollIntoView());
  return true;
}

export function deleteImageAndCleanup(editor: Editor, fromPos: number) {
  const result = deleteImageFromTr(editor.state.tr, fromPos);
  if (!result) return null;
  return { tr: result.tr, node: result.deleted };
}

/**
 * Move image in a single transaction. If insert fails, document is unchanged
 * (no more delete-then-lose).
 */
export function moveImageToHit(
  editor: Editor,
  fromPos: number,
  hit: ImageHit | null,
  fallbackPos: number
) {
  const source = editor.state.doc.nodeAt(fromPos);
  if (!source || source.type.name !== 'image') return false;

  const sourceKey = imageIdentityKey(source.attrs);

  // Dropping onto self — no-op
  if (hit) {
    const hitKey = imageIdentityKey({ mediaId: hit.mediaId, src: hit.src });
    if (hit.imagePos === fromPos) return false;
    if (sourceKey && hitKey && sourceKey === hitKey) return false;
  }

  const moved = editor.schema.nodes.image.create({ ...source.attrs });
  const beforeCount = countImages(editor);
  const snapshot = editor.getJSON();

  let tr = editor.state.tr;
  const deleted = deleteImageFromTr(tr, fromPos);
  if (!deleted) return false;
  tr = deleted.tr;

  const mappedHit = hit ? remapHitAfterDelete(tr, hit, tr.mapping) : null;

  // If remap lost the target (e.g. dropped on self that was sole row image), fall back
  const placed = placeImagesOnTr(tr, editor.schema, [moved], {
    hit: mappedHit,
    fallbackPos: tr.mapping.map(fallbackPos)
  });

  if (!placed) {
    return false;
  }

  let afterCount = 0;
  let stillThere = false;
  placed.doc.descendants((node) => {
    if (node.type.name !== 'image') return;
    afterCount += 1;
    if (sourceKey && imageIdentityKey(node.attrs) === sourceKey) {
      stillThere = true;
    } else if (!sourceKey && node.attrs.src === moved.attrs.src) {
      stillThere = true;
    }
  });

  if (!stillThere || afterCount < beforeCount) {
    console.error('moveImageToHit: image vanished after move, rolling back', {
      beforeCount,
      afterCount,
      stillThere
    });
    editor.commands.setContent(snapshot, { emitUpdate: false });
    return false;
  }

  editor.view.dispatch(placed.scrollIntoView());
  return true;
}

export function resolveBlockPos(editor: Editor, clientX: number, clientY: number) {
  const coords = editor.view.posAtCoords({ left: clientX, top: clientY });
  if (!coords) return editor.state.selection.to;
  const $pos = editor.state.doc.resolve(coords.pos);
  if ($pos.parent.inlineContent) {
    return clampPos(editor.state.doc.content.size, $pos.after($pos.depth));
  }
  return clampPos(editor.state.doc.content.size, coords.pos);
}

/** Count images in editor (debug / guards). */
export function countImages(editor: Editor) {
  let n = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image') n += 1;
  });
  return n;
}

/** Empty / placeholder doc — prefer HTML when loading articles without contentJson. */
export function isSparseDoc(json: Record<string, unknown> | null | undefined) {
  if (!json || typeof json !== 'object') return true;
  const content = json.content;
  if (!Array.isArray(content) || content.length === 0) return true;
  if (content.length === 1) {
    const only = content[0] as { type?: string; content?: unknown[] };
    if (only?.type === 'paragraph' && (!only.content || only.content.length === 0)) {
      return true;
    }
  }
  return false;
}
