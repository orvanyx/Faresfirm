// contact.js - builds an email from the form (no server needed on static hosting)
(function () {
  var form = document.getElementById('enquiry-form');
  if (!form) return;

  // Pre-select activity from ?topic=industrial | electrical
  var topic = new URLSearchParams(location.search).get('topic');
  var sel = form.elements['topic'];
  if (topic && sel) {
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === topic) sel.selectedIndex = i;
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var subject = 'Enquiry: ' + f['topic'].selectedOptions[0].text;
    var body = 'Name: ' + f['name'].value +
      '\nCompany: ' + f['company'].value +
      '\nPhone: ' + f['phone'].value +
      '\n\n' + f['message'].value;
    location.href = 'mailto:sayed@faresfirm.com?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  });
})();
