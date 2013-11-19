exports.development = {
    main: {
        driver:   'redis-hq',
        database: 1,
        backyard: {
            driver: 'mysql',
            database: 'gitcities',
            username: 'root',
            password: '',
            slave: true
        }
    }
};

exports.test = {
    main: {
        driver:   'redis-hq',
        database: 2
    }
};

exports.production = {
    main: {
        driver:   'redis-hq',
        database: 3,
        backyard: {
            driver: 'mysql',
            database: 'gitcities',
            username: 'git',
            slave: true
        }
    }
};
