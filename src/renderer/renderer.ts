// Sends information to the the process.
const sendToProcess = (eventType: string, ...data: any[]): Promise<void> =>
    window.ipc.sendToProcess(eventType, data);


// Attach event handler.
window.ipc.onProcessEvent((eventType: string, data: any[]) => {
    switch (eventType) {
        case "user-agent": {
            // Create the webview
            const { userAgent, partition } = data[0];

            const url: string = "https://www.notion.so/";
            const html: string = `
                <webview 
                    id='view'
                    allowpopups
                    src="${url}"
                    partition="${partition}" 
                    userAgent="${userAgent}"
                ></webview>
            `
            document.getElementById("app").insertAdjacentHTML('beforeend', html);
            const webview: HTMLElement = document.getElementById('view');

            (webview as any).webcontents
 

            break;
        }
        default: {
            console.warn(`Uncaught message: ${eventType} | ${data}`);
        }
    }
});

sendToProcess("init");
