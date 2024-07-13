const patterns = [
  /\border.*confirmed\b/i,
  /\bpayment.*successful\b/i,
  /\border.*successful\b/i,
  /\bpayment.*confirmed\b/i,
  /\bbooking.*confirmed\b/i,
  /\bbooking.*successful\b/i,
  /\bbooking\s+.*successful\b/i,
  /\bbooking\s+successful\b/i,
  /\bsuccessfully\s+booked\b/i,
  /\border.*completed\b/i,
  /\border.*paid\b/i,
  /\btransaction.*approved\b/i,
  /\btransaction.*successful\b/i,
  /\bpayment.*completed\b/i,
  /\bbooking.*complete\b/i,
  /\bbooking.*approved\b/i,
  /\border.*processed\b/i,
  /\bpayment.*processed\b/i,
  /\bbooking.*processed\b/i,
];

const negativePatterns = [
  /\bnot\s+successful\b/i,
  /\bfailed\b/i,
  /\border.*rejected\b/i,
  /\bpayment.*failed\b/i,
  /\bbooking.*failed\b/i,
  /\btransaction.*failed\b/i,
  /\border.*cancelled\b/i,
  /\bpayment.*cancelled\b/i,
  /\bbooking.*cancelled\b/i,
  /\bdeclined\b/i,
  /\bunsuccessful\b/i,
  /\btransaction.*declined\b/i,
  /\border.*unsuccessful\b/i,
  /\bpayment.*declined\b/i,
  /\bpayment.*not\s+completed\b/i,
  /\bpayment\s+issue\b/i,
  /\bbooking.*declined\b/i,
  /\bbooking\s+unsuccessful\b/i,
  /\border.*issue\b/i,
  /\bproblem.*order\b/i,
  /\bproblem.*payment\b/i,
  /\bproblem.*booking\b/i,
  /\bissue.*transaction\b/i,
  /\bfailed\s+to\s+process\b/i,
  /\bwas\s+not\s+completed\b/i,
  /\bcould\s+not\s+be\s+processed\b/i,
  /\bprocessing\s+error\b/i,
];

const extractId = (entireHTML) => {
  const idPatterns = [
    /\border\s?id[:\s]?\s?(\w+)\b/i,
    /\btransaction[:\s]?\s?(\w+)\b/i,
    /\btransaction\s?id[:\s]?\s?(\w+)\b/i,
    /\border\s?number[:\s]?\s?(\w+)\b/i,
    /\btransaction\s?number[:\s]?\s?(\w+)\b/i,
    /\border\s?ref[:\s]?\s?(\w+)\b/i,
    /\btransaction\s?ref[:\s]?\s?(\w+)\b/i,
    /\border\s?id[:\s]?\s?(\d+)\b/i,
    /\btransaction\s?id[:\s]?\s?(\d+)\b/i,
    /\btxn\s?id[:\s]?\s?(\w+)\b/i,
    /\btxn\s?number[:\s]?\s?(\w+)\b/i,
    /\bpayment\s?ref[:\s]?\s?(\w+)\b/i,
    /\bpayment\s?id[:\s]?\s?(\w+)\b/i,
    /\bpayment\s?number[:\s]?\s?(\w+)\b/i,
    /\bref\s?id[:\s]?\s?(\w+)\b/i,
    /\bref\s?number[:\s]?\s?(\w+)\b/i,
    /\border\s?code[:\s]?\s?(\w+)\b/i,
    /\btransaction\s?code[:\s]?\s?(\w+)\b/i,
    /\border\s?confirmation\s?number[:\s]?\s?(\w+)\b/i,
    /\btransaction\s?confirmation\s?number[:\s]?\s?(\w+)\b/i,
    /\btransaction\s?(\d+)\b/i,
    /\btxn\s?(\d+)\b/i,
    /\btx\s?(\w+)\b/i,
  ];

  for (const pattern of idPatterns) {
    const match = entireHTML.match(pattern);
    if (match) {
      return match[match.length - 1];
    }
  }

  return "";
};

const extractPublisherId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("publisher_id") || urlParams.get("utm_id") || "";
};

const observeChanges = (brandId) => {
  const body = document.querySelector("body");

  const observer = new MutationObserver((mutations) => {
    const entireHTML = document.documentElement.outerHTML.toLowerCase();
    commonFunction(entireHTML, brandId);
  });

  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  return observer;
};

const storeInitialData = () => {
  const publisherId = extractPublisherId();
  const initialUrl = window.location.href;
  const initialDateTime = new Date().toISOString();

  const existingDateTime = localStorage.getItem("initialDateTime");
  if (existingDateTime) {
    const existingTime = new Date(existingDateTime).getTime();
    const currentTime = new Date().getTime();
    const diffInMilliseconds = currentTime - existingTime;
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

    if (diffInHours >= 1) {
      localStorage.setItem("publisherId", publisherId);
      localStorage.setItem("initialUrl", initialUrl);
      localStorage.setItem("initialDateTime", initialDateTime);
    }
  } else {
    localStorage.setItem("publisherId", publisherId);
    localStorage.setItem("initialUrl", initialUrl);
    localStorage.setItem("initialDateTime", initialDateTime);
  }
};

const sendAnalyticsData = (orderId, brandId) => {
  const publisherId = localStorage.getItem("publisherId");
  const initialUrl = localStorage.getItem("initialUrl");
  const finalPath = window.location.pathname;
  const initialDateTime = localStorage.getItem("initialDateTime");
  const finalDateTime = new Date().toISOString();

  fetch("https://script-backend.vercel.app/sdk/script/postSdkLogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      brandId,
      publisherId,
      initialUrl,
      finalPath,
      initialDateTime,
      finalDateTime,
      orderId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Analytics data sent successfully", data);
    })
    .catch((error) => {
      console.error("Error sending analytics data", error);
    });
};

const commonFunction = (entireHTML, brandId) => {
  const patternFound = patterns.some((pattern) => pattern.test(entireHTML));
  console.log("Booking Page Found", patternFound);
  if (patternFound) {
    const negativePatternFound = negativePatterns.some((pattern) =>
      pattern.test(entireHTML)
    );
    console.log("negativePatternFound", negativePatternFound);
    if (!negativePatternFound) {
      console.log("Transaction Confirmed");
      const orderId = extractId(entireHTML);
      console.log("orderId", orderId);
      sendAnalyticsData(orderId, brandId);
    } else {
      console.log("Transaction Not Confirmed");
    }
  }
};

const initDOMChangeListener = (brandId) => {
  storeInitialData();
  const domObserver = observeChanges(brandId);
  return () => {
    domObserver.disconnect();
  };
};

document.addEventListener("DOMContentLoaded", () => {
  const scriptTag = document.querySelector(
    'script[src="https://cdn.jsdelivr.net/gh/sushanthsp526/script-javascript/index.js"]'
  );
  const brandId = scriptTag.getAttribute("brand-id");
  const stopListening = initDOMChangeListener(brandId);

  // Call stopListening() when you want to stop observing DOM changes
});
