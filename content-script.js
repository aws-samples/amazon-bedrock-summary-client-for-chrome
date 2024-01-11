chrome.runtime.onMessage.addListener(function (request, sender, sendReponse) {
  if (request.cmd === 'summary') {
    let bodyString = document.body.outerHTML;
    const host = location.host;
    if (bodyString.trim()) {
      sendReponse({
        bodyString,
        host,
      });
    } else {
      sendReponse({
        bodyString: undefined,
        host,
      });
    }
  }
});
