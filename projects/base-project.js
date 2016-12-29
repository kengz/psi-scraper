const Promise = require('bluebird')
const co = require('co')
const _ = require('lodash')
const log = require('../src/log')
const xraySrc = require('../src/xray-src')
const { sequelize } = require('../db/models/index')

class Project {
  constructor(spec, ProjectTarget, ProjectData, scrape) {
    this.spec = spec
    this.ProjectTarget = ProjectTarget
    this.ProjectData = ProjectData
    this.scrape = scrape
  }

  // seed targets and start proxy project if needed
  init() {
    return co(function* fn() {
      log.info(`Initialize project: ${this.spec.name}`)
      if (this.spec.useProxies) {
        yield xraySrc.insertManualProxiesToDb()
        yield xraySrc.loadDbProxies()
        yield xraySrc.verifyProxies()
      }
      const seedTarget = {
        url: this.spec.url,
      }
      yield this.ProjectTarget.findOrCreate({ where: seedTarget })
    }.bind(this))
  }

  // internal method for run
  findTargets(options = { limit: this.spec.instances, where: { success: false } }) {
    return co(function* fn() {
      const targetObjs = yield this.ProjectTarget.findAll(options)
      const targets = _.map(targetObjs, 'dataValues')
      return targets
    }.bind(this))
  }

  spawn(target) {
    log.info(`Spawn a scraper instance for target: ${target.url}`)
    return co(function* fn() {
      const xray = xraySrc.get(this.spec)
      yield this.scrape(target, xray)
        .then(_.bind(this.handleSuccess, this, target))
        .catch(_.bind(this.handleFailure, this, target))
    }.bind(this))
  }

  // internal method for spawn
  handleSuccess(target, data) {
    log.info(`Data scraping successful with ${_.size(data)} rows for target: ${target.url}`)
    return co(function* fn() {
      // update the target
      yield this.ProjectTarget.update({
        success: true,
        freq: target.freq + 1,
      }, { where: target })
    }.bind(this))
  }

  // internal method fot spawn
  handleFailure(target, err) {
    log.error(_.toString(err))
    return co(function* fn() {
      // update the target
      yield this.ProjectTarget.update({
        success: false,
      }, { where: target })
    }.bind(this))
  }

  // start for each target
  start() {
    return co(function* fn() {
      log.info('Start project')
      let promises
      const spec = this.spec
      for (let i = 0; i < spec.maxTrials; i += spec.instances) {
        let targets = yield this.findTargets()
        targets = _.compact(_.times(spec.instances, j => targets[j] || targets[0]))

        // run scrapers
        promises = yield _.map(targets, this.spawn.bind(this))
      }
      return Promise.all(promises)
    }.bind(this))
  }

  // internal method for stop
  report() {
    return co(function* fn() {
      const c = yield this.ProjectData.count({ where: {} })
      const targetHit = yield this.ProjectTarget.count({ where: { success: true } })
      const targetRemain = yield this.ProjectTarget.count({ where: { success: false } })
      log.info('Project report:')
      log.info(`Total Project Data rows: ${c}`)
      log.info(`Total Project Target hit: ${targetHit}`)
      log.info(`Total Project Target remain: ${targetRemain}`)
    }.bind(this))
  }

  run() {
    return co(function* fn() {
      yield this.init()
      yield this.start()
    }.bind(this))
  }

  reset(confirm = false) {
    return co(function* fn() {
      if (confirm) {
        log.warn(`Clearing Target and Data DB for Project: ${this.spec.name}`)
        yield this.ProjectTarget.destroy({ where: {} })
        yield this.ProjectData.destroy({ where: {} })
      } else {
        const warning = `Are you sure you wish to reset project ${this.spec.name} and clear all project data? You need to confirm by passing a true argument.`
        log.warn(warning)
      }
      const tc = yield this.ProjectTarget.count({ where: {} })
      const dc = yield this.ProjectData.count({ where: {} })
      log.info(`Project Target rows: ${tc}`)
      log.info(`Project Data rows: ${dc}`)
    }.bind(this))
  }

  stop() {
    return co(function* fn() {
      yield this.report()
      log.info('Stop project')
      return sequelize.close()
    }.bind(this))
  }
}


module.exports = {
  Project,
}
