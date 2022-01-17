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

interface IGtag {
  event_category: string;
  event_label?: string;
  value?: number;
}

export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number,
) => {
  // google analytics
  if (win.gtag) {
    try {
      const params: IGtag = {
        event_category: category,
      };
      if (label) {
        params.event_label = label;
      }
      if (value) {
        params.value = value;
      }
      win.gtag('event', action, params);
    } catch (e) {
      console.log(e);
    }
  }
};

export const handleTrackEvent = event => {
  let target;
  if (event.target && event.target.dataset.trackCategory) {
    target = event.target;
  } else {
    const _parentNode = event.target.parentNode;
    if (_parentNode && _parentNode.dataset.trackCategory) {
      target = _parentNode;
    } else if (
      _parentNode.tagName.toLowerCase() === 'svg' &&
      _parentNode.parentNode.tagName.toLowerCase() === 'i' &&
      _parentNode.parentNode.dataset.trackCategory
    ) {
      target = _parentNode.parentNode;
    }
  }
  if (target) {
    const {
      trackCategory,
      trackAction,
      trackLabel,
      trackValue,
    } = target.dataset;
    trackEvent(trackCategory, trackAction, trackLabel, trackValue);
  }
};
