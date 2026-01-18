function loadProxiedPage() {
    alert("Loading proxied page");
    
    const targetUrl = document.getElementById('urlInput').value;
    // Example using a public proxy (note: these often have usage limits)
    const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(targetUrl);

    fetch(proxyUrl)
        .then(response => {
            if (response.ok) return response.json();
            throw new Error('Network response was not ok.');
        })
        .then(data => {
            const iframe = document.getElementById('myBrowser');
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(data.contents); // This writes the fetched HTML into the iframe
            doc.close();
        });
}