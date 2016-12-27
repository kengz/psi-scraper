const Promise = require('bluebird')
const co = require('co')
const _ = require('lodash')
const log = require('../src/log')
const xraySrc = require('../src/xray-src')
const { ProxyTarget, ProxyData, sequelize } = require('../db/models/index')

const spec = {
  useProxy: false,
  driver: null,
  url: 'https://incloak.com/proxy-list/',
  scope: '.proxy__t tr',
  selector: [{
    ip: 'td:nth-child(1)',
    port: 'td:nth-child(2)',
    country: 'td:nth-child(3)',
    speed: 'td:nth-child(4)',
    type: 'td:nth-child(5)',
    anonimity: 'td:nth-child(6)',
  }],
}

// seed targets and start proxy project if needed
function init() {
  const seedTarget = {
    url: spec.url,
  }
  return ProxyTarget.findOrCreate({ where: seedTarget })
}

// extract data for db from xray result
function extractData(res) {
  const usable = _.filter(res, (obj) => {
    const accept = (parseInt(obj.speed, 10) < 2500 && obj.anonimity !== 'No')
    return accept
  })

  const extracted = _.map(usable, (obj) => {
    const type = _.toLower(_.trim(_.last(_.split(obj.type, ','))))
    const ip = `${type}://${obj.ip}:${obj.port}`
    return {
      url: spec.url,
      ip,
      country: _.trim(obj.country),
      speed: parseInt(obj.speed, 10),
      anonimity: obj.anonimity,
      usable: true,
    }
  })
  return extracted
}

const findTargets = co.wrap(function*() {
  const targetObjs = yield ProxyTarget.findAll({
    // where: { success: false, freq: { lt: 10 } }
    where: { }
  })
  const targets = _.map(targetObjs, 'dataValues')
  return targets
})

// create and run an instance of xray
const spawn = co.wrap(function*(target) {
  log.info('Spawning a scraper instance')
  const xray = xraySrc.get(spec.driver)

  const res = yield xray(target.url, spec.scope, spec.selector)
    .paginate('.proxy__pagination a@href')
    .limit(3)
    .promisify()

  // update the db
  const data = extractData(res)
  const promises = yield _.map(data, (proxy) => {
    return ProxyData.findOrCreate({ where: proxy })
  })

  // update the target
  yield ProxyTarget.update({
    success: true,
    freq: target.freq + 1,
  }, { where: target })

  log.info('Scraper instance stops')
  return Promise.all(promises)
})

// start for each target
const run = co.wrap(function*() {
  log.info('Running project')
  let targets = yield findTargets()
  targets = _.fill(_.range(3), targets[0])
  const promises = yield _.map(targets, spawn)
  return Promise.all(promises)
})

const report = co.wrap(function*() {
  log.info('Project report:')
  const c = yield ProxyData.count({ where: {} })
  log.info(`Total Project Data rows: ${c}`)
  const targetHit = yield ProxyTarget.count({ where: { success: true } })
  log.info(`Total Project Target hit: ${targetHit}`)
  const targetRemain = yield ProxyTarget.count({ where: { success: false } })
  log.info(`Total Project Target remain: ${targetRemain}`)
})

const stop = co.wrap(function*() {
  log.info('Stopping project')
  return sequelize.close()
})

const compose = co.wrap(function*() {
  yield init()
  yield run()
  yield report()
  yield stop()
})

compose()

// init()
//   .then(start)
//   .then(spawn)
//   .then(() => {
//     console.log('done')
//     sequelize.close()
//   })

// ProxyData.destroy({where: {}})
// sequelize.close()
