document.getElementById('extract').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: extractData
    });
  });
});

function extractData() {
  function getText(s) {
    const el = document.querySelector(s);
    return el ? el.textContent.trim() : '';
  }

  function formatDOB(rawDOB) {
    const months = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04',
      May: '05', Jun: '06', Jul: '07', Aug: '08',
      Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };

    const match = rawDOB.match(/(\d{1,2})\s([A-Za-z]{3})\s(\d{4})/);
    if (!match) return 'N/A';

    const day = match[1].padStart(2, '0');
    const month = months[match[2]];
    const year = match[3];

    return `${year}-${month}-${day}`;
  }

  const name = getText('.md-headline.ng-binding');
  let id = 'N/A';
  document.querySelectorAll('.md-subhead.ng-binding').forEach(el => {
    if (/A\d+/.test(el.textContent)) id = el.textContent.trim();
  });

  let gender = 'N/A', dobRaw = 'N/A', dob = 'N/A';
  document.querySelectorAll('p.ng-binding').forEach(el => {
    const t = el.textContent;
    if (t.includes('Male') || t.includes('Female')) gender = t.trim();
    if (/\d{1,2} [A-Za-z]{3} \d{4}/.test(t)) {
      dobRaw = t.trim();
      dob = formatDOB(dobRaw);
    }
  });

  const addrParts = Array.from(document.querySelectorAll('p.px-wordwrap span.ng-binding'))
    .map(e => e.textContent.trim())
    .filter(Boolean);
  const address = addrParts.length ? addrParts.join(', ') : 'N/A';

  const phoneEl = document.querySelector('md-list-item md-icon[md-svg-icon*="phone"] ~ p.ng-binding');
  const phone = phoneEl ? phoneEl.textContent.trim() : 'N/A';

  const output = `Patient's name: ${name}
ID: ${id}
Gender: ${gender}
Date of Birth: ${dobRaw}
Formatted DOB: ${dob}
Address: ${address}
Phone Number: ${phone}`;

  const ta = document.createElement('textarea');
  ta.value = output;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    alert('✅ Patient info copied to clipboard!');
  } catch (e) {
    alert('❌ Copy failed. Please copy manually:\n\n' + output);
  }

  fetch('https://script.google.com/macros/s/AKfycbzPkIPYv7LRkdMj-n1hOaNyYMaRLyu_lb7AjdKwmOWFb-gk4rRj5wNyggsDUzxX93oS/exec ', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, id, gender, dob, address, phone })
  })
  .then(() => alert('✅ Data sent to Google Sheet!'))
  .catch(e => alert('⚠️ Failed to send data to Google Sheet:\n' + e));
}
