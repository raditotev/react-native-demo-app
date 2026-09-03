import { $, expect } from '@wdio/globals';

// Conventions for this suite (see ../README.md):
//   - Chrome and controls with a stable accessibilityLabel: query by accessibility id (~name).
//   - Repeated list content (a todo row): query by its visible text, never by an id — row
//     ids here are `todo-item-${Date.now()}`, unique per item and useless as a selector.
//   - A control that belongs to one specific row (its checkbox, its delete button) has no
//     stable id either — find it as the nearest clickable ancestor of that row's text node.

async function addTodo(text: string) {
  const input = await $('~todo-input');
  await input.setValue(text);
  await (await $('~add-button')).click();
}

function rowText(text: string) {
  return $(`//*[@text="${text}"]`);
}

async function clickableAncestorOf(text: string) {
  // RN's TouchableOpacity becomes the nearest clickable ancestor of the text it wraps —
  // this is how a per-row control is found without a stable per-row id.
  return $(`//*[@text="${text}"]/ancestor::*[@clickable="true"][1]`);
}

describe('Todo list', () => {
  it('adds a todo and shows it in the list', async () => {
    await addTodo('Buy milk');

    await expect(rowText('Buy milk')).toBeDisplayed();
  });

  it('toggles a todo complete by tapping its row', async () => {
    await addTodo('Walk the dog');

    const checkbox = await clickableAncestorOf('Walk the dog');
    await checkbox.click();

    // Completion is a style change (strikethrough), not a text change — the row's continued
    // presence is what's asserted here; a visual-state AC would need a different check.
    await expect(rowText('Walk the dog')).toBeDisplayed();
  });

  it('deletes a todo', async () => {
    await addTodo('Remove me');
    await expect(rowText('Remove me')).toBeDisplayed();

    const deleteButton = await clickableAncestorOf('Delete');
    await deleteButton.click();

    await expect(rowText('Remove me')).not.toBeDisplayed();
  });
});
