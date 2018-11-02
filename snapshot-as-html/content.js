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


/**
 * 简单的 xhr get 请求
 * @param {String} url 
 * @return {Promise}
 */
function simpleGet(url) {
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(this.responseText);
    };
    xhr.onabort = function() {
      reject(`reason=abort; url=${url}`);
    };
    xhr.onerror = function() {
      reject(`reason=error; url=${url}`);
    };
    xhr.ontimeout = function() {
      reject(`reason=timeout; url=${url}`);
    };
    xhr.open('get', url, true);
    xhr.send();
  });
}


function inlineSameOriginExternalStyles() {
  styles = Array.from(document.getElementsByTagName('link'))
    .filter(function(node) {
      return (node.rel == 'stylesheet' || node.type == 'text/css')
        && (new URL(node.href)).origin == location.origin;
    });
  return Promise.all(styles.map(function(node) {
    const url = node.href;
    return simpleGet(url)
      .then(function(value) {
        const c = document.createComment(url)
        node.parentNode.insertBefore(c, node);
        const n = document.createElement('style');
        n.type = 'text/css';
        n.innerHTML = value;
        node.parentNode.insertBefore(n, node);
        node.remove();
      }); 
  }));
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
  return text.replace(/(<script (.|\n)+?<\/script>|<script>(.|\n)+?<\/script>)/gi, '<!-- script -->');
}


function omitIframeSrc(text) {
  return text.replace(/(<iframe [^>]*?src\s*?=\s*?['"]).+?(['"].+?<\/iframe>)/gi, '$1$2');
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.cmd == 'getShapshotAsHtml') {
      inlineSameOriginExternalStyles()
        .then(function() {
          text = getHTML();
          text = omitScript(text);
          text = omitIframeSrc(text);
          text = normalizeURL(text);
    
          filename = location.href + '-' + (new Date()).toISOString() + '.html';
          download(filename, text);
    
          sendResponse({
            ok: true
          });
        })
        .onerror(function(reason) {
          console.log(`SNAPSHOT AS HTML ERROR: ${reason}`);
        });
    }
  }
);
