import { supabase } from '../supabaseClient.js';
import { el, qs, showToast } from '../dom.js';

export async function initSettingsView(root) {
  root.innerHTML = '<p class="muted">Loading…</p>';

  const { data: settings, error } = await supabase.from('form_settings').select('*').eq('id', 1).single();
  if (error) {
    root.innerHTML = '';
    root.append(el('p', { class: 'error-text' }, `Couldn't load settings: ${error.message}`));
    return;
  }

  root.innerHTML = '';
  root.append(
    el('div', { class: 'view-header' }, [el('h2', {}, 'Form Settings')]),
    el('div', { class: 'card settings-card' }, [
      el('label', { class: 'field-label' }, 'Form title'),
      el('input', {
        id: 'form-title-input',
        class: 'input',
        value: settings.form_title,
        placeholder: 'Join NSU CEC',
      }),

      el('div', { class: 'toggle-row' }, [
        el('div', {}, [
          el('p', { class: 'field-label' }, 'Accepting applications'),
          el('p', { class: 'muted small' }, 'When off, the public /join page shows the static "closed" page instead of this form.'),
        ]),
        el('label', { class: 'switch' }, [
          el('input', { type: 'checkbox', id: 'form-open-toggle', checked: settings.is_open || undefined }),
          el('span', { class: 'switch-track' }),
        ]),
      ]),

      el('button', { class: 'btn btn-primary', onclick: save }, 'Save settings'),
    ]),
  );
}

async function save() {
  const form_title = qs('#form-title-input').value.trim() || 'Join NSU CEC';
  const is_open = qs('#form-open-toggle').checked;

  const { error } = await supabase
    .from('form_settings')
    .update({ form_title, is_open, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) return showToast(error.message, 'error');
  showToast('Settings saved', 'success');
}
