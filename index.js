/**
 * MSS Gold/Silver Buy Rates Calculator
 * Fetches live prices and calculates buy rates
 */

// Configuration
const CONFIG = {
  API_KEY: "sSGPCXG_vSX4FtMsfS3qPo4W2RZMs98w",
  API_BASE_URL: "https://api.massive.com/v1/last_quote/currencies",
  GOLD_SPREAD: 50,        // USD spread from spot for gold
  SILVER_SPREAD: 30,      // USD spread from spot for silver
  BHD_RATE: 0.37745,      // USD to BHD conversion rate
  TROY_OZ_TO_GRAMS: 31.10347,
  TROY_OZ_PER_KG: 32.15074657,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

// Weight configurations for gold products
const GOLD_WEIGHTS = [
  { id: "1gBuy", grams: 1, adjustment: -2, rounding: 1 },
  { id: "2.5gBuy", grams: 2.5, adjustment: -8, rounding: 1 },
  { id: "5gBuy", grams: 5, adjustment: -16, rounding: 1 },
  { id: "10gBuy", grams: 10, adjustment: -10, rounding: 5 },
  { id: "1tBuy", grams: 11.664, adjustment: 0, rounding: 5 },
  { id: "20gBuy", grams: 20, adjustment: -10, rounding: 5 },
  { id: "2tBuy", grams: 23.328, adjustment: 0, rounding: 5 },
  { id: "1ozBuy", grams: 31.10347, adjustment: -10, rounding: 5 },
  { id: "50gBuy", grams: 50, adjustment: 0, rounding: 5 },
  { id: "5tBuy", grams: 58.32, adjustment: 0, rounding: 5 },
  { id: "100gBuy", grams: 100, adjustment: 0, rounding: 5 },
  { id: "ttBuy", grams: 116.523, adjustment: 0, rounding: 5 },
];

// DOM Elements cache
const elements = {
  livePrice: document.getElementById("livePrice"),
  errorMessage: document.getElementById("error-message"),
  lastUpdated: document.getElementById("last-updated"),
  refreshBtn: document.getElementById("refresh-btn"),
  silverPrice: document.getElementById("1kgSilverBuy"),
  silverSpot: document.getElementById("silverSpot"),
};

// Cache gold weight elements
GOLD_WEIGHTS.forEach(weight => {
  elements[weight.id] = document.getElementById(weight.id);
});

/**
 * Show loading state in UI
 */
function showLoading() {
  elements.livePrice.innerHTML = '<span class="loading-text">Loading price...</span>';
  elements.errorMessage.hidden = true;
  
  // Show skeleton loaders in price cells
  GOLD_WEIGHTS.forEach(weight => {
    const el = elements[weight.id];
    if (el) {
      el.innerHTML = '<span class="loading-skeleton">&nbsp;</span>';
    }
  });
  
  if (elements.silverPrice) {
    elements.silverPrice.innerHTML = '<span class="loading-skeleton">&nbsp;</span>';
  }
  
  if (elements.refreshBtn) {
    elements.refreshBtn.disabled = true;
    elements.refreshBtn.textContent = "Loading...";
  }
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.hidden = false;
  elements.livePrice.innerHTML = '<span class="error-text">Price unavailable</span>';
  
  if (elements.refreshBtn) {
    elements.refreshBtn.disabled = false;
    elements.refreshBtn.textContent = "↻ Retry";
  }
}

/**
 * Hide error message
 */
function hideError() {
  elements.errorMessage.hidden = true;
}

/**
 * Update last updated timestamp
 */
function updateTimestamp() {
  if (elements.lastUpdated) {
    const now = new Date();
    elements.lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
  }
}

/**
 * Sleep helper for retry logic
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic
 * @param {string} url - URL to fetch
 * @param {number} attempts - Number of retry attempts
 * @returns {Promise<object>} API response data
 */
async function fetchWithRetry(url, attempts = CONFIG.RETRY_ATTEMPTS) {
  let lastError;
  
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      return response.data;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      if (i < attempts - 1) {
        await sleep(CONFIG.RETRY_DELAY_MS * (i + 1)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

/**
 * Fetch gold price from API
 * @returns {Promise<number>} Gold price per troy ounce in USD
 */
async function fetchGoldPrice() {
  const url = `${CONFIG.API_BASE_URL}/XAU/USD?apiKey=${CONFIG.API_KEY}`;
  const data = await fetchWithRetry(url);
  
  if (!data?.last?.ask) {
    throw new Error("Invalid gold price data received");
  }
  
  return data.last.ask;
}

/**
 * Fetch silver price from API
 * @returns {Promise<number>} Silver price per troy ounce in USD
 */
async function fetchSilverPrice() {
  const url = `${CONFIG.API_BASE_URL}/XAG/USD?apiKey=${CONFIG.API_KEY}`;
  const data = await fetchWithRetry(url);
  
  if (!data?.last?.ask) {
    throw new Error("Invalid silver price data received");
  }
  
  return data.last.ask;
}

/**
 * Calculate gold buy price for a given weight
 * @param {number} dinarRate - Base rate in BHD per gram
 * @param {object} weight - Weight configuration object
 * @returns {number} Calculated buy price
 */
function calculateGoldBuyPrice(dinarRate, weight) {
  const { grams, adjustment, rounding } = weight;
  const basePrice = Math.floor((dinarRate / rounding) * grams) * rounding;
  return basePrice + adjustment;
}

/**
 * Calculate silver buy price for 1 kg
 * @param {number} silverPriceUSD - Silver price per troy ounce in USD
 * @returns {number} Buy price in BHD
 */
function calculateSilverBuyPrice(silverPriceUSD) {
  const silverPricePerKg = silverPriceUSD * CONFIG.TROY_OZ_PER_KG;
  const silverDinarRate = ((silverPricePerKg - CONFIG.SILVER_SPREAD) / 1000) * CONFIG.BHD_RATE * 1000;
  return Math.floor(silverDinarRate / 5) * 5;
}

/**
 * Update gold prices in the DOM
 * @param {number} goldPriceUSD - Gold spot price in USD
 */
function updateGoldPrices(goldPriceUSD) {
  // Display spot price
  elements.livePrice.textContent = `$${goldPriceUSD.toFixed(2)}`;
  
  // Calculate base rate: (spot - spread) / troy_oz * BHD_rate
  const dinarRate24K = ((goldPriceUSD - CONFIG.GOLD_SPREAD) / CONFIG.TROY_OZ_TO_GRAMS) * CONFIG.BHD_RATE;
  
  // Update each weight
  GOLD_WEIGHTS.forEach(weight => {
    const el = elements[weight.id];
    if (el) {
      const price = calculateGoldBuyPrice(dinarRate24K, weight);
      el.textContent = price.toLocaleString();
    }
  });
}

/**
 * Update silver price in the DOM
 * @param {number} silverPriceUSD - Silver spot price in USD
 */
function updateSilverPrice(silverPriceUSD) {
  if (elements.silverPrice) {
    const price = calculateSilverBuyPrice(silverPriceUSD);
    elements.silverPrice.textContent = price.toLocaleString();
  }
  // Show XAG/USD spot price inline
  if (elements.silverSpot) {
    elements.silverSpot.textContent = `($${silverPriceUSD.toFixed(2)}/oz)`;
  }
}

/**
 * Main function to fetch and display all prices
 */
async function refreshPrices() {
  showLoading();
  hideError();
  
  try {
    // Fetch gold and silver prices in parallel
    const [goldPrice, silverPrice] = await Promise.all([
      fetchGoldPrice(),
      fetchSilverPrice(),
    ]);
    
    updateGoldPrices(goldPrice);
    updateSilverPrice(silverPrice);
    updateTimestamp();
    
    if (elements.refreshBtn) {
      elements.refreshBtn.disabled = false;
      elements.refreshBtn.textContent = "↻ Refresh Prices";
    }
    
    console.log("Prices updated successfully:", { goldPrice, silverPrice });
    
  } catch (error) {
    console.error("Failed to fetch prices:", error);
    
    // User-friendly error messages
    let errorMessage = "Unable to load prices. Please try again.";
    
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      errorMessage = "Connection timed out. Please check your internet and try again.";
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      errorMessage = "API authentication failed. Please contact support.";
    } else if (error.response?.status >= 500) {
      errorMessage = "Price server is temporarily unavailable. Please try again later.";
    } else if (!navigator.onLine) {
      errorMessage = "You appear to be offline. Please check your connection.";
    }
    
    showError(errorMessage);
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Initial price fetch
  refreshPrices();
  
  // Refresh button handler
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener("click", refreshPrices);
  }
  
  // Handle online/offline events
  window.addEventListener("online", () => {
    hideError();
    refreshPrices();
  });
  
  window.addEventListener("offline", () => {
    showError("You are offline. Prices may be outdated.");
  });
});
