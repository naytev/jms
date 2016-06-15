fetch('/editor/files', {
  credentials: 'same-origin',
}).then(function(response) {
  return response.json();
}).then(function(json) {
  $('#filelist').treeview({
    data: json,
    enableLinks: true
  });
});

CodeMirror.commands.autocomplete = function(cm) {
  CodeMirror.showHint(cm, CodeMirror.hint.html);
}
CodeMirror.commands.save = saveContent;
var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: "text/x-markdown",
  theme: "monokai",
  lineWrapping: true,
  lineNumbers: true,
  styleActiveLine: true,
  matchBrackets: true,
  extraKeys: {
    "Ctrl-Space": "autocomplete"
  },

});

function saveContent() {
  fetch(window.location.pathname, {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      contents: editor.getValue()
    })
  }).then(function() {
    setTimeout(function() {
      console.log("Reloading preview window");
      preview.contentWindow.location.reload();
    }, 1000);
  })
}

$('.js-template-modal-open').click(function(e){
  e.preventDefault();
  var _this = $(this);
  var templateModal = $("#templateModal")
  templateModal.find('.modal-title').text(_this.data('modalLabel'));
  templateModal.find('input[name="template"]').val(_this.data('template'));
  templateModal.modal('show');
});
$('.js-file-upload-modal-open').click(function(e){
  e.preventDefault();
  var _this = $(this);
  var templateModal = $("#fileModal")
  templateModal.find('.modal-title').text(_this.data('modalLabel'));
  templateModal.modal('show');
});

$('#fileSubmit').click(function(e){
  e.preventDefault();
  $("#fileModal form").submit();
})

$('#templateSubmit').click(function(e){
  e.preventDefault();
  $("#templateModal form").submit();
})