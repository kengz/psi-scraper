const Promise = require('bluebird')
const co = require('co')
const _ = require('lodash')
const log = require('../src/log')
const xraySrc = require('../src/xray-src')
const { ProxyTarget, ProxyData, sequelize } = require('../db/models/index')

// init with spec, Target, Data models

class BaseProject {
  constructor(spec, ProjectTarget, ProjectData, scrape) {
    this.spec = spec
    this.ProjectTarget = ProjectTarget
    this.ProjectData = ProjectData
    this.scrape = scrape
  }

  // seed targets and start proxy project if needed
  init() {
    const seedTarget = {
      url: spec.url,
    }
    return ProxyTarget.findOrCreate({ where: seedTarget })
  }

  findTargets(options = { limit: null, where: { success: false } }) {
    return co(function*() {
      const targetObjs = yield ProxyTarget.findAll(options)
      const targets = _.map(targetObjs, 'dataValues')
      return targets
    })
  }

  handleSuccess(target, res) {
    log.info(`Scraping successful for target: ${target.url}`)
    return co(function*() {
      // update the db
      const data = extractData(res)
      yield _.map(data, (proxy) => {
        return ProxyData.findOrCreate({ where: proxy })
      })

      // update the target
      yield ProxyTarget.update({
        success: true,
        freq: target.freq + 1,
      }, { where: target })
    })
  }

  handleFailure(target, err) {
    log.error(_.toString(err))
    return co(function*() {

      // update the target
      yield ProxyTarget.update({
        success: false,
      }, { where: target })
    })
  }

  spawn(target) {
    return co(function*() {
      return this.scrape(target)
        .then(_.partial(this.handleSuccess, target))
        .catch(_.partial(this.handleFailure, target))
    }.bind(this))
  }

  report() {
    return co(function*() {
      const c = yield ProxyData.count({ where: {} })
      const targetHit = yield ProxyTarget.count({ where: { success: true } })
      const targetRemain = yield ProxyTarget.count({ where: { success: false } })
      log.info('Project report:')
      log.info(`Total Project Data rows: ${c}`)
      log.info(`Total Project Target hit: ${targetHit}`)
      log.info(`Total Project Target remain: ${targetRemain}`)
    })
  }

  stop() {
    return co(function*() {
      log.info('Stopping project')
      return sequelize.close()
    })
  }
}

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

// // create and run an instance of xray
// const spawn = co.wrap(function*(target) {
//   log.info('Spawning a scraper instance')
//   const xray = xraySrc.get(spec.driver)

//   const res = yield xray(target.url, spec.scope, spec.selector)
//     .paginate('.proxy__pagination a@href')
//     .limit(3)
//     .promisify()

//   // update the db
//   const data = extractData(res)
//   const promises = yield _.map(data, (proxy) => {
//     return ProxyData.findOrCreate({ where: proxy })
//   })

//   // outsource
//   // update the target
//   yield ProxyTarget.update({
//     success: true,
//     freq: target.freq + 1,
//   }, { where: target })

//   log.info('Scraper instance stops')
//   return Promise.all(promises)
// })


// const spawnHandle = co.wrap(function*(target) {
//   // success or failure
//   res
//   .then()
// })

// const handleSuccess = co.wrap(function*(target, res) {
//   // update the db
//   const data = extractData(res)
//   yield _.map(data, (proxy) => {
//     return ProxyData.findOrCreate({ where: proxy })
//   })

//   // update the target
//   yield ProxyTarget.update({
//     success: true,
//     freq: target.freq + 1,
//   }, { where: target })
// })

// const handleFailure = co.wrap(function*(target, err) {
//   log.error(_.toString(err))

//   // update the target
//   yield ProxyTarget.update({
//     success: false,
//   }, { where: target })
// })

// create and run an instance of xray
const scrape = co.wrap(function*(target) {
  log.info('Spawning a scraper instance')
  const xray = xraySrc.get(spec.driver)
  return xray(target.url, spec.scope, spec.selector)
    .paginate('.proxy__pagination a@href')
    .limit(3)
    .promisify()
    .then(() => {
      console.log('thwowin err')
      throw Error
    })
})

// const spawn = co.wrap(function*(target) {
//   return scrape(target)
//     .then(_.partial(handleSuccess, target))
//     .catch(_.partial(handleFailure, target))
// })


// do a composition call
const projectBase = new BaseProject(spec, ProxyTarget, ProxyData, scrape)

// start for each target
const run = co.wrap(function*() {
  log.info('Running project')
  let targets = yield projectBase.findTargets({})
  targets = _.fill(_.range(3), targets[0])
  projectBase.spawn(targets[0])
    // const promises = yield _.map(targets, projectBase.spawn)
    // return Promise.all(promises)
})



const compose = co.wrap(function*() {
  const lol = yield projectBase.init()
    // const targets = yield projectBase.findTargets()
    // console.log(targets)
    // yield init()
  yield run()
    // yield report()
    // yield stop()
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
