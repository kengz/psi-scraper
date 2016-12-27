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
    log.info(`Initialize project: ${this.spec.name}`)
    const seedTarget = {
      url: this.spec.url,
    }
    return ProxyTarget.findOrCreate({ where: seedTarget })
  }

  // internal method for run
  findTargets(options = { limit: null, where: { success: false } }) {
    return co(function*() {
      const targetObjs = yield ProxyTarget.findAll(options)
      const targets = _.map(targetObjs, 'dataValues')
      return targets
    }.bind(this))
  }

  spawn(target) {
    log.info(`Spawn a scraper instance for target: ${target.url}`)
    return co(function*() {
      return this.scrape(target)
        .then(_.partial(this.handleSuccess, target))
        .catch(_.partial(this.handleFailure, target))
    }.bind(this))
  }

  // internal method for spawn
  handleSuccess(target, res) {
    log.info(`Data scraping successful for target: ${target.url}`)
    return co(function*() {
      // update the target
      yield ProxyTarget.update({
        success: true,
        freq: target.freq + 1,
      }, { where: target })
    }.bind(this))
  }

  // internal method fot spawn
  handleFailure(target, err) {
    log.error(_.toString(err))
    return co(function*() {
      // update the target
      yield ProxyTarget.update({
        success: false,
      }, { where: target })
    }.bind(this))
  }

  // start for each target
  start() {
    return co(function*() {
      log.info('Start project')
      let promises
      const spec = this.spec
      for (let i = 0; i < spec.maxTrials; i += spec.instances) {
        let targets = yield this.findTargets({ limit: spec.instances })
        targets = _.compact(_.times(spec.instances, (j) => {
          return targets[j] || targets[0]
        }))

        // run scrapers
        promises = yield _.map(targets, this.spawn.bind(this))
      }
      return Promise.all(promises)
    }.bind(this))
  }

  // internal method for stop
  report() {
    return co(function*() {
      const c = yield ProxyData.count({ where: {} })
      const targetHit = yield ProxyTarget.count({ where: { success: true } })
      const targetRemain = yield ProxyTarget.count({ where: { success: false } })
      log.info('Project report:')
      log.info(`Total Project Data rows: ${c}`)
      log.info(`Total Project Target hit: ${targetHit}`)
      log.info(`Total Project Target remain: ${targetRemain}`)
    }.bind(this))
  }

  stop() {
    return co(function*() {
      yield this.report()
      log.info('Stop project')
      return sequelize.close()
    }.bind(this))
  }

  run() {
    return co(function*() {
      yield this.init()
      yield this.start()
      yield this.stop()
    }.bind(this))
  }
}

const spec1 = {
  name: 'Proxy',
  instances: 3,
  maxTrials: 10,
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
      url: spec1.url,
      ip,
      country: _.trim(obj.country),
      speed: parseInt(obj.speed, 10),
      anonimity: obj.anonimity,
      usable: true,
    }
  })
  return extracted
}

// create and run an instance of xray
const scrape = co.wrap(function*(target) {
  const xray = xraySrc.get(spec1.driver)
  const res = yield xray(target.url, spec1.scope, spec1.selector)
    .paginate('.proxy__pagination a@href')
    .limit(3)
    .promisify()
    .then((res) => {
      // console.log('thwowin err')
      // throw Error
    })

  // update the db
  const data = extractData(res)
  yield _.map(data, (proxy) => {
    return ProxyData.findOrCreate({ where: proxy })
  })
})


// do a composition call
const project = new BaseProject(spec1, ProxyTarget, ProxyData, scrape)

project.run()
