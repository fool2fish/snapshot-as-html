/**
 * download file
 * @param {String} filename - filename, any illetal character will be replaced with underline
 * @param {String} text - file content 
 */
function download(filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}


function getHTML() {
  return '<!doctype html>\n<!-- ' + location.href + ' -->\n' + document.documentElement.outerHTML;
}


function normalizeURL(text) {
  // //... => http(s)://...
  text = text.replace(/(\s*(href|src)\s*=\s*['"])(\/\/[^/])/gi, `$1${location.protocol}$3`);
  // /a/b => http(s)://x.com/a/b
  text = text.replace(/(\s*(href|src)\s*=\s*['"])(\/[^/])/gi, `$1${location.origin}$3`);
  const baseURL = new URL('./', location.href).href;
  // ./a/b => http(s)://x.com/c/a/b
  text = text.replace(/(\s*(href|src)\s*=\s*['"])\.\/([^/])/gi, `$1${baseURL}$3`);
  // ../a/b => http(s)://x.com/c/../a/b
  text = text.replace(/(\s*(href|src)\s*=\s*['"])(\.\.\/[^/])/gi, `$1${baseURL}$3`);
  // a/b => http(s)://.../a/b
  text = text.replace(/(\s*(href|src)\s*=\s*['"])([^:./'"]+[/'"])/gi, `$1${baseURL}$3`);
  return text;
}


function omitScript(text) {
  return text.replace(/(<script (.|\n)+?<\/script>|<script>(.|\n)+?<\/script>)/gi, '');
}


function omitIframeSrc(text) {
  return text.replace(/(<iframe [^>]*?src\s*?=\s*?['"]).+?(['"].+?<\/iframe>)/gi, '$1$2');
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.cmd == 'getShapshotAsHtml') {
      text = getHTML();
      text = omitScript(text);
      text = omitIframeSrc(text);
      text = normalizeURL(text);

      filename = location.href + '-' + (new Date()).toISOString() + '.html';
      download(filename, text);

      sendResponse({
        ok: true
      });
    }
  }
);
