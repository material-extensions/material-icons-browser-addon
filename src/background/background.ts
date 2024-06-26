import Browser from 'webextension-polyfill';

type Message = {
  event: string;
  data: {
    host: string;
    tabId: number;
  };
};

Browser.runtime.onMessage.addListener((message: Message) => {
  if (message.event === 'request-access') {
    const perm: Browser.Permissions.Permissions = {
      permissions: ['activeTab'],
      origins: [`*://${message.data.host}/*`],
    };

    Browser.permissions.request(perm).then((granted: boolean) => {
      if (!granted) {
        return;
      }

      // run the script now
      Browser.scripting.executeScript({
        files: ['./main.js'],
        target: {
          tabId: message.data.tabId,
        },
      });

      // register content script for future
      return Browser.scripting.registerContentScripts([
        {
          id: 'github-material-icons',
          js: ['./main.js'],
          css: ['./injected-styles.css'],
          matches: [`*://${message.data.host}/*`],
          runAt: 'document_start',
        },
      ]);
    });
  }
});
