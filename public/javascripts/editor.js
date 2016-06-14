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
var updateThrottle = _.throttle(function(){
  console.log("Reloading preview window");
  preview.contentWindow.location.reload();
}, 2000);

var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: "text/x-markdown",
  theme: "monokai",
  lineWrapping: true,
  lineNumbers: true,
  styleActiveLine: true,
  matchBrackets: true,
  extraKeys: {"Ctrl-Space": "autocomplete"},
});
editor.on('changes', function(){
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
  }).then(function(){
    updateThrottle();
  })
})