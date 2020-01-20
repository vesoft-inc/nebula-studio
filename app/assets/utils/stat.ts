const win = window as any;
export const trackPageView = (url: string) => {
  if (win._hmt) {
    try {
      win._hmt.push(['_trackPageview', url]);
    } catch (e) {
      console.log(e);
    }
  }

  if (win.gtag) {
    try {
      win.gtag('event', 'screen_view', {
        screen_name: url,
        app_name: 'nebula-graph-stutio',
      });
    } catch (e) {
      console.log(e);
    }
  }
};

export const trackEvent = (category: string, action: string) => {
  if (win._hmt) {
    try {
      (window as any)._hmt.push(['_trackEvent', category, action]);
    } catch (e) {
      console.log(e);
    }
  }

  if (win.gtag) {
    try {
      win.gtag('event', action, {
        event_category: category,
      });
    } catch (e) {
      console.log(e);
    }
  }
};
