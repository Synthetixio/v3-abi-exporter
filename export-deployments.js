const { execSync } = require('child_process');
const fs = require('fs');
const _ = require('lodash');

const CHAIN_IDS = [1, 5, 10, 420, 84531, 11155111];
const PROXIES = { "CoreProxy": "SynthetixCore", "AccountProxyCore": "snxAccountNFT", "AccountProxyPerps": "PerpsAccountNFT", "Proxy": "OracleManager", "USDProxy": "snxUSDToken", "SpotMarketProxy": "SpotMarket", "PerpsMarketProxy": "PerpsMarket" };

CHAIN_IDS.forEach(chain_id => {
  let output = execSync(`cannon inspect synthetix-omnibus --chain-id ${chain_id} --json`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1000000 }); // TODO: update this to use cannon via npm
  let jsonOutput = JSON.parse(output);

  Object.keys(PROXIES).forEach(proxy => {
    if (proxy.startsWith("AccountProxy")) {
      const getCoreAccountProxy = proxy === "AccountProxyCore";
      const specificJsonOutput = getCoreAccountProxy ? jsonOutput.state["provision.system"] : jsonOutput.state["provision.perpsFactory"]?.artifacts?.imports?.perpsFactory;
      if (specificJsonOutput) {
        let value = deepFind(specificJsonOutput, "AccountProxy");
        if (value) {
          fs.writeFileSync(`./abis/${chain_id}-${PROXIES[proxy]}.json`, JSON.stringify(jsonOutput, null, 2));
        }
      }
    } else {
      let value = deepFind(jsonOutput, proxy);
      if (value) {
        fs.writeFileSync(`./abis/${chain_id}-${PROXIES[proxy]}.json`, JSON.stringify(value, null, 2));
      }
    }

  });
});

function deepFind(obj, key) {
  if (obj.hasOwnProperty(key)) return obj[key];

  for (let i = 0; i < Object.keys(obj).length; i++) {
    if (typeof obj[Object.keys(obj)[i]] === 'object') {
      let result = deepFind(obj[Object.keys(obj)[i]], key);
      if (result) return result;
    }
  }

  return null;
}
