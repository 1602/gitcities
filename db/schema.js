exports.main = function(db) {

    db.define('User', function(m) {
        m.property('username', String, { index: true, limit: 100});
        m.property('email', String, { index: true, limit: 100 });
        m.property('authorOf', []);
        m.property('karma', Number, {sort: true});
        m.property('kriyamanaKarma', Number, {sort: true});
        m.property('nishkamKarma', Number, {sort: true});
        m.property('lastCheckedAt', Date, {sort: true, default: function () {return new Date(0)}});

        m.property('avatar', String);
        m.property('name', String);
        m.property('location', String);
        m.property('publicRepos', Number);
        m.property('followers', Number);
        m.property('following', Number);
        m.property('languages', [], {index: true, limit: 100});
        m.property('visitedAt', Date, {sort: true, index: true});

        m.set('defaultSort', 'nishkamKarma DESC');
        m.set('expire', 3);
    });

    db.define('Commit', function(m) {
        m.property('id', String);
        m.property('userId', String, {index: true, limit: 100});
        m.property('repoId', Number, {index: true});
        m.property('message', String);
        m.property('date', Date);

        m.set('defaultSort', 'date DESC');
        m.set('expire', 3);
    });

    db.define('Repository', function(m) {
        m.property('name', String, {index: true, limit: 100});
        m.property('ownerId', Number);
        m.property('owner', JSON);
        m.property('lastCheckedAt', Date, {default: function () {return new Date(0)}});
        m.property('createdAt', Date);
        m.property('pushedAt', Date);
        m.property('karma', Number, {sort: true});
        m.property('watchers', Number);
        m.property('stars', Number);
        m.property('forks', Number);
        m.property('size', Number);
        m.property('issues', Number);
        m.property('network', Number);
        m.property('subscribers', Number);
        m.property('language', String, {index: true, limit: 100});

        m.set('defaultSort', 'lastCheckedAt ASC');
        m.set('expire', 3);
    });

    db.define('Contribution', function(m) {
        m.property('id', String);
        m.property('count', Number);
        m.property('weight', Number);
        m.property('updatedAt', Date);
        m.property('u', JSON);

        m.set('defaultSort', 'weight DESC');
        m.set('expire', 3);
    });

    function JSON(){}

};
