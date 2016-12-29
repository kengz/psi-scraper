# psi-scraper
The Ion Cannon for scraper, with json configs, proxy, Gulp build system, parallelization, Sequelize data model.


## Installation

1. clone this repo
2. install dependencies with `npm run setup` (this runs `npm i` too)
3. setup `config/` for your db, run `npm i -g sequelize-cli`


## Usage

All commands should be ran via `npm start`, which sources from `index.js`.

First, setup your project. We will use the core `Proxy` project as example.

1. create a new project in `projects/proxy.js`.
2. create new db models for the `ProxyTarget` and `ProxyData` from the terminal. Edit the `db/migrations` or `db/models` as needed:

    ```shell
    # for scraping target
    sequelize model:create --name ProxyTarget --attributes "url:string success:boolean freq:integer"
    # for scraping data storage
    sequelize model:create --name ProxyData --attributes "url:string ip:string country:string speed:integer anonimity:string usable:boolean"
    ```

3. run db migration: `npm run setup`
4. setup the project `projects/proxy.js`.
    1. import `Project, ProxyTarget, ProxyData`.
    2. implement project `spec` with the example keys
    3. implement the `scrape` method for scraping and data parsing, insertion logic
    4. construct a new project instance `const project = new Project(spec, ProxyTarget, ProxyData, scrape)`
    5. export the project
5. import the project in `index.js` and specify the steps to run, options are `resetTarget, resetData, reset, run, stop`. Refer to `projects/base-projects.js` for details on these methods.
6. run `npm start`


## Development

#### ESLint

```shell
npm run lint
```

## Roadmap

- [x] data model and migration for VisitedLinks
- [ ] scrape Flyertalk forum as first target

