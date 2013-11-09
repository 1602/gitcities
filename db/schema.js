define('User', function() {
    property('username', String, { index: true });
    property('email', String, { index: true });
    property('authorOf', []);
    property('karma', Number, {sort: true});
    property('kriyamanaKarma', Number, {sort: true});
    property('nishkamKarma', Number, {sort: true});
    property('lastCheckedAt', Date, {sort: true, default: function () {return new Date(0)}});

    set('defaultSort', 'nishkamKarma DESC');
});

define('Commit', function() {
    property('id', String);
    property('userId', Number, {index: true});
    property('repoId', Number, {index: true});
    property('date', Date);

    set('defaultSort', 'date DESC');
});

define('Repository', function() {
    property('name', String, {index: true});
    property('lastCheckedAt', Date, {default: function () {return new Date(0)}});
    property('karma', Number);
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
    property('count', Number)

    set('defaultSort', 'count DESC');
});
