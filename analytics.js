(() => {
  "use strict";

  // Set the account code only after its owner supplies the GoatCounter address.
  const siteCode = document.currentScript.dataset.goatcounterSite.trim();
  const productionPaths = ["/ebundangfirst", "/ebundangfirst/", "/ebundangfirst/index.html"];

  if (
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(siteCode) ||
    window.location.origin !== "https://joy-papa.github.io" ||
    !productionPaths.includes(window.location.pathname)
  ) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.v5.js";
  script.crossOrigin = "anonymous";
  script.integrity = "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";
  script.referrerPolicy = "no-referrer";
  script.dataset.goatcounter = `https://${siteCode}.goatcounter.com/count`;
  // All calculator links share one counter; option choices and referrers stay local.
  script.dataset.goatcounterSettings = JSON.stringify({
    path: "/ebundangfirst/",
    referrer: "",
    no_events: true,
    no_onload: true
  });
  script.addEventListener("load", () => {
    const counter = window.goatcounter;
    const getData = counter.get_data;
    // The vendor also sends location.search separately from the page path.
    counter.get_data = (vars) => {
      const data = getData(vars);
      delete data.q;
      return data;
    };

    const countVisibleVisit = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", countVisibleVisit);
      counter.count();
    };
    document.addEventListener("visibilitychange", countVisibleVisit);
    countVisibleVisit();
  });
  document.head.appendChild(script);
})();
