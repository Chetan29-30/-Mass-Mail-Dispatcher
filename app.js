// Email validation regex - robust but not perfect
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

// Parse CSV lines and extract emails
function csvToEmails(text) {
  const lines = text.split(/\r?\n/);
  let emails = [];

  lines.forEach(line => {
    // Each line can have multiple emails separated by comma
    const parts = line.split(',');
    parts.forEach(p => {
      const email = p.trim();
      if(email.length > 0) {
        emails.push(email.toLowerCase());
      }
    });
  });

  return emails;
}

const csvFileInput = document.getElementById('csvFile');
const validListEl = document.getElementById('validEmails');
const invalidListEl = document.getElementById('invalidEmails');
const validCountEl = document.getElementById('validCount');
const invalidCountEl = document.getElementById('invalidCount');
const loadingIndicator = document.getElementById('loadingIndicator');
const validFilterInput = document.getElementById('validFilter');
const invalidFilterInput = document.getElementById('invalidFilter');
const btnCopyValid = document.getElementById('btnCopyValid');
const btnDownloadValid = document.getElementById('btnDownloadValid');
const btnDownloadInvalid = document.getElementById('btnDownloadInvalid');
const btnClearAll = document.getElementById('btnClearAll');
const btnMockSend = document.getElementById('btnMockSend');

const emailSubjectInput = document.getElementById('emailSubject');
const emailBodyInput = document.getElementById('emailBody');

let validEmails = [];
let invalidEmails = [];

// Utility: remove duplicates from array
function unique(array) {
  return [...new Set(array)];
}

// Utility: filter emails in list by search term (case insensitive)
function filterEmails(emails, filterTerm) {
  if (!filterTerm) return emails;
  return emails.filter(email => email.includes(filterTerm.toLowerCase()));
}

// Renders the valid and invalid emails lists according to current filter inputs
function renderLists() {
  const validFilterTerm = validFilterInput.value.trim().toLowerCase();
  const invalidFilterTerm = invalidFilterInput.value.trim().toLowerCase();

  const filteredValid = filterEmails(validEmails, validFilterTerm);
  const filteredInvalid = filterEmails(invalidEmails, invalidFilterTerm);

  // Clear lists
  validListEl.innerHTML = '';
  invalidListEl.innerHTML = '';

  if (filteredValid.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No valid emails found.';
    validListEl.appendChild(li);
  } else {
    filteredValid.forEach(email => {
      const li = document.createElement('li');
      li.textContent = email;
      validListEl.appendChild(li);
    });
  }

  if (filteredInvalid.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No invalid emails detected.';
    invalidListEl.appendChild(li);
  } else {
    filteredInvalid.forEach(email => {
      const li = document.createElement('li');
      li.textContent = email;
      invalidListEl.appendChild(li);
    });
  }

  validCountEl.textContent = validEmails.length;
  invalidCountEl.textContent = invalidEmails.length;

  btnMockSend.disabled = validEmails.length === 0;
}

// Converts emails array to CSV string
function emailsToCSV(emails) {
  return emails.join('\r\n');
}

// Download CSV file with given content and filename
function downloadCSV(content, filename) {
  const blob = new Blob([content], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// Copy text to clipboard with fallback
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';  // avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve(successful);
    } catch (err) {
      document.body.removeChild(textArea);
      return Promise.reject(err);
    }
  }
}

// Clear all state and UI
function clearAll() {
  csvFileInput.value = null;
  validEmails = [];
  invalidEmails = [];
  validFilterInput.value = '';
  invalidFilterInput.value = '';
  emailSubjectInput.value = '';
  emailBodyInput.value = '';

  renderLists();
}

// Handle CSV file upload and parsing
csvFileInput.addEventListener('change', function(evt) {
  const file = evt.target.files[0];
  if (!file) return;

  validEmails = [];
  invalidEmails = [];
  renderLists();

  loadingIndicator.hidden = false;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    let emails = csvToEmails(text);

    // Deduplicate all emails
    emails = unique(emails);

    // Separate into valid and invalid emails
    emails.forEach(email => {
      if(validateEmail(email)) {
        validEmails.push(email);
      } else {
        invalidEmails.push(email);
      }
    });

    loadingIndicator.hidden = true;

    renderLists();
  };

  reader.onerror = function() {
    loadingIndicator.hidden = true;
    alert('Error reading file. Please try again.');
  };

  reader.readAsText(file);
});

// Filter inputs event listeners
validFilterInput.addEventListener('input', renderLists);
invalidFilterInput.addEventListener('input', renderLists);

// Copy valid emails to clipboard
btnCopyValid.addEventListener('click', () => {
  if (validEmails.length === 0) {
    alert('No valid emails to copy.');
    return;
  }
  const textToCopy = validEmails.join('\n');
  copyToClipboard(textToCopy).then(() => {
    alert('Valid emails copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy emails to clipboard.');
  });
});

// Download valid emails CSV
btnDownloadValid.addEventListener('click', () => {
  if (validEmails.length === 0) {
    alert('No valid emails to download.');
    return;
  }
  downloadCSV(emailsToCSV(validEmails), 'valid-emails.csv');
});

// Download invalid emails CSV
btnDownloadInvalid.addEventListener('click', () => {
  if (invalidEmails.length === 0) {
    alert('No invalid emails to download.');
    return;
  }
  downloadCSV(emailsToCSV(invalidEmails), 'invalid-emails.csv');
});

// Clear all
btnClearAll.addEventListener('click', () => {
  if (confirm('Clear all data and start over?')) {
    clearAll();
  }
});

// Mock send emails button
btnMockSend.addEventListener('click', () => {
  const subject = emailSubjectInput.value.trim();
  const body = emailBodyInput.value.trim();

  if (!subject || !body) {
    alert('Please enter both Subject and Message before sending.');
    return;
  }
  if (validEmails.length === 0) {
    alert('No valid emails to send.');
    return;
  }

  alert(`Mock sending emails...\nSubject: "${subject}"\nMessage length: ${body.length} characters\nTotal recipients: ${validEmails.length}\n\n(Note: This is a mock send. No emails will actually be sent.)`);
});

// Initialize empty lists on load
renderLists();
