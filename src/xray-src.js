const Promise = require('bluebird')
const co = require('co')
const _ = require('lodash')
const request = require('co-request')
const requestDriver = require('request-x-ray')
const sts = require('stream-to-string')
const url = require('url')
const Xray = require('x-ray')
const phantomDriver = require('x-ray-phantom')
const log = require('./log')
const agents = require('../assets/proxy/agents.json')
const manualProxies = require('../assets/proxy/proxies.json')
const referers = require('../assets/proxy/referers.json')
const { ProxyData } = require('../db/models/index')

const MAX_REQUEST_TIMEOUT = 60000
const MAX_REQUEST_PER_SEC = 50

let proxies

// insert the manual proxies into proxy db
function insertManualProxiesToDb() {
  return co(function* fn() {
    yield _.map(manualProxies, (ip) => {
      const proxy = {
        url: 'manual',
        ip,
        usable: true,
      }
      return ProxyData.findOrCreate({ where: proxy })
    })
  })
}

// load all proxies from db
function loadDbProxies() {
  return ProxyData.findAll({
    attributes: ['ip'],
    where: { usable: true },
  })
    .then((res) => {
      proxies = _.map(res, 'dataValues.ip')
      log.info(`${_.size(proxies)} Db proxies loaded from ProxyData`)
      return proxies
    })
}

// rotate all assets: take the first and put to the last
function rotateAssets() {
  _.each([agents, proxies, referers], (asset) => {
    if (!_.isEmpty(asset)) {
      asset.push(asset.shift())
    }
  })
}

// generate the basic request options
function genBaseOptions() {
  const options = {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'User-Agent': _.sample(agents),
      Referer: _.sample(referers),
    },
    timeout: MAX_REQUEST_TIMEOUT,
  }
  return options
}

// get the current request optoins
// renew the request options by rotating assets
function getOptions(spec) {
  const options = genBaseOptions()

  // set proxies
  if (spec.useProxy) {
    log.info(`Proxies list size: ${_.size(proxies)}`)
    if (_.isEmpty(proxies)) {
      log.error('spec.useProxy is true but no proxy is available, shutting down for safety')
      process.exit()
    }
    _.assign(options, { proxy: _.first(proxies) })
  }

  // fix phantomjs driver shim error
  if (spec.driver === 'phantomjs') {
    _.assign(options, { webSecurity: false })
  }

  rotateAssets()
  return options
}


// helper for verifyProxies
function verifySingleProxy(spec, proxy) {
  const targetUrl = url.parse(spec.url)
  const targetHost = `${targetUrl.protocol}//${targetUrl.host}`
  const options = genBaseOptions()
  _.assign(options, {
    url: targetHost,
    proxy,
  })
  const whereClause = { ip: proxy }

  return co(function* fn() {
    const res = yield request(options)
    if (res.statusCode !== 200) {
      throw Error('statusCode not 200')
    }
    return ProxyData.update({
      usable: true,
    }, { where: whereClause })
  }).catch(() => ProxyData.update({
    usable: false,
  }, { where: whereClause }))
}

// verify all proxies
function verifyProxies(spec) {
  return co(function* fn() {
    const reloadProxies = yield loadDbProxies()
    log.info('Verifying all proxies')
    const promises = yield _.map(reloadProxies, proxy => verifySingleProxy(spec, proxy))

    yield loadDbProxies() // reload
    return Promise.some(promises)
  })
}

function streamToPromise(stream) {
  return new Promise((resolve, reject) => {
    sts(stream, (err, resStr) => {
      if (err) {
        reject(err)
      } else {
        try {
          resolve(JSON.parse(resStr))
        } catch (e) {
          reject(e)
        }
      }
    })
  })
}

// inject a promisify function to xray using its stream()
// called xray().promisify() to return a promise
function injectWithPromisify(xray) {
  const wrapx = _.wrap(xray, (fn, urlStr, scope, selector) => {
    const initx = fn(urlStr, scope, selector)
    const promisify = function pfn() {
      return streamToPromise(initx.stream())
    }
    _.assign(initx, { promisify })
    return initx
  })
  return wrapx
}

// return a new instance of xray with options
function newXray(spec) {
  const options = getOptions(spec)
  let xray = Xray()
    .timeout(MAX_REQUEST_TIMEOUT)
    .throttle(MAX_REQUEST_PER_SEC, '1s')

  const driver = spec.driver
  switch (driver) {
    case 'requestjs':
      xray.driver(requestDriver(options))
      break
    case 'phantomjs':
      xray.driver(phantomDriver(options))
      break
    default:
      break
  }
  xray = injectWithPromisify(xray)
  return xray
}

// get a new instance of Xray with the current assets
function get(spec) {
  return newXray(spec)
}


module.exports = {
  get,
  insertManualProxiesToDb,
  loadDbProxies,
  verifyProxies,
}
