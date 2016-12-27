const co = require('co')
const { project } = require('./projects/proxy')

co(function* fn() {
  yield project.reset(true)
  yield project.run()
  yield project.stop()
})
