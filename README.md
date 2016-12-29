# psi-scraper
The Ion Cannon for scraper, with proxy, robust logic control, parallelization, Sequelize data model.

**Use with caution.** You can spawn 10 or 100,000 scraping instances with just a change of param, but please be considerate and don't DDOS people.


## Installation

1. fork and clone this repo
2. install dependencies with `npm run setup` (this runs `npm i` too)
3. setup `config/` for your mysql db, run `npm i -g sequelize-cli`


## Usage

Scrapings are organized as projects, which are constructed from the same `projects/base-project.js` framework with its logic. This allows you to only specify a minimal project-specific details under `projects/`, and run.

An example project `projects/proxy.js` is already included. Written in 70 lines - it shows the setup speed of this tool. Also, the `proxy` project is used internally for automatic proxy scraping, which gets the list of proxies for your other projects.

Specify projects to run in `index.js`, and run `npm start`.

### Project setup

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


Sample log on running:

```shell
[Thu Dec 29 2016 13:36:34 GMT-0500 (EST)] WARN Clearing only Target DB for Project: Proxy
[Thu Dec 29 2016 13:36:34 GMT-0500 (EST)] INFO Project Target rows: 0
[Thu Dec 29 2016 13:36:34 GMT-0500 (EST)] INFO Initialize project: Proxy
[Thu Dec 29 2016 13:36:34 GMT-0500 (EST)] INFO Start project
[Thu Dec 29 2016 13:36:34 GMT-0500 (EST)] INFO Spawn a scraper instance for target: https://incloak.com/proxy-list/
[Thu Dec 29 2016 13:36:34 GMT-0500 (EST)] INFO Spawn a scraper instance for target: https://incloak.com/proxy-list/
[Thu Dec 29 2016 13:36:40 GMT-0500 (EST)] INFO Data scraping successful with 74 rows for target: https://incloak.com/proxy-list/
[Thu Dec 29 2016 13:36:40 GMT-0500 (EST)] INFO Data scraping successful with 74 rows for target: https://incloak.com/proxy-list/
[Thu Dec 29 2016 13:36:40 GMT-0500 (EST)] INFO Project report:
[Thu Dec 29 2016 13:36:40 GMT-0500 (EST)] INFO Total Project Data rows: 186
[Thu Dec 29 2016 13:36:40 GMT-0500 (EST)] INFO Total Project Target hit: 1
[Thu Dec 29 2016 13:36:40 GMT-0500 (EST)] INFO Total Project Target remain: 0
[Thu Dec 29 2016 13:36:40 GMT-0500 (EST)] INFO Stop project
```

## Development

#### ESLint

```shell
npm run lint
```

## Roadmap

- [ ] scrape Flyertalk forum as first target

