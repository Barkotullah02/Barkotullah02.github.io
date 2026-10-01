import { supabase } from '../supabaseClient.js';
import { el, qs, showToast } from '../dom.js';

const QUESTION_TYPES = [
  { value: 'short_answer', label: 'Short answer' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'checkboxes', label: 'Checkboxes' },
];

let sections = [];

export function initFormBuilderView(root) {
  root.innerHTML = '';
  root.append(
    el('div', { class: 'view-header' }, [
      el('h2', {}, 'Form Builder'),
      el('button', { class: 'btn btn-primary', onclick: addSection }, '+ Add section'),
    ]),
    el('div', { id: 'sections-list', class: 'stack' }),
  );
  load();
}

async function load() {
  const list = qs('#sections-list');
  list.innerHTML = '<p class="muted">Loading…</p>';

  const { data, error } = await supabase
    .from('form_sections')
    .select('*, form_questions(*, form_question_options(*))')
    .order('position', { ascending: true });

  if (error) {
    list.innerHTML = '';
    list.append(el('p', { class: 'error-text' }, `Couldn't load the form: ${error.message}`));
    return;
  }

  sections = (data ?? []).map((s) => ({
    ...s,
    form_questions: [...(s.form_questions ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((q) => ({ ...q, form_question_options: [...(q.form_question_options ?? [])].sort((a, b) => a.position - b.position) })),
  }));

  render();
}

function render() {
  const list = qs('#sections-list');
  list.innerHTML = '';

  if (sections.length === 0) {
    list.append(el('p', { class: 'muted' }, 'No sections yet. Add one to start building the form.'));
    return;
  }

  sections.forEach((section, sIndex) => {
    list.append(renderSection(section, sIndex));
  });
}

function renderSection(section, sIndex) {
  const card = el('div', { class: 'card section-card' });

  const header = el('div', { class: 'section-header' }, [
    el('div', { class: 'reorder-col' }, [
      el('button', { class: 'icon-btn', disabled: sIndex === 0, onclick: () => moveSection(section, -1) }, '↑'),
      el('button', { class: 'icon-btn', disabled: sIndex === sections.length - 1, onclick: () => moveSection(section, 1) }, '↓'),
    ]),
    el('div', { class: 'section-fields' }, [
      el('input', {
        class: 'input input-title',
        value: section.title,
        placeholder: 'Section title',
        onchange: (e) => updateSection(section, { title: e.target.value }),
      }),
      el('input', {
        class: 'input',
        value: section.description ?? '',
        placeholder: 'Optional description shown under the title',
        onchange: (e) => updateSection(section, { description: e.target.value }),
      }),
    ]),
    el('button', { class: 'btn btn-danger-ghost', onclick: () => deleteSection(section) }, 'Delete section'),
  ]);

  const questionsBox = el('div', { class: 'questions-list' });
  section.form_questions.forEach((q, qIndex) => questionsBox.append(renderQuestion(section, q, qIndex)));

  card.append(
    header,
    questionsBox,
    el('button', { class: 'btn btn-secondary', onclick: () => addQuestion(section) }, '+ Add question'),
  );

  return card;
}

function renderQuestion(section, question, qIndex) {
  const box = el('div', { class: 'question-row' });

  const typeSelect = el('select', {
    class: 'input',
    onchange: (e) => updateQuestion(question, { question_type: e.target.value }),
  }, QUESTION_TYPES.map((t) => el('option', { value: t.value, selected: t.value === question.question_type || undefined }, t.label)));

  box.append(
    el('div', { class: 'reorder-col' }, [
      el('button', { class: 'icon-btn', disabled: qIndex === 0, onclick: () => moveQuestion(section, question, -1) }, '↑'),
      el('button', { class: 'icon-btn', disabled: qIndex === section.form_questions.length - 1, onclick: () => moveQuestion(section, question, 1) }, '↓'),
    ]),
    el('div', { class: 'question-fields' }, [
      el('div', { class: 'question-row-top' }, [
        el('input', {
          class: 'input',
          value: question.question_text,
          placeholder: 'Question text',
          onchange: (e) => updateQuestion(question, { question_text: e.target.value }),
        }),
        typeSelect,
        el('label', { class: 'checkbox-label' }, [
          el('input', {
            type: 'checkbox',
            checked: question.is_required || undefined,
            onchange: (e) => updateQuestion(question, { is_required: e.target.checked }),
          }),
          ' Required',
        ]),
        el('button', { class: 'icon-btn', onclick: () => deleteQuestion(question) }, '✕'),
      ]),
      question.question_type === 'short_answer' ? null : renderOptions(question),
    ]),
  );

  return box;
}

function renderOptions(question) {
  const wrap = el('div', { class: 'options-list' });
  question.form_question_options.forEach((opt, oIndex) => {
    wrap.append(
      el('div', { class: 'option-row' }, [
        el('span', { class: 'muted small' }, question.question_type === 'checkboxes' ? '☐' : '○'),
        el('input', {
          class: 'input',
          value: opt.option_text,
          placeholder: `Option ${oIndex + 1}`,
          onchange: (e) => updateOption(question, opt, e.target.value),
        }),
        el('button', { class: 'icon-btn', disabled: oIndex === 0, onclick: () => moveOption(question, opt, -1) }, '↑'),
        el('button', { class: 'icon-btn', disabled: oIndex === question.form_question_options.length - 1, onclick: () => moveOption(question, opt, 1) }, '↓'),
        el('button', { class: 'icon-btn', onclick: () => deleteOption(question, opt) }, '✕'),
      ]),
    );
  });
  wrap.append(el('button', { class: 'btn btn-secondary btn-sm', onclick: () => addOption(question) }, '+ Add option'));
  return wrap;
}

// --- Section mutations ---------------------------------------------------

async function addSection() {
  const position = sections.length ? Math.max(...sections.map((s) => s.position)) + 1 : 0;
  const { error } = await supabase.from('form_sections').insert({ title: 'New section', position });
  if (error) return showToast(error.message, 'error');
  load();
}

async function updateSection(section, patch) {
  const { error } = await supabase.from('form_sections').update(patch).eq('id', section.id);
  if (error) return showToast(error.message, 'error');
  showToast('Saved', 'success');
}

async function deleteSection(section) {
  if (!confirm(`Delete "${section.title}" and all of its questions? This can't be undone.`)) return;
  const { error } = await supabase.from('form_sections').delete().eq('id', section.id);
  if (error) return showToast(error.message, 'error');
  load();
}

async function moveSection(section, direction) {
  const idx = sections.findIndex((s) => s.id === section.id);
  const other = sections[idx + direction];
  if (!other) return;
  await Promise.all([
    supabase.from('form_sections').update({ position: other.position }).eq('id', section.id),
    supabase.from('form_sections').update({ position: section.position }).eq('id', other.id),
  ]);
  load();
}

// --- Question mutations ----------------------------------------------------

async function addQuestion(section) {
  const position = section.form_questions.length
    ? Math.max(...section.form_questions.map((q) => q.position)) + 1
    : 0;
  const { error } = await supabase.from('form_questions').insert({
    section_id: section.id,
    question_text: 'New question',
    question_type: 'short_answer',
    is_required: true,
    position,
  });
  if (error) return showToast(error.message, 'error');
  load();
}

async function updateQuestion(question, patch) {
  const { error } = await supabase.from('form_questions').update(patch).eq('id', question.id);
  if (error) return showToast(error.message, 'error');
  if (patch.question_type) load();
  else showToast('Saved', 'success');
}

async function deleteQuestion(question) {
  if (!confirm('Delete this question?')) return;
  const { error } = await supabase.from('form_questions').delete().eq('id', question.id);
  if (error) return showToast(error.message, 'error');
  load();
}

async function moveQuestion(section, question, direction) {
  const idx = section.form_questions.findIndex((q) => q.id === question.id);
  const other = section.form_questions[idx + direction];
  if (!other) return;
  await Promise.all([
    supabase.from('form_questions').update({ position: other.position }).eq('id', question.id),
    supabase.from('form_questions').update({ position: question.position }).eq('id', other.id),
  ]);
  load();
}

// --- Option mutations --------------------------------------------------------

async function addOption(question) {
  const position = question.form_question_options.length
    ? Math.max(...question.form_question_options.map((o) => o.position)) + 1
    : 0;
  const { error } = await supabase.from('form_question_options').insert({
    question_id: question.id,
    option_text: `Option ${position + 1}`,
    position,
  });
  if (error) return showToast(error.message, 'error');
  load();
}

async function updateOption(question, option, text) {
  const { error } = await supabase.from('form_question_options').update({ option_text: text }).eq('id', option.id);
  if (error) return showToast(error.message, 'error');
  showToast('Saved', 'success');
}

async function deleteOption(question, option) {
  const { error } = await supabase.from('form_question_options').delete().eq('id', option.id);
  if (error) return showToast(error.message, 'error');
  load();
}

async function moveOption(question, option, direction) {
  const idx = question.form_question_options.findIndex((o) => o.id === option.id);
  const other = question.form_question_options[idx + direction];
  if (!other) return;
  await Promise.all([
    supabase.from('form_question_options').update({ position: other.position }).eq('id', option.id),
    supabase.from('form_question_options').update({ position: option.position }).eq('id', other.id),
  ]);
  load();
}
