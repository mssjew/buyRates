let livePrice = document.getElementById("livePrice");

const API_KEY = "mQK2zB2lxayaitBVpJEC";


let oneGramBuy = document.getElementById("1gBuy");
let twoPointFiveGramsBuy = document.getElementById("2.5gBuy");
let fiveGramsBuy = document.getElementById("5gBuy");
let tenGramsBuy = document.getElementById("10gBuy");
let oneTolaBuy = document.getElementById("1tBuy");
let twentyGramsBuy = document.getElementById("20gBuy");
let twoTolaBuy = document.getElementById("2tBuy");
let oneOunceBuy = document.getElementById("1ozBuy");
let fiftyGramsBuy = document.getElementById("50gBuy");
let fiveTolaBuy = document.getElementById("5tBuy");
let hundredGramsBuy = document.getElementById("100gBuy");
let ttBarBuy = document.getElementById("ttBuy");




async function goldPrice() {
  let resp = await axios.get(
    `https://marketdata.tradermade.com/api/v1/live?currency=XAUUSD&api_key=${API_KEY}`
    
  );
  console.log(resp.data.quotes[0].ask);
  return resp.data.quotes[0].ask;
}

goldPrice()
  .then((price) => {
    livePrice.textContent = "$"+price;

    let dinarRate24K = ((price-5)/ 31.10347) * .37745;

    // twoPointFiveGramsBuy.textContent = Math.floor((dinarRate24K/10) * 2.5)*10;
    // fiveGramsBuy.textContent = Math.floor((dinarRate24K/10) * 5)*10;
    // tenGramsBuy.textContent = Math.floor((dinarRate24K/10) * 10)*10;
    // oneTolaBuy.textContent = Math.floor((dinarRate24K/10) * 11.664)*10;
    // twentyGramsBuy.textContent = Math.floor((dinarRate24K/10) * 20)*10;
    // twoTolaBuy.textContent = Math.floor((dinarRate24K/10) * 23.328)*10;
    // oneOunceBuy.textContent = Math.floor((dinarRate24K/10) * 31.10347)*10;
    // fiftyGramsBuy.textContent = Math.floor((dinarRate24K/10) * 50)*10;
    // fiveTolaBuy.textContent = Math.floor((dinarRate24K/10) * 58.32)*10;
    // hundredGramsBuy.textContent = Math.floor((dinarRate24K/10) * 100)*10;
    // ttBarBuy.textContent = Math.floor((dinarRate24K/10) * 116.523)*10;



    oneGramBuy.textContent = Math.floor((dinarRate24K) * 1);
    twoPointFiveGramsBuy.textContent = Math.floor((dinarRate24K) * 2.5);
    fiveGramsBuy.textContent = Math.floor((dinarRate24K) * 5);
    tenGramsBuy.textContent = Math.floor((dinarRate24K/5) * 10)*5;
    oneTolaBuy.textContent = Math.floor((dinarRate24K/5) * 11.664)*5;
    twentyGramsBuy.textContent = Math.floor((dinarRate24K/5) * 20)*5;
    twoTolaBuy.textContent = Math.floor((dinarRate24K/5) * 23.328)*5;
    oneOunceBuy.textContent = Math.floor((dinarRate24K/5) * 31.10347)*5;
    fiftyGramsBuy.textContent = Math.floor((dinarRate24K/5) * 50)*5;
    fiveTolaBuy.textContent = Math.floor((dinarRate24K/5) * 58.32)*5;
    hundredGramsBuy.textContent = Math.floor((dinarRate24K/5) * 100)*5;
    ttBarBuy.textContent = (Math.floor((dinarRate24K/5) * 116.523)*5)-10;



    // oneGramBuy.textContent = Math.floor((dinarRate24K) * 1);
    // twoPointFiveGramsBuy.textContent = Math.floor((dinarRate24K) * 2.5);
    // fiveGramsBuy.textContent = Math.floor((dinarRate24K) * 5);
    // tenGramsBuy.textContent = Math.floor((dinarRate24K) * 10);
    // oneTolaBuy.textContent = Math.floor((dinarRate24K) * 11.664);
    // twentyGramsBuy.textContent = Math.floor((dinarRate24K) * 20);
    // twoTolaBuy.textContent = Math.floor((dinarRate24K) * 23.328);
    // oneOunceBuy.textContent = Math.floor((dinarRate24K) * 31.10347);
    // fiftyGramsBuy.textContent = Math.floor((dinarRate24K) * 50);
    // fiveTolaBuy.textContent = Math.floor((dinarRate24K) * 58.32);
    // hundredGramsBuy.textContent = Math.floor((dinarRate24K) * 100);
    // ttBarBuy.textContent = Math.floor((dinarRate24K) * 116.523);


  })
  .catch((err) => {
    currentPrice = 0;
    console.log("Error failed to get price:", err);
  });
