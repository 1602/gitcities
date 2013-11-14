define('User', function() {
    property('username', String, { index: true });
    property('email', String, { index: true });
    property('authorOf', []);
    property('karma', Number, {sort: true});
    property('kriyamanaKarma', Number, {sort: true});
    property('nishkamKarma', Number, {sort: true});
    property('lastCheckedAt', Date, {sort: true, default: function () {return new Date(0)}});

    property('avatar', String);
    property('name', String);
    property('location', String);
    property('publicRepos', Number);
    property('followers', Number);
    property('following', Number);
    property('languages', [], {index: true});
    property('visitedAt', Date, {sort: true, index: true});

    set('defaultSort', 'nishkamKarma DESC');
});

define('Commit', function() {
    property('id', String);
    property('userId', String, {index: true});
    property('repoId', Number, {index: true});
    property('message', String);
    property('date', Date);

    set('defaultSort', 'date DESC');
});

define('Repository', function() {
    property('name', String, {index: true});
    property('ownerId', Number);
    property('owner', JSON);
    property('lastCheckedAt', Date, {default: function () {return new Date(0)}});
    property('createdAt', Date);
    property('pushedAt', Date);
    property('karma', Number, {sort: true});
    property('watchers', Number);
    property('stars', Number);
    property('forks', Number);
    property('size', Number);
    property('issues', Number);
    property('network', Number);
    property('subscribers', Number);
    property('language', String, {index: true});

    set('defaultSort', 'lastCheckedAt ASC');
});

define('Contribution', function() {
    property('id', String);
    property('count', Number);
    property('weight', Number);
    property('updatedAt', Date);
    property('u', JSON);

    set('defaultSort', 'weight DESC');
});

function JSON(){}
