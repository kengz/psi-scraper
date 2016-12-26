const _ = require('lodash')
const log = require('./log')
const xraySrc = require('./xray-src')

// const param = {
//   dynamic: true,
//   url: 'http://www.imdb.com/',
//   selector: 'a',
// }

const xray = xraySrc.get()
  // const url = 'http://www.flyertalk.com/forum/'
// const url = 'http://www.imdb.com/'
const url = 'https://incloak.com/proxy-list/'
  // const selector = ['.alt1Active a@href']

// const scope = '.proxy__t tr'
// const selector = [{
//   ip: 'td:nth-child(1)',
//   port: 'td:nth-child(2)',
//   country: 'td:nth-child(3)',
//   speed: 'td:nth-child(4)',
//   anonimity: 'td:nth-child(6)',
// }]
const scope = undefined
const selector = ['.proxy__t tr td']

xray(url, selector)
  .paginate('.proxy__pagination a@href')
  .limit(1)
  .promisify()
  .then((res) => {
    console.log(res)
    console.log(_.size(res))
  })

// // // still need dynamic vs not
// const x = xraySrc.get(false)
// const a = x('http://www.imdb.com/', {
//   title: ['title'],
//   links: x('.rhs-body .rhs-row', [{
//     text: 'a',
//     href: 'a@href',
//     next_page: x('a@href', {
//       title: 'title',
//       heading: 'h1'
//     })
//   }])
// })(function (err, obj) {
//   console.log(err, obj)
// })
// console.log(a)

// should defer most of crawling logic to program instead of static json spec
