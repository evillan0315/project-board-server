import { map } from 'nanostores';
import { ICodeMirrorContextMenuItem, ICodeMirrorContextMenuState } from '@/components/codemirror/types';
/**
 * @const codeMirrorContextMenuStore
 * @description A Nanostore to manage the state of the CodeMirror editor's custom context menu.
 */
export const codeMirrorContextMenuStore = map<ICodeMirrorContextMenuState>({
  visible: false,
  x: 0,
  y: 0,
  items: [],
});
/**
 * @function showCodeMirrorContextMenu
 * @description Displays the CodeMirror context menu at the specified coordinates with given items.
 *              A small offset is applied to prevent the menu from directly covering the click point.
 * @param {number} clientX - The x-coordinate of the mouse click event.
 * @param {number} clientY - The y-coordinate of the mouse click event.
 * @param {ICodeMirrorContextMenuItem[]} items - An array of menu items to display.
 */
export const showCodeMirrorContextMenu = (
  clientX: number,
  clientY: number,
  items: ICodeMirrorContextMenuItem[],
) => {
  // Apply a small offset to the context menu position
  // This prevents the menu from appearing directly under the mouse cursor,
  // improving UX by not immediately obscuring the clicked element.
  const offsetX = 2;
  const offsetY = 2;
  codeMirrorContextMenuStore.set({
    visible: true,
    x: clientX + offsetX,
    y: clientY + offsetY,
    items,
  });
};
/**
 * @function hideCodeMirrorContextMenu
 * @description Hides the CodeMirror context menu.
 */
export const hideCodeMirrorContextMenu = () => {
  codeMirrorContextMenuStore.set({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });
};
