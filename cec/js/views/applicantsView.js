import { supabase } from '../supabaseClient.js';
import { el, escapeHtml, formatDate, qs, showToast } from '../dom.js';

const STATUS_LABEL = { waiting: 'Waiting', approved: 'Approved', declined: 'Declined' };

let state = {
  query: '',
  status: 'all',
  applicants: [],
  openId: null,
  currentAdminId: null,
};

export function initApplicantsView(root, currentAdmin) {
  state.currentAdminId = currentAdmin.id;

  root.innerHTML = '';
  root.append(
    el('div', { class: 'view-header' }, [
      el('h2', {}, 'Applicants'),
      el('div', { class: 'toolbar' }, [
        el('input', {
          type: 'search',
          id: 'applicant-search',
          placeholder: 'Search by name, NSU ID, email, or phone…',
          class: 'input',
          oninput: (e) => {
            state.query = e.target.value.trim();
            loadApplicants();
          },
        }),
        el('div', { class: 'tabs', id: 'status-tabs' }, ['all', 'waiting', 'approved', 'declined'].map((s) =>
          el('button', {
            class: `tab${state.status === s ? ' is-active' : ''}`,
            'data-status': s,
            onclick: () => {
              state.status = s;
              qs('#status-tabs').querySelectorAll('.tab').forEach((t) => t.classList.remove('is-active'));
              qs(`#status-tabs [data-status="${s}"]`).classList.add('is-active');
              loadApplicants();
            },
          }, s === 'all' ? 'All' : STATUS_LABEL[s])
        )),
      ]),
    ]),
    el('div', { id: 'applicants-list', class: 'stack' }),
  );

  loadApplicants();
}

async function loadApplicants() {
  const list = qs('#applicants-list');
  list.innerHTML = '<p class="muted">Loading…</p>';

  let query = supabase.from('applicants').select('*').order('submitted_at', { ascending: false });

  if (state.status !== 'all') query = query.eq('status', state.status);
  if (state.query) {
    const q = state.query.replace(/[%,]/g, '');
    query = query.or(`full_name.ilike.%${q}%,nsu_id.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    list.innerHTML = '';
    list.append(el('p', { class: 'error-text' }, `Couldn't load applicants: ${error.message}`));
    return;
  }

  state.applicants = data ?? [];
  renderList(list);
}

function renderList(list) {
  list.innerHTML = '';

  if (state.applicants.length === 0) {
    list.append(el('p', { class: 'muted' }, 'No applicants match this view.'));
    return;
  }

  for (const applicant of state.applicants) {
    const isOpen = state.openId === applicant.id;
    const card = el('div', { class: 'card applicant-card' }, [
      el('button', { class: 'applicant-row', onclick: () => toggleDetail(applicant.id) }, [
        el('div', { class: 'applicant-identity' }, [
          el('span', { class: 'applicant-name' }, applicant.full_name),
          el('span', { class: 'muted small' }, `${applicant.nsu_id} · ${applicant.email}`),
        ]),
        el('span', { class: `badge badge-${applicant.status}` }, STATUS_LABEL[applicant.status]),
      ]),
    ]);

    if (isOpen) {
      const detail = el('div', { class: 'applicant-detail' }, [el('p', { class: 'muted' }, 'Loading answers…')]);
      card.append(detail);
      loadDetail(applicant, detail);
    }

    list.append(card);
  }
}

function toggleDetail(id) {
  state.openId = state.openId === id ? null : id;
  renderList(qs('#applicants-list'));
}

async function loadDetail(applicant, container) {
  const { data: answers, error } = await supabase
    .from('applicant_answers')
    .select('id, question_text_snapshot, answer')
    .eq('applicant_id', applicant.id)
    .order('created_at', { ascending: true });

  container.innerHTML = '';

  container.append(
    el('dl', { class: 'meta-grid' }, [
      el('dt', {}, 'Phone'), el('dd', {}, applicant.phone),
      el('dt', {}, 'Submitted'), el('dd', {}, formatDate(applicant.submitted_at)),
      el('dt', {}, 'Reviewed'), el('dd', {}, applicant.reviewed_at ? formatDate(applicant.reviewed_at) : 'Not yet'),
    ]),
  );

  if (error) {
    container.append(el('p', { class: 'error-text' }, `Couldn't load answers: ${error.message}`));
  } else if (!answers || answers.length === 0) {
    container.append(el('p', { class: 'muted' }, 'No form answers were attached to this application.'));
  } else {
    const answersList = el('div', { class: 'answers-list' });
    for (const a of answers) {
      const value = Array.isArray(a.answer) ? a.answer.join(', ') : String(a.answer ?? '');
      answersList.append(
        el('div', { class: 'answer-item' }, [
          el('p', { class: 'answer-question' }, a.question_text_snapshot),
          el('p', { class: 'answer-value' }, value || '—'),
        ]),
      );
    }
    container.append(answersList);
  }

  container.append(
    el('div', { class: 'action-row' }, [
      el('button', {
        class: 'btn btn-approve',
        disabled: applicant.status === 'approved',
        onclick: () => setStatus(applicant, 'approved'),
      }, 'Approve'),
      el('button', {
        class: 'btn btn-waiting',
        disabled: applicant.status === 'waiting',
        onclick: () => setStatus(applicant, 'waiting'),
      }, 'Keep waiting'),
      el('button', {
        class: 'btn btn-decline',
        disabled: applicant.status === 'declined',
        onclick: () => setStatus(applicant, 'declined'),
      }, 'Decline'),
    ]),
  );
}

async function setStatus(applicant, status) {
  const { error } = await supabase
    .from('applicants')
    .update({ status, reviewed_by: state.currentAdminId, reviewed_at: new Date().toISOString() })
    .eq('id', applicant.id);

  if (error) {
    showToast(`Couldn't update status: ${error.message}`, 'error');
    return;
  }

  showToast(`${applicant.full_name} marked as ${STATUS_LABEL[status].toLowerCase()}`, 'success');
  loadApplicants();
}
